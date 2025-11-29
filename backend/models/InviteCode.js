const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  condominium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condominium',
    required: true
  },
  role: {
    type: String,
    enum: ['morador', 'porteiro', 'zelador', 'sindico'],
    required: true
  },
  block: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    trim: true
  },
  maxUses: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Gerar código único
inviteCodeSchema.statics.generateCode = function() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Verificar se código é válido
inviteCodeSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.usedCount >= this.maxUses) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

// Incrementar uso
inviteCodeSchema.methods.incrementUse = async function() {
  this.usedCount += 1;
  if (this.usedCount >= this.maxUses) {
    this.isActive = false;
  }
  await this.save();
};

module.exports = mongoose.model('InviteCode', inviteCodeSchema);


