import api from './axios';

export interface Report {
  _id: string;
  userId: {
    _id: string;
    name: string;
    unit: {
      block: string;
      number: string;
    };
  };
  photos: string[];
  category: string;
  description: string;
  location: string;
  status: 'aberta' | 'andamento' | 'concluida';
  history: Array<{
    status: string;
    changedBy: {
      _id: string;
      name: string;
      role: string;
    };
    comment?: string;
    date: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  photos: string[];
  category: string;
  description: string;
  location: string;
}

export const reportsApi = {
  getAll: (params?: { status?: string }) => api.get<Report[]>('/reports', { params }),
  getById: (id: string) => api.get<Report>(`/reports/${id}`),
  create: (data: CreateReportRequest) => api.post<Report>('/reports', data),
  updateStatus: (id: string, status: string, comment?: string) =>
    api.put(`/reports/${id}/status`, { status, comment }),
  addComment: (id: string, comment: string) =>
    api.post(`/reports/${id}/comment`, { comment }),
};



