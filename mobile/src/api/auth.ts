import api from './axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone: string;
  unit: {
    block?: string;  // Opcional - alguns condomínios não têm blocos/torres
    number: string;
  };
  inviteCode: string;  // Obrigatório - define o condomínio e role
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    unit: {
      block?: string;
      number: string;
    };
    condominium?: {
      _id: string;
      name?: string;
    };
    isMasterAdmin?: boolean;
    pushToken: string | null;
  };
}

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email: string, code: string) => 
    api.post('/auth/verify-reset-code', { email, code }),
  resetPassword: (email: string, code: string, password: string) => 
    api.post('/auth/reset-password', { email, code, password }),
  getMe: () => api.get('/auth/me'),
};



