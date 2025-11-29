const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  // Tipo: 'document' para documentos gerais, 'rule' para regras
  type: {
    type: String,
    enum: ['document', 'rule'],
    required: true
  },
  // URL do arquivo (PDF, DOC, etc)
  fileUrl: {
    type: String,
    required: true
  },
  // Nome original do arquivo
  fileName: {
    type: String,
    required: true
  },
  // Tipo MIME do arquivo
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  // Tamanho do arquivo em bytes
  fileSize: {
    type: Number,
    default: 0
  },
  // Condomínio ao qual pertence
  condominium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condominium',
    required: true
  },
  // Quem fez o upload
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índice para buscar documentos por condomínio e tipo
documentSchema.index({ condominium: 1, type: 1, isActive: 1 });

module.exports = mongoose.model('Document', documentSchema);


