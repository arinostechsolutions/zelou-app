'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { reportsApi } from '@/lib/api'
import { useCachedData } from '@/hooks/useCachedData'
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import './page.css'

interface Report {
  _id: string
  category: string
  description: string
  location: string
  status: string
  photos: string[]
  userId: {
    name: string
    unit: {
      block?: string
      number: string
    }
  }
  createdAt: string
  history: Array<{
    status: string
    comment?: string
    changedBy: {
      name: string
      role: string
    }
    date: string
  }>
}

export default function IrregularidadesPage() {
  const { user } = useAuth()
  const [filterStatus, setFilterStatus] = useState<string>('todas')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  // Memoizar a função de fetch para evitar recriação a cada render
  const fetchReports = useMemo(
    () => () => reportsApi.getAll(filterStatus === 'todas' ? undefined : filterStatus),
    [filterStatus]
  )

  // Usar hook com cache
  const cacheKey = useMemo(
    () => `${CACHE_KEYS.REPORTS}_${filterStatus || 'todas'}`,
    [filterStatus]
  )

  const { data: reports = [], loading, error, refetch, invalidate } = useCachedData<Report[]>({
    cacheKey,
    fetchFn: fetchReports,
    ttl: CACHE_TTL.REPORTS,
    enabled: !!user,
  })

  const handleStatusChange = async (reportId: string, newStatus: string, comment?: string) => {
    try {
      await reportsApi.updateStatus(reportId, newStatus, comment)
      // Invalidar cache de todos os filtros de reports para garantir sincronização
      Object.keys(localStorage).forEach(key => {
        if (key.includes(CACHE_KEYS.REPORTS)) {
          localStorage.removeItem(key)
        }
      })
      // Recarregar dados
      invalidate()
      setSelectedReport(null)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao atualizar status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta': return '#EF4444'
      case 'andamento': return '#F59E0B'
      case 'concluida': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta': return 'Aberta'
      case 'andamento': return 'Em Andamento'
      case 'concluida': return 'Concluída'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Carregando irregularidades...</p>
      </div>
    )
  }

  return (
    <div className="irregularidades-page">
      <div className="page-header">
        <h1 className="page-title">Irregularidades</h1>
        <div className="filters">
          <button
            className={`filter-btn ${filterStatus === 'todas' ? 'active' : ''}`}
            onClick={() => setFilterStatus('todas')}
          >
            Todas
          </button>
          <button
            className={`filter-btn ${filterStatus === 'aberta' ? 'active' : ''}`}
            onClick={() => setFilterStatus('aberta')}
          >
            Abertas
          </button>
          <button
            className={`filter-btn ${filterStatus === 'andamento' ? 'active' : ''}`}
            onClick={() => setFilterStatus('andamento')}
          >
            Em Andamento
          </button>
          <button
            className={`filter-btn ${filterStatus === 'concluida' ? 'active' : ''}`}
            onClick={() => setFilterStatus('concluida')}
          >
            Concluídas
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <p>❌ {error}</p>
          <button onClick={() => refetch()} className="retry-button">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="reports-grid">
        {(reports || []).map((report) => (
          <div key={report._id} className="report-card">
            <div className="report-header">
              <div className="report-category">{report.category}</div>
              <div
                className="report-status"
                style={{ backgroundColor: `${getStatusColor(report.status)}20`, color: getStatusColor(report.status) }}
              >
                {getStatusLabel(report.status)}
              </div>
            </div>

            <div className="report-content">
              <p className="report-description">{report.description}</p>
              <div className="report-location">
                <span className="location-icon">📍</span>
                {report.location}
              </div>
              <div className="report-user">
                <span className="user-icon">👤</span>
                {report.userId.name} - {report.userId.unit.block ? `${report.userId.unit.block} - ` : ''}{report.userId.unit.number}
              </div>
              <div className="report-date">
                {format(new Date(report.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>

            {report.photos && report.photos.length > 0 && (
              <div className="report-photos">
                {report.photos.slice(0, 3).map((photo, idx) => (
                  <img key={idx} src={photo} alt={`Foto ${idx + 1}`} className="report-photo" />
                ))}
              </div>
            )}

            <div className="report-actions">
              <button
                className="action-btn view-btn"
                onClick={() => setSelectedReport(report)}
              >
                Ver Detalhes
              </button>
              {report.status !== 'concluida' && (
                <select
                  className="status-select"
                  value={report.status}
                  onChange={(e) => handleStatusChange(report._id, e.target.value)}
                >
                  <option value="aberta">Aberta</option>
                  <option value="andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!reports || reports.length === 0) && !loading && (
        <div className="empty-state">
          <p>📋 Nenhuma irregularidade encontrada</p>
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReport(null)}>×</button>
            <h2>Detalhes da Irregularidade</h2>
            <div className="modal-body">
              <div className="detail-item">
                <strong>Categoria:</strong> {selectedReport.category}
              </div>
              <div className="detail-item">
                <strong>Descrição:</strong> {selectedReport.description}
              </div>
              <div className="detail-item">
                <strong>Local:</strong> {selectedReport.location}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {getStatusLabel(selectedReport.status)}
              </div>
              <div className="detail-item">
                <strong>Morador:</strong> {selectedReport.userId.name} - {selectedReport.userId.unit.block ? `${selectedReport.userId.unit.block} - ` : ''}{selectedReport.userId.unit.number}
              </div>
              {selectedReport.history && selectedReport.history.length > 0 && (
                <div className="detail-item">
                  <strong>Histórico:</strong>
                  <div className="history-list">
                    {selectedReport.history.map((entry, idx) => (
                      <div key={idx} className="history-item">
                        <span>{getStatusLabel(entry.status)}</span>
                        <span>{entry.changedBy.name} ({entry.changedBy.role})</span>
                        <span>{format(new Date(entry.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        {entry.comment && <p className="history-comment">{entry.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

