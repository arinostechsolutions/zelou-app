const express = require('express');
const { body, validationResult } = require('express-validator');
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


