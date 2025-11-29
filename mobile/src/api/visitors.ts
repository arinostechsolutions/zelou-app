import api from './axios';

export interface Visitor {
  _id: string;
  name: string;
  cpf?: string;
  reason: string;
  residentId: {
    _id: string;
    name: string;
    unit: {
      block: string;
      number: string;
    };
  };
  unit: {
    block: string;
    number: string;
  };
  status: 'pendente' | 'liberado' | 'saida';
  entryAt?: string;
  exitAt?: string;
  createdAt: string;
}

export interface CreateVisitorRequest {
  name: string;
  cpf?: string;
  reason: string;
}

export const visitorsApi = {
  getAll: (params?: { date?: string; status?: string }) =>
    api.get<Visitor[]>('/visitors', { params }),
  create: (data: CreateVisitorRequest) => api.post<Visitor>('/visitors', data),
  confirmEntry: (id: string) => api.put(`/visitors/${id}/entrada`),
  confirmExit: (id: string) => api.put(`/visitors/${id}/saida`),
};



