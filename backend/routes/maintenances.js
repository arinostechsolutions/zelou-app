const express = require('express');
const { body, validationResult } = require('express-validator');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { sendPushToMultiple } = require('../utils/pushNotifications');

const router = express.Router();

// GET /api/maintenances - Listar manutenções do condomínio
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = { condominium: req.user.condominium._id };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const maintenances = await Maintenance.find(query)
      .populate('createdBy', 'name')
      .sort({ startDate: -1, createdAt: -1 });

    res.json(maintenances);
  } catch (error) {
    console.error('Erro ao buscar manutenções:', error);
    res.status(500).json({ message: 'Erro ao buscar manutenções', error: error.message });
  }
});

// GET /api/maintenances/upcoming - Listar próximas manutenções (agendadas e em andamento)
router.get('/upcoming', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maintenances = await Maintenance.find({
      condominium: req.user.condominium._id,
      status: { $in: ['agendada', 'em_andamento'] },
      startDate: { $gte: today }
    })
      .populate('createdBy', 'name')
      .sort({ startDate: 1 })
      .limit(10);

    res.json(maintenances);
  } catch (error) {
    console.error('Erro ao buscar próximas manutenções:', error);
    res.status(500).json({ message: 'Erro ao buscar manutenções', error: error.message });
  }
});

// GET /api/maintenances/:id - Buscar manutenção por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('condominium', 'name');

    if (!maintenance) {
      return res.status(404).json({ message: 'Manutenção não encontrada' });
    }

    // Verificar se pertence ao mesmo condomínio
    if (maintenance.condominium._id.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Erro ao buscar manutenção:', error);
    res.status(500).json({ message: 'Erro ao buscar manutenção', error: error.message });
  }
});

// POST /api/maintenances - Criar manutenção (síndico e zelador)
router.post('/', authenticate, authorize(['sindico', 'zelador']), [
  body('title').trim().notEmpty().withMessage('Título é obrigatório'),
  body('type').notEmpty().withMessage('Tipo é obrigatório'),
  body('startDate').notEmpty().withMessage('Data de início é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      type,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      responsible,
      images,
      notes
    } = req.body;

    const maintenance = new Maintenance({
      title,
      description,
      type,
      startDate: new Date(startDate),
      startTime: startTime || null,
      endDate: endDate ? new Date(endDate) : null,
      endTime: endTime || null,
      location,
      responsible,
      images: images || [],
      notes,
      condominium: req.user.condominium._id,
      createdBy: req.user._id
    });

    await maintenance.save();
    await maintenance.populate('createdBy', 'name');

    // Enviar notificação push para todos os usuários do condomínio
    const users = await User.find({
      condominium: req.user.condominium._id,
      _id: { $ne: req.user._id }
    }).select('_id pushToken');

    if (users.length > 0) {
      const typeLabels = {
        eletrica: 'Elétrica',
        hidraulica: 'Hidráulica',
        elevador: 'Elevador',
        pintura: 'Pintura',
        limpeza: 'Limpeza',
        jardinagem: 'Jardinagem',
        seguranca: 'Segurança',
        estrutural: 'Estrutural',
        gas: 'Gás',
        interfone: 'Interfone',
        portao: 'Portão',
        iluminacao: 'Iluminação',
        dedetizacao: 'Dedetização',
        outro: 'Outro'
      };

      const dateFormatted = new Date(startDate).toLocaleDateString('pt-BR');
      
      await sendPushToMultiple(
        users,
        '🔧 Nova Manutenção Agendada',
        `${typeLabels[type] || type}: ${title} - ${dateFormatted}`,
        { type: 'maintenance', maintenanceId: maintenance._id.toString() }
      );
    }

    res.status(201).json(maintenance);
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    res.status(500).json({ message: 'Erro ao criar manutenção', error: error.message });
  }
});

// PUT /api/maintenances/:id - Atualizar manutenção (síndico e zelador)
router.put('/:id', authenticate, authorize(['sindico', 'zelador']), async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({ message: 'Manutenção não encontrada' });
    }

    // Verificar se pertence ao mesmo condomínio
    if (maintenance.condominium.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const {
      title,
      description,
      type,
      status,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      responsible,
      images,
      notes
    } = req.body;

    // Atualizar campos
    if (title) maintenance.title = title;
    if (description !== undefined) maintenance.description = description;
    if (type) maintenance.type = type;
    if (status) maintenance.status = status;
    if (startDate) maintenance.startDate = new Date(startDate);
    if (startTime !== undefined) maintenance.startTime = startTime;
    if (endDate !== undefined) maintenance.endDate = endDate ? new Date(endDate) : null;
    if (endTime !== undefined) maintenance.endTime = endTime;
    if (location !== undefined) maintenance.location = location;
    if (responsible !== undefined) maintenance.responsible = responsible;
    if (images) maintenance.images = images;
    if (notes !== undefined) maintenance.notes = notes;

    await maintenance.save();
    await maintenance.populate('createdBy', 'name');

    res.json(maintenance);
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    res.status(500).json({ message: 'Erro ao atualizar manutenção', error: error.message });
  }
});

// PUT /api/maintenances/:id/status - Atualizar status da manutenção
router.put('/:id/status', authenticate, authorize(['sindico', 'zelador']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['agendada', 'em_andamento', 'concluida', 'cancelada'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({ message: 'Manutenção não encontrada' });
    }

    if (maintenance.condominium.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    maintenance.status = status;
    await maintenance.save();
    await maintenance.populate('createdBy', 'name');

    // Notificar usuários sobre mudança de status
    if (status === 'em_andamento' || status === 'concluida') {
      const users = await User.find({
        condominium: req.user.condominium._id,
        _id: { $ne: req.user._id }
      }).select('_id pushToken');

      if (users.length > 0) {
        const statusMessages = {
          em_andamento: '🔧 Manutenção em Andamento',
          concluida: '✅ Manutenção Concluída'
        };

        await sendPushToMultiple(
          users,
          statusMessages[status],
          maintenance.title,
          { type: 'maintenance', maintenanceId: maintenance._id.toString() }
        );
      }
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro ao atualizar status', error: error.message });
  }
});

// DELETE /api/maintenances/:id - Deletar manutenção (síndico e zelador)
router.delete('/:id', authenticate, authorize(['sindico', 'zelador']), async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({ message: 'Manutenção não encontrada' });
    }

    if (maintenance.condominium.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Manutenção deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar manutenção:', error);
    res.status(500).json({ message: 'Erro ao deletar manutenção', error: error.message });
  }
});

module.exports = router;

