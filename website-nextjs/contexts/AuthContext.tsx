'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: string
  unit: {
    block?: string
    number: string
  }
  condominium: {
    _id: string
    name: string
  }
  isMasterAdmin: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isSindico: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false) // Começar como false para não bloquear navegação

  useEffect(() => {
    // Verificar se há token salvo apenas uma vez
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          // Definir usuário imediatamente sem bloquear
          setUser(parsedUser)
          
          // Validar token com o backend em background (não bloqueia navegação)
          authApi.me()
            .then((userData) => {
              setUser(userData)
              localStorage.setItem('user', JSON.stringify(userData))
            })
            .catch(() => {
              // Token inválido, limpar storage
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              setUser(null)
            })
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    
    // Verificar se é síndico ou master admin
    if (response.user.role !== 'sindico' && !response.user.isMasterAdmin) {
      throw new Error('Acesso restrito a síndicos e administradores')
    }
    
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isSindico: user?.role === 'sindico' || user?.isMasterAdmin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

