const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const { auth, isMorador, isZelador } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by role
    if (req.user.role === 'morador') {
      query.userId = req.user._id;
    }
    // zelador and sindico can see all

    const reports = await Report.find(query)
      .populate('userId', 'name unit')
      .populate('history.changedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar irregularidades', error: error.message });
  }
});

// POST /api/reports
router.post('/', [auth, isMorador], [
  body('photos').isArray({ min: 1 }).withMessage('Pelo menos uma foto é obrigatória'),
  body('category').trim().notEmpty().withMessage('Categoria é obrigatória'),
  body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('location').trim().notEmpty().withMessage('Local é obrigatório')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { photos, category, description, location } = req.body;

    const report = new Report({
      userId: req.user._id,
      photos,
      category,
      description,
      location,
      status: 'aberta',
      history: [{
        status: 'aberta',
        changedBy: req.user._id,
        date: new Date()
      }]
    });

    await report.save();
    await report.populate('userId', 'name unit');

    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar irregularidade', error: error.message });
  }
});

// GET /api/reports/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name unit')
      .populate('history.changedBy', 'name role');

    if (!report) {
      return res.status(404).json({ message: 'Irregularidade não encontrada' });
    }

    // Check permission
    if (req.user.role === 'morador' && report.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar irregularidade', error: error.message });
  }
});

// PUT /api/reports/:id/status
router.put('/:id/status', [auth, isZelador], [
  body('status').isIn(['aberta', 'andamento', 'concluida']).withMessage('Status inválido'),
  body('comment').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Irregularidade não encontrada' });
    }

    const { status, comment } = req.body;

    report.status = status;
    report.history.push({
      status,
      changedBy: req.user._id,
      comment,
      date: new Date()
    });

    await report.save();
    await report.populate('userId', 'name unit');
    await report.populate('history.changedBy', 'name role');

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar status', error: error.message });
  }
});

// POST /api/reports/:id/comment
router.post('/:id/comment', auth, [
  body('comment').trim().notEmpty().withMessage('Comentário é obrigatório')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Irregularidade não encontrada' });
    }

    // Check permission
    if (req.user.role === 'morador' && report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { comment } = req.body;

    report.history.push({
      status: report.status,
      changedBy: req.user._id,
      comment,
      date: new Date()
    });

    await report.save();
    await report.populate('userId', 'name unit');
    await report.populate('history.changedBy', 'name role');

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao adicionar comentário', error: error.message });
  }
});

module.exports = router;



