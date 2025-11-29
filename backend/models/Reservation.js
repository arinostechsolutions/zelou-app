const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pendente', 'aprovada', 'rejeitada', 'cancelada', 'concluida'],
    default: 'pendente'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  canceledAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Reservation', reservationSchema);


