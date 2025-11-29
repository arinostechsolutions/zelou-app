const express = require('express');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { sendPushToMultiple } = require('../utils/pushNotifications');

const router = express.Router();

// GET /api/documents - Listar documentos do condomínio
router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };

    // Filtrar por condomínio
    if (!req.user.isMasterAdmin) {
      query.condominium = req.user.condominium._id;
    } else if (req.query.condominiumId) {
      query.condominium = req.query.condominiumId;
    }

    // Filtrar por tipo (document ou rule)
    if (type && ['document', 'rule'].includes(type)) {
      query.type = type;
    }

    const documents = await Document.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar documentos', error: error.message });
  }
});

// GET /api/documents/:id - Buscar documento por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('condominium', 'name');

    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }

    // Verificar se pertence ao mesmo condomínio
    if (!req.user.isMasterAdmin && 
        document.condominium._id.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar documento', error: error.message });
  }
});

// POST /api/documents - Criar documento (apenas síndico)
router.post('/', authenticate, authorize(['sindico']), [
  body('title').trim().notEmpty().withMessage('Título é obrigatório'),
  body('type').isIn(['document', 'rule']).withMessage('Tipo deve ser document ou rule'),
  body('fileUrl').trim().notEmpty().withMessage('URL do arquivo é obrigatória'),
  body('fileName').trim().notEmpty().withMessage('Nome do arquivo é obrigatório')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, type, fileUrl, fileName, mimeType, fileSize } = req.body;

    const document = new Document({
      title,
      type,
      fileUrl,
      fileName,
      mimeType: mimeType || 'application/pdf',
      fileSize: fileSize || 0,
      condominium: req.user.condominium._id,
      createdBy: req.user._id
    });

    await document.save();
    await document.populate('createdBy', 'name');

    // Enviar notificação para os usuários do condomínio (exceto quem criou)
    try {
      const users = await User.find({ 
        condominium: req.user.condominium._id,
        _id: { $ne: req.user._id } // Excluir o criador da notificação
      }).select('_id pushToken');
      
      if (users.length > 0) {
        const isRule = type === 'rule';
        await sendPushToMultiple(
          users,
          isRule ? '📋 Nova Regra Publicada' : '📄 Novo Documento Disponível',
          title,
          { type: 'document', documentId: document._id.toString(), documentType: type }
        );
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificações:', notifError);
    }

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar documento', error: error.message });
  }
});

// PUT /api/documents/:id - Atualizar documento (apenas síndico)
router.put('/:id', authenticate, authorize(['sindico']), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }

    // Verificar se pertence ao mesmo condomínio
    if (document.condominium.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { title, fileUrl, fileName, mimeType, fileSize } = req.body;

    if (title) document.title = title;
    if (fileUrl) document.fileUrl = fileUrl;
    if (fileName) document.fileName = fileName;
    if (mimeType) document.mimeType = mimeType;
    if (fileSize) document.fileSize = fileSize;

    await document.save();
    await document.populate('createdBy', 'name');

    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar documento', error: error.message });
  }
});

// DELETE /api/documents/:id - Remover documento (apenas síndico)
router.delete('/:id', authenticate, authorize(['sindico']), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }

    // Verificar se pertence ao mesmo condomínio
    if (document.condominium.toString() !== req.user.condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Soft delete
    document.isActive = false;
    await document.save();

    res.json({ message: 'Documento removido com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao remover documento', error: error.message });
  }
});

module.exports = router;

