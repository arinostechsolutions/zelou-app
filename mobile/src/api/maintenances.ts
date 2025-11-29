import api from './axios';

export interface Maintenance {
  _id: string;
  title: string;
  description?: string;
  type: 
    | 'eletrica'
    | 'hidraulica'
    | 'elevador'
    | 'pintura'
    | 'limpeza'
    | 'jardinagem'
    | 'seguranca'
    | 'estrutural'
    | 'gas'
    | 'interfone'
    | 'portao'
    | 'iluminacao'
    | 'dedetizacao'
    | 'outro';
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  responsible?: string;
  images?: string[];
  notes?: string;
  condominium: string | { _id: string; name: string };
  createdBy: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceData {
  title: string;
  description?: string;
  type: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  responsible?: string;
  images?: string[];
  notes?: string;
}

export const maintenancesApi = {
  getAll: (params?: { status?: string; type?: string }) => 
    api.get<Maintenance[]>('/maintenances', { params }),
  
  getUpcoming: () => 
    api.get<Maintenance[]>('/maintenances/upcoming'),
  
  getById: (id: string) => 
    api.get<Maintenance>(`/maintenances/${id}`),
  
  create: (data: CreateMaintenanceData) => 
    api.post<Maintenance>('/maintenances', data),
  
  update: (id: string, data: Partial<CreateMaintenanceData>) => 
    api.put<Maintenance>(`/maintenances/${id}`, data),
  
  updateStatus: (id: string, status: string) => 
    api.put<Maintenance>(`/maintenances/${id}/status`, { status }),
  
  delete: (id: string) => 
    api.delete(`/maintenances/${id}`),
};

export const maintenanceTypes = [
  { value: 'eletrica', label: 'Elétrica', icon: 'flash-outline' },
  { value: 'hidraulica', label: 'Hidráulica', icon: 'water-outline' },
  { value: 'elevador', label: 'Elevador', icon: 'arrow-up-outline' },
  { value: 'pintura', label: 'Pintura', icon: 'color-palette-outline' },
  { value: 'limpeza', label: 'Limpeza', icon: 'sparkles-outline' },
  { value: 'jardinagem', label: 'Jardinagem', icon: 'leaf-outline' },
  { value: 'seguranca', label: 'Segurança', icon: 'shield-outline' },
  { value: 'estrutural', label: 'Estrutural', icon: 'construct-outline' },
  { value: 'gas', label: 'Gás', icon: 'flame-outline' },
  { value: 'interfone', label: 'Interfone', icon: 'call-outline' },
  { value: 'portao', label: 'Portão', icon: 'enter-outline' },
  { value: 'iluminacao', label: 'Iluminação', icon: 'bulb-outline' },
  { value: 'dedetizacao', label: 'Dedetização', icon: 'bug-outline' },
  { value: 'outro', label: 'Outro', icon: 'build-outline' },
];

export const maintenanceStatuses = [
  { value: 'agendada', label: 'Agendada', color: '#3B82F6' },
  { value: 'em_andamento', label: 'Em Andamento', color: '#F59E0B' },
  { value: 'concluida', label: 'Concluída', color: '#10B981' },
  { value: 'cancelada', label: 'Cancelada', color: '#6B7280' },
];

