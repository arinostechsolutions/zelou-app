'use client'

import { useEffect, useState } from 'react'
import { reservationsApi } from '@/lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import './page.css'

interface Reservation {
  _id: string
  areaId: {
    name: string
  }
  userId: {
    name: string
    unit: {
      block?: string
      number: string
    }
  }
  date: string
  timeSlot: string
  status: string
  approvedBy?: {
    name: string
  }
  createdAt: string
}

export default function ReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todas')
  const [showPending, setShowPending] = useState(false)

  useEffect(() => {
    loadReservations()
  }, [filterStatus, showPending])

  const loadReservations = async () => {
    try {
      setLoading(true)
      setError('')
      let data
      if (showPending) {
        data = await reservationsApi.getPending()
      } else {
        const status = filterStatus === 'todas' ? undefined : filterStatus
        data = await reservationsApi.getAll(status)
      }
      setReservations(data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar reservas')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Deseja aprovar esta reserva?')) return
    
    try {
      await reservationsApi.approve(id)
      await loadReservations()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao aprovar reserva')
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Informe o motivo da rejeição (opcional):')
    if (reason === null) return
    
    try {
      await reservationsApi.reject(id, reason || undefined)
      await loadReservations()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao rejeitar reserva')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada': return '#10B981'
      case 'pendente': return '#F59E0B'
      case 'rejeitada': return '#EF4444'
      case 'cancelada': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovada': return 'Aprovada'
      case 'pendente': return 'Pendente'
      case 'rejeitada': return 'Rejeitada'
      case 'cancelada': return 'Cancelada'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Carregando reservas...</p>
      </div>
    )
  }

  return (
    <div className="reservas-page">
      <div className="page-header">
        <h1 className="page-title">Reservas</h1>
        <div className="header-actions">
          <button
            className={`toggle-btn ${showPending ? 'active' : ''}`}
            onClick={() => setShowPending(!showPending)}
          >
            {showPending ? '📋 Pendentes' : '📅 Todas'}
          </button>
          {!showPending && (
            <div className="filters">
              <button
                className={`filter-btn ${filterStatus === 'todas' ? 'active' : ''}`}
                onClick={() => setFilterStatus('todas')}
              >
                Todas
              </button>
              <button
                className={`filter-btn ${filterStatus === 'pendente' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pendente')}
              >
                Pendentes
              </button>
              <button
                className={`filter-btn ${filterStatus === 'aprovada' ? 'active' : ''}`}
                onClick={() => setFilterStatus('aprovada')}
              >
                Aprovadas
              </button>
              <button
                className={`filter-btn ${filterStatus === 'rejeitada' ? 'active' : ''}`}
                onClick={() => setFilterStatus('rejeitada')}
              >
                Rejeitadas
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <p>❌ {error}</p>
          <button onClick={loadReservations} className="retry-button">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="reservations-grid">
        {reservations.map((reservation) => (
          <div key={reservation._id} className="reservation-card">
            <div className="reservation-header">
              <div className="reservation-area">{reservation.areaId.name}</div>
              <div
                className="reservation-status"
                style={{ backgroundColor: `${getStatusColor(reservation.status)}20`, color: getStatusColor(reservation.status) }}
              >
                {getStatusLabel(reservation.status)}
              </div>
            </div>

            <div className="reservation-content">
              <div className="reservation-info">
                <div className="info-item">
                  <span className="info-label">📅 Data:</span>
                  <span className="info-value">
                    {format(new Date(reservation.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">🕐 Horário:</span>
                  <span className="info-value">{reservation.timeSlot}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">👤 Morador:</span>
                  <span className="info-value">
                    {reservation.userId.name} - {reservation.userId.unit.block ? `${reservation.userId.unit.block} - ` : ''}{reservation.userId.unit.number}
                  </span>
                </div>
                {reservation.approvedBy && (
                  <div className="info-item">
                    <span className="info-label">✅ Aprovada por:</span>
                    <span className="info-value">{reservation.approvedBy.name}</span>
                  </div>
                )}
              </div>
            </div>

            {reservation.status === 'pendente' && (
              <div className="reservation-actions">
                <button
                  className="action-btn approve-btn"
                  onClick={() => handleApprove(reservation._id)}
                >
                  ✅ Aprovar
                </button>
                <button
                  className="action-btn reject-btn"
                  onClick={() => handleReject(reservation._id)}
                >
                  ❌ Rejeitar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {reservations.length === 0 && !loading && (
        <div className="empty-state">
          <p>📅 Nenhuma reserva encontrada</p>
        </div>
      )}
    </div>
  )
}

