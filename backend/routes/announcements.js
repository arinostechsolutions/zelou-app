const express = require('express');
const { body, validationResult } = require('express-validator');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { auth, isZelador } = require('../middleware/auth');
const { sendPushToMultiple } = require('../utils/pushNotifications');

const router = express.Router();

// GET /api/announcements
router.get('/', auth, async (req, res) => {
  try {
    const { category, priority } = req.query;
    const query = {};

    // Filter by target (user's block or 'all')
    if (req.user.role === 'morador') {
      query.$or = [
        { target: 'all' },
        { target: `block${req.user.unit.block}` }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (priority === 'true') {
      query.priority = true;
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name role')
      .sort({ priority: -1, createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar comunicados', error: error.message });
  }
});

// POST /api/announcements
router.post('/', [auth, isZelador], [
  body('title').trim().notEmpty().withMessage('Título é obrigatório'),
  body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('target').isIn(['all', 'blockA', 'blockB', 'blockC']).withMessage('Destinatário inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, photo, target, priority, category } = req.body;

    const announcement = new Announcement({
      title,
      description,
      photo: photo || null,
      createdBy: req.user._id,
      target: target || 'all',
      priority: priority || false,
      category: category || 'geral'
    });

    await announcement.save();
    await announcement.populate('createdBy', 'name role');

    // Enviar notificação para os usuários do condomínio (exceto quem criou)
    try {
      const userQuery = { 
        condominium: req.user.condominium._id,
        _id: { $ne: req.user._id } // Excluir o criador da notificação
      };
      
      // Se o comunicado é para um bloco específico, filtrar
      if (target && target !== 'all') {
        const blockLetter = target.replace('block', '');
        userQuery['unit.block'] = blockLetter;
      }

      const users = await User.find(userQuery).select('_id pushToken');
      
      if (users.length > 0) {
        await sendPushToMultiple(
          users,
          priority ? '🔔 Comunicado Urgente' : '📢 Novo Comunicado',
          title,
          { type: 'announcement', announcementId: announcement._id.toString() }
        );
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificações:', notifError);
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar comunicado', error: error.message });
  }
});

// GET /api/announcements/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name role');

    if (!announcement) {
      return res.status(404).json({ message: 'Comunicado não encontrado' });
    }

    // Check if user has access
    if (req.user.role === 'morador') {
      if (announcement.target !== 'all' && announcement.target !== `block${req.user.unit.block}`) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
    }

    res.json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar comunicado', error: error.message });
  }
});

module.exports = router;


