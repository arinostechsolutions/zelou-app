'use client'

import { useEffect, useState } from 'react'
import { usersApi } from '@/lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import './page.css'

interface User {
  _id: string
  name: string
  email: string
  role: string
  unit: {
    block?: string
    number: string
  }
  createdAt: string
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterRole, setFilterRole] = useState<string>('todas')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [filterRole])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await usersApi.getAll()
      setUsers(data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'morador': 'Morador',
      'porteiro': 'Porteiro',
      'zelador': 'Zelador',
      'sindico': 'Síndico',
      'master': 'Master Admin',
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'morador': '#1ca8a8',
      'porteiro': '#0ea5e9',
      'zelador': '#10B981',
      'sindico': '#F59E0B',
      'master': '#8B5CF6',
    }
    return colors[role] || '#6B7280'
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'todas' || user.role === filterRole
    const matchesSearch = !search || 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.unit.number.includes(search) ||
      (user.unit.block && user.unit.block.toLowerCase().includes(search.toLowerCase()))
    return matchesRole && matchesSearch
  })

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    )
  }

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <h1 className="page-title">Usuários</h1>
        <div className="header-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por nome, email ou unidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filters">
            <button
              className={`filter-btn ${filterRole === 'todas' ? 'active' : ''}`}
              onClick={() => setFilterRole('todas')}
            >
              Todas
            </button>
            <button
              className={`filter-btn ${filterRole === 'morador' ? 'active' : ''}`}
              onClick={() => setFilterRole('morador')}
            >
              Moradores
            </button>
            <button
              className={`filter-btn ${filterRole === 'porteiro' ? 'active' : ''}`}
              onClick={() => setFilterRole('porteiro')}
            >
              Porteiros
            </button>
            <button
              className={`filter-btn ${filterRole === 'zelador' ? 'active' : ''}`}
              onClick={() => setFilterRole('zelador')}
            >
              Zeladores
            </button>
            <button
              className={`filter-btn ${filterRole === 'sindico' ? 'active' : ''}`}
              onClick={() => setFilterRole('sindico')}
            >
              Síndicos
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <p>❌ {error}</p>
          <button onClick={loadUsers} className="retry-button">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Unidade</th>
              <th>Função</th>
              <th>Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="user-name-cell">
                    <div className="user-avatar-small">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  {user.unit.block ? `${user.unit.block} - ` : ''}{user.unit.number}
                </td>
                <td>
                  <span
                    className="role-badge"
                    style={{
                      backgroundColor: `${getRoleColor(user.role)}20`,
                      color: getRoleColor(user.role),
                    }}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>
                  {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="empty-state">
          <p>👥 Nenhum usuário encontrado</p>
        </div>
      )}

      <div className="users-summary">
        <div className="summary-card">
          <span className="summary-label">Total de Usuários:</span>
          <span className="summary-value">{users.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Filtrados:</span>
          <span className="summary-value">{filteredUsers.length}</span>
        </div>
      </div>
    </div>
  )
}

