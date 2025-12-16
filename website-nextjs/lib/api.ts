import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/dashboard/login'
      }
    }
    return Promise.reject(error)
  }
)

// API de autenticação
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data
  },
  me: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },
}

// API de estatísticas
export const statisticsApi = {
  get: async (condominiumId?: string) => {
    const params = condominiumId ? { condominiumId } : {}
    const response = await api.get('/api/statistics', { params })
    return response.data
  },
}

// API de irregularidades
export const reportsApi = {
  getAll: async (status?: string) => {
    const params = status ? { status } : {}
    const response = await api.get('/api/reports', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/reports/${id}`)
    return response.data
  },
  updateStatus: async (id: string, status: string, comment?: string) => {
    const response = await api.put(`/api/reports/${id}/status`, { status, comment })
    return response.data
  },
}

// API de reservas
export const reservationsApi = {
  getAll: async (status?: string) => {
    const params = status ? { status } : {}
    const response = await api.get('/api/reservations', { params })
    return response.data
  },
  getPending: async () => {
    const response = await api.get('/api/reservations/pending')
    return response.data
  },
  approve: async (id: string) => {
    const response = await api.put(`/api/reservations/${id}/approve`)
    return response.data
  },
  reject: async (id: string, reason?: string) => {
    const response = await api.put(`/api/reservations/${id}/reject`, { reason })
    return response.data
  },
}

// API de entregas
export const deliveriesApi = {
  getAll: async (status?: string, search?: string) => {
    const params: any = {}
    if (status) params.status = status
    if (search) params.search = search
    const response = await api.get('/api/deliveries', { params })
    return response.data
  },
}

// API de usuários
export const usersApi = {
  getAll: async () => {
    const response = await api.get('/api/users')
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/users/${id}`)
    return response.data
  },
}

