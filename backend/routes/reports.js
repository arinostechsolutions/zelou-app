const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const { auth, isMorador, isZelador } = require('../middleware/auth');
const { createNotification } = require('../utils/pushNotifications');

const router = express.Router();

// Helper para notificar gestores (porteiro, zelador, síndico) sobre nova irregularidade
const notifyManagersAboutReport = async (condominiumId, report, creatorName) => {
  try {
    const managers = await User.find({
      condominium: condominiumId,
      role: { $in: ['porteiro', 'zelador', 'sindico'] }
    }).select('_id');

    const title = '🚨 Nova Irregularidade';
    const body = `${creatorName} registrou: ${report.category} - ${report.location}`;

    for (const manager of managers) {
      await createNotification(
        manager._id,
        title,
        body,
        'report',
        { reportId: report._id.toString() }
      );
    }

    console.log(`📋 Notificação de irregularidade enviada para ${managers.length} gestor(es)`);
  } catch (error) {
    console.error('Erro ao notificar gestores sobre irregularidade:', error);
  }
};

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

    // Notificar gestores (porteiro, zelador, síndico) sobre a nova irregularidade
    await notifyManagersAboutReport(
      req.user.condominium._id,
      report,
      req.user.name
    );

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

    // Notificar o morador que criou a irregularidade sobre a atualização
    const statusLabels = {
      'aberta': 'Aberta',
      'andamento': 'Em Andamento',
      'concluida': 'Concluída'
    };
    
    await createNotification(
      report.userId._id,
      `📋 Irregularidade ${statusLabels[status]}`,
      `Sua irregularidade "${report.category}" foi atualizada para: ${statusLabels[status]}${comment ? ` - ${comment}` : ''}`,
      'report_update',
      { reportId: report._id.toString() }
    );

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



