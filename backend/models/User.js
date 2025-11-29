const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  condominium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condominium',
    required: true
  },
  role: {
    type: String,
    enum: ['morador', 'porteiro', 'zelador', 'sindico', 'master'],
    required: true,
    default: 'morador'
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
  inviteCode: {
    type: String,
    default: null
  },
  pushToken: {
    type: String,
    default: null
  },
  isMasterAdmin: {
    type: Boolean,
    default: false
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);


