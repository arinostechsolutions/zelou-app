import api from './axios';

export interface Condominium {
  _id: string;
  name: string;
  cnpj: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone?: string;
  email?: string;
  blocks: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InviteCode {
  _id: string;
  code: string;
  condominium: Condominium;
  role: string;
  block?: string;
  unit?: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdBy: any;
  createdAt: string;
}

export const condominiumsApi = {
  // Listar todos os condomínios
  getAll: async () => {
    const response = await api.get<Condominium[]>('/condominiums');
    return response.data;
  },

  // Buscar condomínio por ID
  getById: async (id: string) => {
    const response = await api.get<Condominium>(`/condominiums/${id}`);
    return response.data;
  },

  // Criar condomínio
  create: async (data: Partial<Condominium>) => {
    const response = await api.post<Condominium>('/condominiums', data);
    return response.data;
  },

  // Atualizar condomínio
  update: async (id: string, data: Partial<Condominium>) => {
    const response = await api.put<Condominium>(`/condominiums/${id}`, data);
    return response.data;
  },

  // Gerar código de convite
  generateInviteCode: async (condominiumId: string, data: {
    role: string;
    block?: string;
    unit?: string;
    maxUses?: number;
    expiresAt?: string;
  }) => {
    const response = await api.post<InviteCode>(
      `/condominiums/${condominiumId}/invite-codes`,
      data
    );
    return response.data;
  },

  // Listar códigos de convite
  getInviteCodes: async (condominiumId: string) => {
    const response = await api.get<InviteCode[]>(
      `/condominiums/${condominiumId}/invite-codes`
    );
    return response.data;
  },

  // Desativar código de convite
  deactivateInviteCode: async (condominiumId: string, codeId: string) => {
    const response = await api.delete(
      `/condominiums/${condominiumId}/invite-codes/${codeId}`
    );
    return response.data;
  },
};


