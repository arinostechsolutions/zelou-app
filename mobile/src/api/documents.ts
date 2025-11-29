import api from './axios';

export interface Document {
  _id: string;
  title: string;
  type: 'document' | 'rule';
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  condominium: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  title: string;
  type: 'document' | 'rule';
  fileUrl: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
}

export const documentsApi = {
  // Listar documentos
  getAll: (params?: { type?: 'document' | 'rule'; condominiumId?: string }) =>
    api.get<Document[]>('/documents', { params }),

  // Buscar documento por ID
  getById: (id: string) =>
    api.get<Document>(`/documents/${id}`),

  // Criar documento (síndico)
  create: (data: CreateDocumentRequest) =>
    api.post<Document>('/documents', data),

  // Atualizar documento (síndico)
  update: (id: string, data: Partial<CreateDocumentRequest>) =>
    api.put<Document>(`/documents/${id}`, data),

  // Remover documento (síndico)
  delete: (id: string) =>
    api.delete(`/documents/${id}`),
};


