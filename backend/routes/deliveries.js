const express = require('express');
const { body, validationResult } = require('express-validator');
const Delivery = require('../models/Delivery');
const User = require('../models/User');
const { auth, isPorteiro } = require('../middleware/auth');
const { sendPushNotification } = require('../utils/pushNotifications');

const router = express.Router();

// GET /api/deliveries
router.get('/', auth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by role
    if (req.user.role === 'morador') {
      query.residentId = req.user._id;
    } else if (req.user.role === 'porteiro' || req.user.role === 'zelador' || req.user.role === 'sindico') {
      // Porteiro, zelador and síndico can see all
      if (search) {
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { 'unit.number': { $regex: search, $options: 'i' } },
            { 'unit.block': { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        query.residentId = { $in: users.map(u => u._id) };
      }
    }

    const deliveries = await Delivery.find(query)
      .populate('residentId', 'name unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(deliveries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar entregas', error: error.message });
  }
});

// POST /api/deliveries
router.post('/', [auth, isPorteiro], [
  body('residentId').notEmpty().withMessage('Morador é obrigatório'),
  body('photoUrl').notEmpty().withMessage('Foto é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { residentId, photoUrl, packageType, volumeNumber, notes } = req.body;

    const delivery = new Delivery({
      residentId,
      createdBy: req.user._id,
      photoUrl,
      packageType: packageType || 'Encomenda',
      volumeNumber,
      notes
    });

    await delivery.save();
    await delivery.populate('residentId', 'name unit pushToken');
    await delivery.populate('createdBy', 'name');

    // Enviar notificação para o morador
    await sendPushNotification({
      to: delivery.residentId.pushToken,
      userId: delivery.residentId._id,
      title: '📦 Nova entrega recebida',
      body: `Uma ${delivery.packageType?.toLowerCase() || 'encomenda'} chegou na portaria.`,
      data: {
        type: 'delivery',
        deliveryId: delivery._id.toString(),
      },
    });

    res.status(201).json(delivery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar entrega', error: error.message });
  }
});

// GET /api/deliveries/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('residentId', 'name unit')
      .populate('createdBy', 'name');

    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }

    // Check permission
    if (req.user.role === 'morador' && delivery.residentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(delivery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar entrega', error: error.message });
  }
});

// PUT /api/deliveries/:id/retirar
router.put('/:id/retirar', [auth, isPorteiro], [
  body('signature').optional(),
  body('retrievalPhoto').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }

    if (delivery.status === 'retirada') {
      return res.status(400).json({ message: 'Entrega já foi retirada' });
    }

    delivery.status = 'retirada';
    delivery.retrievedAt = new Date();
    delivery.signature = req.body.signature || null;
    delivery.retrievalPhoto = req.body.retrievalPhoto || null;

    await delivery.save();
    await delivery.populate('residentId', 'name unit');
    await delivery.populate('createdBy', 'name');

    res.json(delivery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao confirmar retirada', error: error.message });
  }
});

module.exports = router;


