const mongoose = require('mongoose');

const condominiumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cnpj: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    number: {
      type: String,
      required: true
    },
    complement: {
      type: String,
      default: ''
    },
    neighborhood: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    }
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  blocks: [{
    type: String,
    trim: true
  }],
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

// Update updatedAt on save
condominiumSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Condominium', condominiumSchema);


