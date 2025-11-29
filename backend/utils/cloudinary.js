const cloudinary = require('cloudinary').v2;

// Configuração do Cloudinary (usar variáveis de ambiente)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Faz upload de um arquivo para o Cloudinary
 * @param {string} filePath - Caminho do arquivo ou base64
 * @param {object} options - Opções de upload
 * @param {string} options.folder - Pasta no Cloudinary (ex: 'zelou/documents')
 * @param {string} options.resourceType - Tipo do recurso ('image', 'raw', 'video', 'auto')
 * @param {string} options.publicId - ID público personalizado (opcional)
 * @returns {Promise<object>} Resultado do upload
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const uploadOptions = {
      folder: options.folder || 'zelou',
      resource_type: options.resourceType || 'auto',
      use_filename: true,
      unique_filename: true,
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Erro no upload para Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Faz upload de um buffer/base64 para o Cloudinary
 * @param {Buffer|string} buffer - Buffer do arquivo ou string base64
 * @param {object} options - Opções de upload
 * @returns {Promise<object>} Resultado do upload
 */
const uploadBufferToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'zelou',
      resource_type: options.resourceType || 'auto',
      use_filename: true,
      unique_filename: true,
    };

    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    if (options.fileName) {
      uploadOptions.public_id = options.fileName.replace(/\.[^/.]+$/, ''); // Remove extensão
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Erro no upload para Cloudinary:', error);
          resolve({
            success: false,
            error: error.message,
          });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
            resourceType: result.resource_type,
          });
        }
      }
    );

    // Se for base64, converter para buffer
    if (typeof buffer === 'string' && buffer.includes('base64')) {
      const base64Data = buffer.replace(/^data:.*?;base64,/, '');
      uploadStream.end(Buffer.from(base64Data, 'base64'));
    } else if (Buffer.isBuffer(buffer)) {
      uploadStream.end(buffer);
    } else {
      uploadStream.end(buffer);
    }
  });
};

/**
 * Remove um arquivo do Cloudinary
 * @param {string} publicId - ID público do arquivo
 * @param {string} resourceType - Tipo do recurso
 * @returns {Promise<object>} Resultado da remoção
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('Erro ao deletar do Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Pastas padrão para o Zelou
const CLOUDINARY_FOLDERS = {
  DOCUMENTS: 'zelou/documents',
  RULES: 'zelou/rules',
  DELIVERIES: 'zelou/deliveries',
  REPORTS: 'zelou/reports',
  ANNOUNCEMENTS: 'zelou/announcements',
  AVATARS: 'zelou/avatars',
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  CLOUDINARY_FOLDERS,
};


