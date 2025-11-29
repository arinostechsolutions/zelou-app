const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { uploadBufferToCloudinary, CLOUDINARY_FOLDERS } = require('../utils/cloudinary');

const router = express.Router();

// Configurar multer para armazenar em memória
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Tipos permitidos
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  },
});

// POST /api/upload - Upload genérico
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const { folder, type } = req.body;

    // Determinar pasta baseado no tipo
    let uploadFolder = CLOUDINARY_FOLDERS.DOCUMENTS;
    let resourceType = 'auto';

    switch (type) {
      case 'document':
        uploadFolder = CLOUDINARY_FOLDERS.DOCUMENTS;
        resourceType = 'raw'; // Para PDFs e documentos
        break;
      case 'rule':
        uploadFolder = CLOUDINARY_FOLDERS.RULES;
        resourceType = 'raw';
        break;
      case 'delivery':
        uploadFolder = CLOUDINARY_FOLDERS.DELIVERIES;
        resourceType = 'image';
        break;
      case 'report':
        uploadFolder = CLOUDINARY_FOLDERS.REPORTS;
        resourceType = 'image';
        break;
      case 'announcement':
        uploadFolder = CLOUDINARY_FOLDERS.ANNOUNCEMENTS;
        resourceType = 'image';
        break;
      case 'avatar':
        uploadFolder = CLOUDINARY_FOLDERS.AVATARS;
        resourceType = 'image';
        break;
      default:
        if (folder) {
          uploadFolder = `zelou/${folder}`;
        }
    }

    // Fazer upload para o Cloudinary
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: uploadFolder,
      resourceType,
      fileName: req.file.originalname,
    });

    if (!result.success) {
      return res.status(500).json({ message: 'Erro ao fazer upload', error: result.error });
    }

    res.json({
      message: 'Upload realizado com sucesso',
      url: result.url,
      publicId: result.publicId,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: result.size || req.file.size,
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload', error: error.message });
  }
});

// POST /api/upload/base64 - Upload via base64 (para imagens do mobile)
router.post('/base64', authenticate, async (req, res) => {
  try {
    const { base64, fileName, type, mimeType } = req.body;

    if (!base64) {
      return res.status(400).json({ message: 'Base64 é obrigatório' });
    }

    // Determinar pasta baseado no tipo
    let uploadFolder = CLOUDINARY_FOLDERS.DOCUMENTS;
    let resourceType = 'auto';

    switch (type) {
      case 'document':
        uploadFolder = CLOUDINARY_FOLDERS.DOCUMENTS;
        resourceType = 'raw';
        break;
      case 'rule':
        uploadFolder = CLOUDINARY_FOLDERS.RULES;
        resourceType = 'raw';
        break;
      case 'delivery':
        uploadFolder = CLOUDINARY_FOLDERS.DELIVERIES;
        resourceType = 'image';
        break;
      case 'report':
        uploadFolder = CLOUDINARY_FOLDERS.REPORTS;
        resourceType = 'image';
        break;
      case 'announcement':
        uploadFolder = CLOUDINARY_FOLDERS.ANNOUNCEMENTS;
        resourceType = 'image';
        break;
      case 'avatar':
        uploadFolder = CLOUDINARY_FOLDERS.AVATARS;
        resourceType = 'image';
        break;
      default:
        uploadFolder = 'zelou/uploads';
    }

    // Fazer upload para o Cloudinary
    const result = await uploadBufferToCloudinary(base64, {
      folder: uploadFolder,
      resourceType,
      fileName,
    });

    if (!result.success) {
      return res.status(500).json({ message: 'Erro ao fazer upload', error: result.error });
    }

    res.json({
      message: 'Upload realizado com sucesso',
      url: result.url,
      publicId: result.publicId,
      fileName: fileName || 'arquivo',
      mimeType: mimeType || 'application/octet-stream',
      size: result.size,
    });
  } catch (error) {
    console.error('Erro no upload base64:', error);
    res.status(500).json({ message: 'Erro ao fazer upload', error: error.message });
  }
});

module.exports = router;


