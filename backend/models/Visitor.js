const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cpf: {
    type: String,
    default: null
  },
  reason: {
    type: String,
    required: true
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unit: {
    block: {
      type: String,
      required: true
    },
    number: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pendente', 'liberado', 'saida'],
    default: 'pendente'
  },
  entryAt: {
    type: Date,
    default: null
  },
  exitAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Visitor', visitorSchema);



