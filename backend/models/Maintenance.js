const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: [
      'eletrica',      // Elétrica
      'hidraulica',    // Hidráulica
      'elevador',      // Elevador
      'pintura',       // Pintura
      'limpeza',       // Limpeza
      'jardinagem',    // Jardinagem
      'seguranca',     // Segurança
      'estrutural',    // Estrutural
      'gas',           // Gás
      'interfone',     // Interfone
      'portao',        // Portão
      'iluminacao',    // Iluminação
      'dedetizacao',   // Dedetização
      'outro'          // Outro
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['agendada', 'em_andamento', 'concluida', 'cancelada'],
    default: 'agendada'
  },
  // Data e hora de início
  startDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,  // Formato "HH:mm"
    default: null
  },
  // Data e hora de término (opcionais)
  endDate: {
    type: Date,
    default: null
  },
  endTime: {
    type: String,  // Formato "HH:mm"
    default: null
  },
  // Local da manutenção
  location: {
    type: String,
    default: null
  },
  // Empresa/Profissional responsável
  responsible: {
    type: String,
    default: null
  },
  // Imagens (URLs do Cloudinary)
  images: [{
    type: String
  }],
  // Observações adicionais
  notes: {
    type: String,
    default: null
  },
  // Condomínio
  condominium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Condominium',
    required: true
  },
  // Usuário que criou
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

maintenanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);

