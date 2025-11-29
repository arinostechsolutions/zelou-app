import api from './axios';

export interface Area {
  _id: string;
  name: string;
  description?: string;
  condominium: {
    _id: string;
    name: string;
  };
  rules: {
    maxReservationsPerDay: number;
    capacity?: number;
    fee: number;
    feePercentage: number;
    cancellationDeadline: number;
    minAdvanceBooking: number;
    maxAdvanceBooking: number;
    requiresApproval: boolean;
  };
  availableSlots: string[];
  availableDays: number[];
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DayAvailability {
  available: boolean;
  isDayAvailable: boolean;
  isPastDate: boolean;
  totalSlots: number;
  reservedSlots: number;
  availableSlots: number;
  reservations: Array<{
    timeSlot: string;
    status: string;
  }>;
}

export interface AvailabilityResponse {
  area: {
    _id: string;
    name: string;
    availableSlots: string[];
    availableDays: number[];
    rules: Area['rules'];
  };
  month: number;
  year: number;
  availability: Record<string, DayAvailability>;
}

export interface Reservation {
  _id: string;
  areaId: {
    _id: string;
    name: string;
    rules: {
      limitPerDay: number;
      capacity?: number;
      fee: number;
    };
  };
  userId: string | {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    unit: {
      block: string;
      number: string;
    };
  };
  date: string;
  timeSlot: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada' | 'concluida';
  approvedBy?: {
    _id: string;
    name: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface CreateReservationRequest {
  areaId: string;
  date: string;
  timeSlot: string;
}

export const reservationsApi = {
  // Áreas
  getAreas: () => api.get<Area[]>('/areas'),
  getAreaById: (id: string) => api.get<Area>(`/areas/${id}`),
  getAvailability: (areaId: string, month?: number, year?: number) =>
    api.get<AvailabilityResponse>(`/areas/${areaId}/availability`, { 
      params: { month, year } 
    }),
  getCalendar: (areaId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/areas/${areaId}/calendar`, { params }),
  
  // Gestão de áreas (síndico/zelador)
  createArea: (data: Partial<Area>) => api.post<Area>('/areas', data),
  updateArea: (id: string, data: Partial<Area>) => api.put<Area>(`/areas/${id}`, data),
  deleteArea: (id: string) => api.delete(`/areas/${id}`),
  
  // Reservas do morador
  getMyReservations: (params?: { status?: string }) =>
    api.get<Reservation[]>('/reservations/my', { params }),
  getById: (id: string) => api.get<Reservation>(`/reservations/${id}`),
  create: (data: CreateReservationRequest) => api.post<Reservation>('/reservations', data),
  cancel: (id: string) => api.delete(`/reservations/${id}`),
  
  // Para porteiro/zelador/sindico
  getAll: (params?: { status?: string }) =>
    api.get<Reservation[]>('/reservations', { params }),
  getPending: () =>
    api.get<Reservation[]>('/reservations/pending'),
  approve: (id: string) =>
    api.put(`/reservations/${id}/approve`),
  reject: (id: string, reason?: string) =>
    api.put(`/reservations/${id}/reject`, { reason }),
};


