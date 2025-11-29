import api from './axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  role: 'master' | 'sindico' | 'zelador' | 'porteiro' | 'morador';
  unit: {
    block: string;
    number: string;
  };
  condominium: {
    _id: string;
    name: string;
  };
  isMasterAdmin: boolean;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LookupResidentResponse {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  unit: {
    block: string;
    number: string;
  };
  condominium?: {
    _id: string;
    name?: string;
  };
}

export const usersApi = {
  // Listar usuários
  getAll: async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  // Buscar usuário por ID
  getById: async (id: string) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  // Criar usuário
  create: async (data: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone: string;
    role: string;
    unit: {
      block: string;
      number: string;
    };
    condominium?: string;
    inviteCode?: string;
  }) => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  // Atualizar usuário
  update: async (id: string, data: Partial<User>) => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  // Deletar usuário
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Listar usuários por condomínio
  getByCondominium: async (condominiumId: string) => {
    const response = await api.get<User[]>(`/users/condominium/${condominiumId}`);
    return response.data;
  },

  // Buscar morador por bloco/unidade
  lookupResident: async (params: { block: string; number: string; condominiumId?: string }) => {
    const response = await api.get<LookupResidentResponse>('/users/lookup', { params });
    return response.data;
  },

  // Atualizar push token
  updatePushToken: async (pushToken: string) =>
    api.put('/users/me/push-token', { pushToken }),
};

