const express = require('express');
const { body, validationResult } = require('express-validator');
const Visitor = require('../models/Visitor');
const { auth, isPorteiro, isMorador } = require('../middleware/auth');

const router = express.Router();

// GET /api/visitors
router.get('/', auth, async (req, res) => {
  try {
    const { date, status } = req.query;
    const query = {};

    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.createdAt = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    if (status) {
      query.status = status;
    }

    // Filter by role
    if (req.user.role === 'morador') {
      query.residentId = req.user._id;
    }
    // Porteiro, zelador and sindico can see all

    const visitors = await Visitor.find(query)
      .populate('residentId', 'name unit')
      .sort({ createdAt: -1 });

    res.json(visitors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar visitantes', error: error.message });
  }
});

// POST /api/visitors
router.post('/', [auth, isMorador], [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('reason').trim().notEmpty().withMessage('Motivo é obrigatório'),
  body('cpf').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, cpf, reason } = req.body;

    const visitor = new Visitor({
      name,
      cpf: cpf || null,
      reason,
      residentId: req.user._id,
      unit: req.user.unit,
      status: 'pendente'
    });

    await visitor.save();
    await visitor.populate('residentId', 'name unit');

    res.status(201).json(visitor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar visitante', error: error.message });
  }
});

// PUT /api/visitors/:id/entrada
router.put('/:id/entrada', [auth, isPorteiro], async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: 'Visitante não encontrado' });
    }

    visitor.status = 'liberado';
    visitor.entryAt = new Date();

    await visitor.save();
    await visitor.populate('residentId', 'name unit');

    res.json(visitor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao liberar entrada', error: error.message });
  }
});

// PUT /api/visitors/:id/saida
router.put('/:id/saida', [auth, isPorteiro], async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: 'Visitante não encontrado' });
    }

    if (visitor.status === 'pendente') {
      return res.status(400).json({ message: 'Visitante ainda não entrou' });
    }

    visitor.status = 'saida';
    visitor.exitAt = new Date();

    await visitor.save();
    await visitor.populate('residentId', 'name unit');

    res.json(visitor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar saída', error: error.message });
  }
});

module.exports = router;



