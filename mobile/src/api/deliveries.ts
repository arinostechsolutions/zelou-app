import api from './axios';

export interface Delivery {
  _id: string;
  residentId: {
    _id: string;
    name: string;
    unit: {
      block: string;
      number: string;
    };
  };
  createdBy: {
    _id: string;
    name: string;
  };
  photoUrl: string;
  packageType: string;
  volumeNumber?: string;
  notes?: string;
  status: 'pendente' | 'retirada';
  createdAt: string;
  retrievedAt?: string;
  retrievalPhoto?: string;
  signature?: string;
}

export interface CreateDeliveryRequest {
  residentId: string;
  photoUrl: string;
  packageType?: string;
  volumeNumber?: string;
  notes?: string;
}

export const deliveriesApi = {
  getAll: (params?: { status?: string; search?: string }) => 
    api.get<Delivery[]>('/deliveries', { params }),
  getById: (id: string) => api.get<Delivery>(`/deliveries/${id}`),
  create: (data: CreateDeliveryRequest) => api.post<Delivery>('/deliveries', data),
  confirmRetrieval: (id: string, data?: { signature?: string; retrievalPhoto?: string }) =>
    api.put(`/deliveries/${id}/retirar`, data),
};



