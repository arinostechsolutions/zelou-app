import api from './axios';
import * as FileSystem from 'expo-file-system';

export interface UploadResponse {
  message: string;
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export type UploadType = 'document' | 'rule' | 'delivery' | 'report' | 'announcement' | 'avatar';

/**
 * Faz upload de um arquivo para o Cloudinary via backend
 * @param fileUri URI local do arquivo
 * @param fileName Nome do arquivo
 * @param type Tipo do upload (document, rule, delivery, etc)
 * @param mimeType Tipo MIME do arquivo
 */
export const uploadFile = async (
  fileUri: string,
  fileName: string,
  type: UploadType,
  mimeType: string = 'application/octet-stream'
): Promise<UploadResponse> => {
  try {
    // Ler o arquivo como base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Adicionar prefixo de data URI
    const base64WithPrefix = `data:${mimeType};base64,${base64}`;

    // Enviar para o backend
    const response = await api.post<UploadResponse>('/upload/base64', {
      base64: base64WithPrefix,
      fileName,
      type,
      mimeType,
    });

    return response.data;
  } catch (error: any) {
    console.error('Erro no upload:', error);
    throw new Error(error.response?.data?.message || 'Erro ao fazer upload do arquivo');
  }
};

/**
 * Faz upload de uma imagem (já em base64) para o Cloudinary
 * @param base64 String base64 da imagem
 * @param fileName Nome do arquivo
 * @param type Tipo do upload
 */
export const uploadBase64 = async (
  base64: string,
  fileName: string,
  type: UploadType
): Promise<UploadResponse> => {
  try {
    const response = await api.post<UploadResponse>('/upload/base64', {
      base64,
      fileName,
      type,
    });

    return response.data;
  } catch (error: any) {
    console.error('Erro no upload base64:', error);
    throw new Error(error.response?.data?.message || 'Erro ao fazer upload');
  }
};


