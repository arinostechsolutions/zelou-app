const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  photoUrl: {
    type: String,
    required: true
  },
  packageType: {
    type: String,
    default: 'Encomenda'
  },
  volumeNumber: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pendente', 'retirada'],
    default: 'pendente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  retrievedAt: {
    type: Date,
    default: null
  },
  retrievalPhoto: {
    type: String,
    default: null
  },
  signature: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('Delivery', deliverySchema);



