const express = require('express');
const { body, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Reservation = require('../models/Reservation');
const Area = require('../models/Area');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { sendPushNotification, sendPushToMultiple } = require('../utils/pushNotifications');

const router = express.Router();

// Helper para enviar notificação para gestores do condomínio
const notifyManagers = async (condominiumId, title, body, data = {}) => {
  try {
    const managers = await User.find({
      condominium: condominiumId,
      role: { $in: ['porteiro', 'zelador', 'sindico'] }
    }).select('_id pushToken');

    if (managers.length > 0) {
      await sendPushToMultiple(managers, title, body, data);
    }
  } catch (error) {
    console.error('Erro ao notificar gestores:', error);
  }
};

// GET /api/reservations - Listar todas as reservas (para porteiro/zelador/sindico)
router.get('/', authenticate, authorize(['porteiro', 'zelador', 'sindico']), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    // Filtrar por condomínio se não for master admin
    if (!req.user.isMasterAdmin) {
      const usersInCondo = await User.find({ condominium: req.user.condominium._id }).select('_id');
      const userIds = usersInCondo.map(u => u._id);
      query.userId = { $in: userIds };
    }

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('areaId', 'name rules')
      .populate('userId', 'name email unit')
      .populate('approvedBy', 'name')
      .sort({ date: -1, createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar reservas', error: error.message });
  }
});

// GET /api/reservations/pending - Listar reservas pendentes de aprovação
router.get('/pending', authenticate, authorize(['porteiro', 'zelador', 'sindico']), async (req, res) => {
  try {
    const query = { status: 'pendente' };

    // Filtrar por condomínio se não for master admin
    if (!req.user.isMasterAdmin) {
      const usersInCondo = await User.find({ condominium: req.user.condominium._id }).select('_id');
      const userIds = usersInCondo.map(u => u._id);
      query.userId = { $in: userIds };
    }

    const reservations = await Reservation.find(query)
      .populate('areaId', 'name rules')
      .populate('userId', 'name email unit phone')
      .sort({ date: 1, createdAt: 1 });

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar reservas pendentes', error: error.message });
  }
});

// GET /api/reservations/my - Minhas reservas (para morador)
router.get('/my', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user._id };

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('areaId', 'name rules')
      .populate('approvedBy', 'name')
      .sort({ date: -1, createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar reservas', error: error.message });
  }
});

// GET /api/reservations/:id - Buscar reserva por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('areaId', 'name rules')
      .populate('userId', 'name email unit phone')
      .populate('approvedBy', 'name');

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    // Verificar permissão: morador só pode ver suas próprias reservas
    if (req.user.role === 'morador' && reservation.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar reserva', error: error.message });
  }
});

// POST /api/reservations - Criar reserva (morador)
router.post('/', authenticate, [
  body('areaId').notEmpty().withMessage('Área é obrigatória'),
  body('date').notEmpty().withMessage('Data é obrigatória'),
  body('timeSlot').trim().notEmpty().withMessage('Horário é obrigatório')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { areaId, date, timeSlot } = req.body;

    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({ message: 'Área não encontrada' });
    }

    const reservationDate = new Date(date);
    reservationDate.setHours(0, 0, 0, 0);

    // Status que bloqueiam o horário (pendente ou aprovada)
    const blockingStatuses = ['pendente', 'aprovada'];

    // Check if user already has a reservation for this area on this date
    const existingReservation = await Reservation.findOne({
      areaId,
      userId: req.user._id,
      date: reservationDate,
      status: { $in: blockingStatuses }
    });

    if (existingReservation) {
      return res.status(400).json({ 
        message: 'Você já possui uma reserva (pendente ou aprovada) para esta área nesta data' 
      });
    }

    // Check limit per day for this area
    const reservationsToday = await Reservation.countDocuments({
      areaId,
      date: reservationDate,
      status: { $in: blockingStatuses }
    });

    if (reservationsToday >= (area.rules.maxReservationsPerDay || 1)) {
      return res.status(400).json({ 
        message: 'Não há mais vagas disponíveis para esta área nesta data' 
      });
    }

    // Check if time slot is available (pendente ou aprovada bloqueia o horário)
    const conflictingReservation = await Reservation.findOne({
      areaId,
      date: reservationDate,
      timeSlot,
      status: { $in: blockingStatuses }
    });

    if (conflictingReservation) {
      return res.status(400).json({ 
        message: 'Este horário já está reservado ou aguardando aprovação' 
      });
    }

    const reservation = new Reservation({
      areaId,
      userId: req.user._id,
      date: reservationDate,
      timeSlot,
      status: area.rules.requiresApproval ? 'pendente' : 'aprovada'
    });

    await reservation.save();
    await reservation.populate('areaId', 'name rules');

    // Enviar notificação push para gestores se requer aprovação
    if (area.rules.requiresApproval) {
      const dateFormatted = reservationDate.toLocaleDateString('pt-BR');
      await notifyManagers(
        req.user.condominium._id,
        '📅 Nova Solicitação de Reserva',
        `${req.user.name} solicitou reserva da ${area.name} para ${dateFormatted} (${timeSlot})`,
        { type: 'reservation_request', reservationId: reservation._id.toString() }
      );
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar reserva', error: error.message });
  }
});

// PUT /api/reservations/:id/approve - Aprovar reserva
router.put('/:id/approve', authenticate, authorize(['porteiro', 'zelador', 'sindico']), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('areaId', 'name rules');

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    if (reservation.status !== 'pendente') {
      return res.status(400).json({ message: 'Esta reserva não está pendente de aprovação' });
    }

    // Verificar se já existe outra reserva APROVADA para o mesmo horário/data/área
    // (pode acontecer se duas reservas pendentes foram feitas e uma foi aprovada primeiro)
    const conflictingReservation = await Reservation.findOne({
      _id: { $ne: reservation._id },
      areaId: reservation.areaId._id,
      date: reservation.date,
      timeSlot: reservation.timeSlot,
      status: 'aprovada'
    });

    if (conflictingReservation) {
      return res.status(400).json({ 
        message: 'Não é possível aprovar: já existe outra reserva aprovada para este horário' 
      });
    }

    reservation.status = 'aprovada';
    reservation.approvedBy = req.user._id;
    reservation.approvedAt = new Date();
    await reservation.save();

    // Buscar usuário para enviar notificação
    const reservationUser = await User.findById(reservation.userId);
    
    // Enviar notificação push para o morador
    if (reservationUser) {
      const dateFormatted = new Date(reservation.date).toLocaleDateString('pt-BR');
      await sendPushNotification({
        to: reservationUser.pushToken,
        userId: reservationUser._id,
        title: '✅ Reserva Aprovada!',
        body: `Sua reserva da ${reservation.areaId.name} para ${dateFormatted} (${reservation.timeSlot}) foi aprovada!`,
        data: { type: 'reservation_approved', reservationId: reservation._id.toString() }
      });
    }

    await reservation.populate('userId', 'name email unit');
    await reservation.populate('approvedBy', 'name');

    res.json({ message: 'Reserva aprovada com sucesso', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao aprovar reserva', error: error.message });
  }
});

// PUT /api/reservations/:id/reject - Rejeitar reserva
router.put('/:id/reject', authenticate, authorize(['porteiro', 'zelador', 'sindico']), async (req, res) => {
  try {
    const { reason } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('areaId', 'name rules');

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    if (reservation.status !== 'pendente') {
      return res.status(400).json({ message: 'Esta reserva não está pendente de aprovação' });
    }

    reservation.status = 'rejeitada';
    reservation.approvedBy = req.user._id;
    reservation.approvedAt = new Date();
    reservation.rejectionReason = reason || 'Sem motivo informado';
    await reservation.save();

    // Buscar usuário para enviar notificação
    const reservationUser = await User.findById(reservation.userId);
    
    // Enviar notificação push para o morador
    if (reservationUser) {
      const dateFormatted = new Date(reservation.date).toLocaleDateString('pt-BR');
      const reasonText = reason ? ` Motivo: ${reason}` : '';
      await sendPushNotification({
        to: reservationUser.pushToken,
        userId: reservationUser._id,
        title: '❌ Reserva Não Aprovada',
        body: `Sua reserva da ${reservation.areaId.name} para ${dateFormatted} não foi aprovada.${reasonText}`,
        data: { type: 'reservation_rejected', reservationId: reservation._id.toString() }
      });
    }

    await reservation.populate('userId', 'name email unit');

    res.json({ message: 'Reserva rejeitada', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao rejeitar reserva', error: error.message });
  }
});

// GET /api/reservations/report/pdf - Gerar relatório PDF de reservas
router.get('/report/pdf', authenticate, authorize(['sindico', 'master']), async (req, res) => {
  try {
    const { startDate, endDate, status, areaId } = req.query;

    console.log('📊 Gerando relatório PDF:', { startDate, endDate, status, areaId });

    // Validar datas
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Data inicial e final são obrigatórias' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Construir query
    const query = {};

    // Filtrar por data
    query.date = { $gte: start, $lte: end };

    // Filtrar por condomínio - usar mesma lógica da listagem (por usuários)
    if (!req.user.isMasterAdmin) {
      const usersInCondo = await User.find({ condominium: req.user.condominium._id }).select('_id');
      const userIds = usersInCondo.map(u => u._id);
      query.userId = { $in: userIds };
    }

    if (status && status !== 'todas') {
      query.status = status;
    }

    if (areaId && areaId !== 'todas') {
      query.areaId = areaId;
    }

    console.log('📊 Query:', JSON.stringify(query));

    let reservations = await Reservation.find(query)
      .populate({
        path: 'areaId',
        select: 'name rules'
      })
      .populate({
        path: 'userId',
        select: 'name cpf unit'
      })
      .populate({
        path: 'approvedBy',
        select: 'name'
      })
      .sort({ date: 1, timeSlot: 1 });

    console.log('📊 Reservas encontradas:', reservations.length);
    
    // Debug: mostrar primeira reserva para verificar populate
    if (reservations.length > 0) {
      const firstRes = reservations[0];
      console.log('📊 Exemplo de reserva:', JSON.stringify({
        id: firstRes._id,
        userIdRaw: firstRes._doc?.userId || firstRes.userId,
        userId: firstRes.userId,
        areaId: firstRes.areaId?.name,
        date: firstRes.date
      }, null, 2));
    }

    // Buscar usuários que não foram populados (userId pode ser ObjectId ou null)
    const userIdsToFetch = reservations
      .filter(r => !r.userId || typeof r.userId !== 'object' || !r.userId.name)
      .map(r => r._doc?.userId || r.userId)
      .filter(id => id);
    
    if (userIdsToFetch.length > 0) {
      console.log('📊 Buscando usuários não populados:', userIdsToFetch.length);
      const users = await User.find({ _id: { $in: userIdsToFetch } }).select('name cpf unit');
      const usersMap = {};
      users.forEach(u => { usersMap[u._id.toString()] = u; });
      
      // Atualizar reservas com dados dos usuários
      reservations = reservations.map(r => {
        if (!r.userId || typeof r.userId !== 'object' || !r.userId.name) {
          const rawUserId = r._doc?.userId || r.userId;
          if (rawUserId && usersMap[rawUserId.toString()]) {
            r.userId = usersMap[rawUserId.toString()];
          }
        }
        return r;
      });
    }

    // Buscar nome do condomínio
    const condoName = req.user.condominium?.name || 'Condomínio';
    
    // Formatar nome do condomínio para o arquivo (remover caracteres especiais)
    const condoNameForFile = condoName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .toLowerCase();
    
    // Data atual formatada para o nome do arquivo
    const today = new Date();
    const dateForFile = `${String(today.getDate()).padStart(2, '0')}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}`;

    // Criar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Configurar headers para download
    const fileName = `${condoNameForFile}_${dateForFile}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    // Cores
    const primaryColor = '#6366F1';
    const textColor = '#1E293B';
    const grayColor = '#64748B';
    const lightGray = '#F1F5F9';

    // Header do documento
    doc.rect(0, 0, doc.page.width, 130).fill(primaryColor);
    
    // Adicionar logo
    const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 25, { width: 60 });
      } catch (e) {
        console.log('Não foi possível adicionar a logo:', e.message);
      }
    }
    
    // Título ao lado da logo
    doc.fillColor('#FFFFFF')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('Relatório de Reservas', 120, 35);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(condoName, 120, 62);

    // Período do relatório
    const startFormatted = start.toLocaleDateString('pt-BR');
    const endFormatted = end.toLocaleDateString('pt-BR');
    doc.text(`Período: ${startFormatted} a ${endFormatted}`, 120, 80);

    // Data de geração
    doc.fontSize(10)
       .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 120, 98);
    
    // Texto "Zelou" no canto direito
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Zelou', doc.page.width - 100, 35, { width: 50, align: 'right' });
    doc.fontSize(8)
       .font('Helvetica')
       .text('Gestão de Condomínios', doc.page.width - 150, 52, { width: 100, align: 'right' });

    // Posição inicial após o header
    let yPos = 150;

    // Cabeçalho da tabela
    const tableTop = yPos;
    const colWidths = [55, 95, 80, 55, 70, 50, 50, 50];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    doc.rect(50, tableTop, tableWidth, 25).fill(primaryColor);
    
    doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');
    let xPos = 53;
    const headers = ['Data', 'Morador', 'CPF', 'Unidade', 'Área', 'Horário', 'Valor', 'Status'];
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop + 9, { width: colWidths[i] - 3 });
      xPos += colWidths[i];
    });

    yPos = tableTop + 25;

    // Linhas da tabela
    doc.font('Helvetica').fontSize(8);
    
    reservations.forEach((reservation, index) => {
      // Verificar se precisa de nova página
      if (yPos > doc.page.height - 80) {
        doc.addPage();
        yPos = 50;
        
        // Repetir cabeçalho na nova página
        doc.rect(50, yPos, tableWidth, 25).fill(primaryColor);
        doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold');
        xPos = 53;
        headers.forEach((header, i) => {
          doc.text(header, xPos, yPos + 9, { width: colWidths[i] - 3 });
          xPos += colWidths[i];
        });
        yPos += 25;
        doc.font('Helvetica').fontSize(7);
      }

      // Alternar cor de fundo das linhas
      if (index % 2 === 0) {
        doc.rect(50, yPos, tableWidth, 20).fill('#F8FAFC');
      }

      const date = new Date(reservation.date).toLocaleDateString('pt-BR');
      
      // Verificar se userId foi populado corretamente
      const userPopulated = reservation.userId && typeof reservation.userId === 'object' && reservation.userId.name;
      let morador, cpf, unit;
      
      if (userPopulated) {
        morador = reservation.userId.name;
        cpf = reservation.userId.cpf || '-';
        unit = reservation.userId.unit
          ? (reservation.userId.unit.block 
            ? `${reservation.userId.unit.block} - ${reservation.userId.unit.number}` 
            : reservation.userId.unit.number || '-')
          : '-';
      } else {
        morador = 'Usuário removido';
        cpf = '-';
        unit = '-';
      }
      
      // Verificar se areaId foi populado corretamente
      const areaPopulated = reservation.areaId && typeof reservation.areaId === 'object';
      const area = areaPopulated ? (reservation.areaId.name || 'Sem nome') : 'Área não encontrada';
      const timeSlot = reservation.timeSlot || '-';
      const fee = areaPopulated && reservation.areaId.rules ? (reservation.areaId.rules.fee || 0) : 0;
      const feeFormatted = fee > 0 ? `R$ ${fee.toFixed(2).replace('.', ',')}` : 'Grátis';
      
      let statusText = reservation.status;
      let statusColor = grayColor;
      switch (reservation.status) {
        case 'aprovada': statusColor = '#10B981'; statusText = 'Aprovada'; break;
        case 'pendente': statusColor = '#F59E0B'; statusText = 'Pendente'; break;
        case 'rejeitada': statusColor = '#EF4444'; statusText = 'Rejeitada'; break;
        case 'cancelada': statusColor = '#6B7280'; statusText = 'Cancelada'; break;
      }

      xPos = 53;
      doc.fillColor(textColor).fontSize(7);
      doc.text(date, xPos, yPos + 6, { width: colWidths[0] - 3 });
      xPos += colWidths[0];
      doc.text(morador.substring(0, 14), xPos, yPos + 6, { width: colWidths[1] - 3 });
      xPos += colWidths[1];
      doc.text(cpf, xPos, yPos + 6, { width: colWidths[2] - 3 });
      xPos += colWidths[2];
      doc.text(unit, xPos, yPos + 6, { width: colWidths[3] - 3 });
      xPos += colWidths[3];
      doc.text(area.substring(0, 10), xPos, yPos + 6, { width: colWidths[4] - 3 });
      xPos += colWidths[4];
      doc.text(timeSlot, xPos, yPos + 6, { width: colWidths[5] - 3 });
      xPos += colWidths[5];
      doc.fillColor(fee > 0 ? '#059669' : grayColor).text(feeFormatted, xPos, yPos + 6, { width: colWidths[6] - 3 });
      xPos += colWidths[6];
      doc.fillColor(statusColor).text(statusText, xPos, yPos + 6, { width: colWidths[7] - 3 });

      yPos += 20;
    });

    // Calcular total arrecadado (apenas reservas aprovadas)
    const totalFee = reservations
      .filter(r => r.status === 'aprovada')
      .reduce((sum, r) => sum + (r.areaId?.rules?.fee || 0), 0);

    // Adicionar resumo financeiro
    yPos += 20;
    if (yPos > doc.page.height - 100) {
      doc.addPage();
      yPos = 50;
    }

    doc.rect(50, yPos, tableWidth, 40).fill(lightGray);
    doc.fillColor(textColor).fontSize(12).font('Helvetica-Bold');
    doc.text('Resumo Financeiro', 60, yPos + 10);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total arrecadado (reservas aprovadas): R$ ${totalFee.toFixed(2).replace('.', ',')}`, 60, yPos + 25);

    // Rodapé
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fillColor(grayColor).fontSize(8);
      doc.text(
        `Página ${i + 1} de ${pageCount}`,
        50,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width - 100 }
      );
    }

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar relatório PDF:', error);
    res.status(500).json({ message: 'Erro ao gerar relatório', error: error.message });
  }
});

// DELETE /api/reservations/:id - Cancelar reserva
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    // Check permission
    if (req.user.role === 'morador' && reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Check cancellation deadline
    const area = await Area.findById(reservation.areaId);
    const now = new Date();
    const reservationDate = new Date(reservation.date);
    const hoursUntilReservation = (reservationDate - now) / (1000 * 60 * 60);

    if (hoursUntilReservation < area.rules.cancellationDeadline) {
      return res.status(400).json({ 
        message: `Cancelamento deve ser feito com pelo menos ${area.rules.cancellationDeadline} horas de antecedência` 
      });
    }

    reservation.status = 'cancelada';
    reservation.canceledAt = new Date();
    await reservation.save();

    res.json({ message: 'Reserva cancelada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cancelar reserva', error: error.message });
  }
});

module.exports = router;


