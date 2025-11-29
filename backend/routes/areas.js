const express = require('express');
const { body, validationResult } = require('express-validator');
const Area = require('../models/Area');
const Reservation = require('../models/Reservation');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/areas - Listar áreas do condomínio
router.get('/', authenticate, async (req, res) => {
  try {
    const query = { isActive: true };
    
    // Filtrar por condomínio se não for master admin
    if (!req.user.isMasterAdmin) {
      query.condominium = req.user.condominium._id;
    } else if (req.query.condominiumId) {
      query.condominium = req.query.condominiumId;
    }

    const areas = await Area.find(query)
      .populate('condominium', 'name')
      .sort({ name: 1 });
    res.json(areas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar áreas', error: error.message });
  }
});

// GET /api/areas/:id - Buscar área por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const area = await Area.findById(req.params.id).populate('condominium', 'name');
    if (!area) {
      return res.status(404).json({ message: 'Área não encontrada' });
    }
    res.json(area);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar área', error: error.message });
  }
});

// GET /api/areas/:id/availability - Verificar disponibilidade de uma área
router.get('/:id/availability', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({ message: 'Área não encontrada' });
    }

    // Calcular período (mês atual ou especificado)
    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // Buscar reservas aprovadas ou pendentes no período
    const reservations = await Reservation.find({
      areaId: req.params.id,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['pendente', 'aprovada'] }
    }).select('date timeSlot status');

    // Agrupar por data
    const reservationsByDate = {};
    reservations.forEach(r => {
      const dateStr = r.date.toISOString().split('T')[0];
      if (!reservationsByDate[dateStr]) {
        reservationsByDate[dateStr] = [];
      }
      reservationsByDate[dateStr].push({
        timeSlot: r.timeSlot,
        status: r.status
      });
    });

    // Gerar calendário de disponibilidade
    const availability = {};
    const daysInMonth = endDate.getDate();
    
    // Data de hoje para comparação (sem hora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonth, day);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      // Verificar se é um dia disponível
      const isDayAvailable = area.availableDays.includes(dayOfWeek);
      
      // Verificar se a data não é passada
      const isPastDate = date < today;
      
      // Contar reservas do dia
      const dayReservations = reservationsByDate[dateStr] || [];
      const reservedSlots = dayReservations.length;
      const maxReservations = area.rules.maxReservationsPerDay;
      
      // Calcular slots disponíveis
      const totalSlots = area.availableSlots.length || 1;
      const availableSlots = totalSlots - reservedSlots;
      
      availability[dateStr] = {
        available: isDayAvailable && !isPastDate && availableSlots > 0,
        isDayAvailable,
        isPastDate,
        totalSlots,
        reservedSlots,
        availableSlots: Math.max(0, availableSlots),
        reservations: dayReservations
      };
    }

    res.json({
      area: {
        _id: area._id,
        name: area.name,
        availableSlots: area.availableSlots,
        availableDays: area.availableDays,
        rules: area.rules
      },
      month: targetMonth + 1,
      year: targetYear,
      availability
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao verificar disponibilidade', error: error.message });
  }
});

// GET /api/areas/:id/calendar - Calendário com reservas (para gestores)
router.get('/:id/calendar', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      areaId: req.params.id,
      status: { $in: ['pendente', 'aprovada'] }
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const reservations = await Reservation.find(query)
      .populate('userId', 'name unit phone')
      .sort({ date: 1, timeSlot: 1 });

    // Group by date
    const calendar = {};
    reservations.forEach(reservation => {
      const dateStr = reservation.date.toISOString().split('T')[0];
      if (!calendar[dateStr]) {
        calendar[dateStr] = [];
      }
      calendar[dateStr].push({
        id: reservation._id,
        timeSlot: reservation.timeSlot,
        user: reservation.userId ? {
          name: reservation.userId.name,
          unit: reservation.userId.unit,
          phone: reservation.userId.phone
        } : null,
        status: reservation.status
      });
    });

    res.json(calendar);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar calendário', error: error.message });
  }
});

// POST /api/areas - Criar área (zelador/sindico)
router.post('/', authenticate, authorize(['zelador', 'sindico']), [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('rules.maxReservationsPerDay').optional().isInt({ min: 1 }),
  body('rules.capacity').optional().isInt({ min: 1 }),
  body('rules.fee').optional().isFloat({ min: 0 }),
  body('rules.feePercentage').optional().isFloat({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      description, 
      rules, 
      availableSlots, 
      availableDays,
      imageUrl 
    } = req.body;

    // Verificar se já existe área com mesmo nome no condomínio
    const existingArea = await Area.findOne({ 
      name, 
      condominium: req.user.condominium._id 
    });
    
    if (existingArea) {
      return res.status(400).json({ message: 'Já existe uma área com este nome no condomínio' });
    }

    const area = new Area({
      name,
      description,
      condominium: req.user.condominium._id,
      rules: {
        maxReservationsPerDay: rules?.maxReservationsPerDay || 1,
        capacity: rules?.capacity || null,
        fee: rules?.fee || 0,
        feePercentage: rules?.feePercentage || 0,
        cancellationDeadline: rules?.cancellationDeadline || 24,
        minAdvanceBooking: rules?.minAdvanceBooking || 24,
        maxAdvanceBooking: rules?.maxAdvanceBooking || 30,
        requiresApproval: rules?.requiresApproval !== false
      },
      availableSlots: availableSlots || ['08:00 - 12:00', '14:00 - 18:00', '19:00 - 23:00'],
      availableDays: availableDays || [0, 1, 2, 3, 4, 5, 6],
      imageUrl
    });

    await area.save();
    await area.populate('condominium', 'name');
    
    res.status(201).json(area);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar área', error: error.message });
  }
});

// PUT /api/areas/:id - Atualizar área (zelador/sindico)
router.put('/:id', authenticate, authorize(['zelador', 'sindico']), async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Área não encontrada' });
    }

    // Verificar se pertence ao mesmo condomínio
    if (!req.user.isMasterAdmin && 
        area.condominium.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { 
      name, 
      description, 
      rules, 
      availableSlots, 
      availableDays,
      imageUrl,
      isActive 
    } = req.body;

    if (name) area.name = name;
    if (description !== undefined) area.description = description;
    if (rules) area.rules = { ...area.rules.toObject(), ...rules };
    if (availableSlots) area.availableSlots = availableSlots;
    if (availableDays) area.availableDays = availableDays;
    if (imageUrl !== undefined) area.imageUrl = imageUrl;
    if (isActive !== undefined) area.isActive = isActive;

    await area.save();
    await area.populate('condominium', 'name');
    
    res.json(area);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar área', error: error.message });
  }
});

// DELETE /api/areas/:id - Desativar área (zelador/sindico)
router.delete('/:id', authenticate, authorize(['zelador', 'sindico']), async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: 'Área não encontrada' });
    }

    // Verificar se pertence ao mesmo condomínio
    if (!req.user.isMasterAdmin && 
        area.condominium.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Soft delete
    area.isActive = false;
    await area.save();

    res.json({ message: 'Área desativada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao desativar área', error: error.message });
  }
});

module.exports = router;
