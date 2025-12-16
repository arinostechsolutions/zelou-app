'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { authApi } from '@/lib/api'
import './page.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificação rápida sem esperar loading do context
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      
      if (token && savedUser) {
        try {
          const user = JSON.parse(savedUser)
          if (user.role === 'sindico' || user.isMasterAdmin) {
            router.push('/dashboard')
          }
        } catch {
          // Ignorar erro, deixar usuário fazer login
        }
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login(email, password)
      
      // Verificar se é síndico ou master admin
      if (response.user.role !== 'sindico' && !response.user.isMasterAdmin) {
        throw new Error('Acesso restrito a síndicos e administradores')
      }
      
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Redirecionar imediatamente após login bem-sucedido
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Image 
            src="/logo.png" 
            alt="Zelou" 
            width={80}
            height={80}
            className="login-logo"
          />
          <h1 className="login-title">Dashboard Zelou</h1>
          <p className="login-subtitle">Acesso restrito a síndicos</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email ou CPF</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email ou CPF"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <span className="button-loading">
                <span className="spinner"></span>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Esqueceu sua senha? <a href="/contato">Entre em contato</a></p>
        </div>
      </div>
    </div>
  )
}

