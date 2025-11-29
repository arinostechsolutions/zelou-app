const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications - Listar notificações do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, read: false })
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ message: 'Erro ao buscar notificações', error: error.message });
  }
});

// GET /api/notifications/unread-count - Contar notificações não lidas
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });
    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ message: 'Erro ao contar notificações', error: error.message });
  }
});

// PUT /api/notifications/:id/read - Marcar notificação como lida
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificação', error: error.message });
  }
});

// PUT /api/notifications/read-all - Marcar todas como lidas
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    res.status(500).json({ message: 'Erro ao atualizar notificações', error: error.message });
  }
});

// DELETE /api/notifications/:id - Excluir notificação
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificação não encontrada' });
    }

    res.json({ message: 'Notificação excluída' });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    res.status(500).json({ message: 'Erro ao excluir notificação', error: error.message });
  }
});

// DELETE /api/notifications - Excluir todas as notificações
router.delete('/', authenticate, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'Todas as notificações foram excluídas' });
  } catch (error) {
    console.error('Erro ao excluir notificações:', error);
    res.status(500).json({ message: 'Erro ao excluir notificações', error: error.message });
  }
});

module.exports = router;


