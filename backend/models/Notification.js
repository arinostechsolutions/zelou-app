const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'delivery',             // Nova entrega
      'delivery_retrieved',   // Entrega retirada
      'reservation',          // Nova reserva (para gestores)
      'reservation_request',  // Solicitação de reserva (para gestores)
      'reservation_approved', // Reserva aprovada
      'reservation_rejected', // Reserva rejeitada
      'reservation_cancelled', // Reserva cancelada
      'announcement',         // Novo comunicado
      'report',               // Nova irregularidade
      'report_update',        // Atualização de irregularidade
      'visitor',              // Novo visitante
      'visitor_arrived',      // Visitante chegou
      'document',             // Novo documento/regra
      'maintenance',          // Nova manutenção
      'general'               // Notificação geral
    ],
    default: 'general'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice composto para buscar notificações não lidas por usuário
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

