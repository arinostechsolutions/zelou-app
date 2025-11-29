const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  condominium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condominium',
    required: true
  },
  rules: {
    // Máximo de reservas por dia para esta área
    maxReservationsPerDay: {
      type: Number,
      default: 1
    },
    // Capacidade máxima de pessoas
    capacity: {
      type: Number,
      default: null
    },
    // Taxa de uso (valor fixo em reais)
    fee: {
      type: Number,
      default: 0
    },
    // Taxa percentual (ex: 10 = 10%)
    feePercentage: {
      type: Number,
      default: 0
    },
    // Prazo mínimo para cancelamento (em horas)
    cancellationDeadline: {
      type: Number,
      default: 24
    },
    // Antecedência mínima para reservar (em horas)
    minAdvanceBooking: {
      type: Number,
      default: 24
    },
    // Antecedência máxima para reservar (em dias)
    maxAdvanceBooking: {
      type: Number,
      default: 30
    },
    // Requer aprovação
    requiresApproval: {
      type: Boolean,
      default: true
    }
  },
  // Horários disponíveis para reserva
  availableSlots: [{
    type: String,
    default: []
  }],
  // Dias da semana disponíveis (0=domingo, 6=sábado)
  availableDays: [{
    type: Number,
    default: [0, 1, 2, 3, 4, 5, 6]
  }],
  // Imagem da área
  imageUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice composto para garantir nome único por condomínio
areaSchema.index({ name: 1, condominium: 1 }, { unique: true });

areaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Area', areaSchema);


