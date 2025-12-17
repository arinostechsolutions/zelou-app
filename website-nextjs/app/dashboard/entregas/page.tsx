'use client'

import { useEffect, useState, useMemo } from 'react'
import { deliveriesApi } from '@/lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, User as UserIcon, Calendar, Check, Package as PackageIcon } from 'lucide-react'
import './page.css'

interface Delivery {
  _id: string
  residentId: {
    _id?: string
    name: string
    unit?: {
      block?: string
      number: string
    }
  } | null
  createdBy?: {
    _id: string
    name: string
  }
  packageType?: string
  photoUrl: string
  status: string
  createdAt: string
  retrievedAt?: string
}

export default function EntregasPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todas')
  const [searchInput, setSearchInput] = useState('') // Valor do input (atualiza imediatamente)
  const [searchQuery, setSearchQuery] = useState('') // Valor usado na busca (com debounce)

  // Debounce: atualiza searchQuery após 500ms sem digitação
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500) // Aguarda 500ms após parar de digitar

    return () => clearTimeout(timer)
  }, [searchInput])

  // Carregar entregas quando filterStatus ou searchQuery mudarem
  useEffect(() => {
    loadDeliveries()
  }, [filterStatus, searchQuery])

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      setError('')
      const status = filterStatus === 'todas' ? undefined : filterStatus
      const searchTerm = searchQuery.trim() || undefined
      const data = await deliveriesApi.getAll(status, searchTerm)
      setDeliveries(data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar entregas')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recebida': return '#F59E0B'
      case 'retirada': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'recebida': return 'Recebida'
      case 'retirada': return 'Retirada'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Carregando entregas...</p>
      </div>
    )
  }

  return (
    <div className="entregas-page">
      <div className="page-header">
        <h1 className="page-title">Entregas</h1>
        <div className="header-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por morador ou unidade..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            {searchInput !== searchQuery && searchInput && (
              <span className="search-indicator">🔍 Buscando...</span>
            )}
          </div>
          <div className="filters">
            <button
              className={`filter-btn ${filterStatus === 'todas' ? 'active' : ''}`}
              onClick={() => setFilterStatus('todas')}
            >
              Todas
            </button>
            <button
              className={`filter-btn ${filterStatus === 'recebida' ? 'active' : ''}`}
              onClick={() => setFilterStatus('recebida')}
            >
              Recebidas
            </button>
            <button
              className={`filter-btn ${filterStatus === 'retirada' ? 'active' : ''}`}
              onClick={() => setFilterStatus('retirada')}
            >
              Retiradas
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <p><X size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />{error}</p>
          <button onClick={loadDeliveries} className="retry-button">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="deliveries-grid">
        {deliveries.map((delivery) => (
          <div key={delivery._id} className="delivery-card">
            <div className="delivery-header">
              <div className="delivery-type">{delivery.packageType || 'Encomenda'}</div>
              <div
                className="delivery-status"
                style={{ backgroundColor: `${getStatusColor(delivery.status)}20`, color: getStatusColor(delivery.status) }}
              >
                {getStatusLabel(delivery.status)}
              </div>
            </div>

            <div className="delivery-photo">
              <img src={delivery.photoUrl} alt="Foto da entrega" />
            </div>

            <div className="delivery-content">
              <div className="delivery-info">
                <div className="info-item">
                  <span className="info-label"><UserIcon size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />Morador:</span>
                  <span className="info-value">
                    {delivery.residentId ? (
                      <>
                        {delivery.residentId.name}
                        {delivery.residentId.unit && (
                          <> - {delivery.residentId.unit.block ? `${delivery.residentId.unit.block} - ` : ''}{delivery.residentId.unit.number}</>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>Morador não encontrado</span>
                    )}
                  </span>
                </div>
                {delivery.createdBy && (
                  <div className="info-item">
                    <span className="info-label">📝 Registrado por:</span>
                    <span className="info-value">{delivery.createdBy.name}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label"><Calendar size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />Recebida em:</span>
                  <span className="info-value">
                    {format(new Date(delivery.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {delivery.retrievedAt && (
                  <div className="info-item">
                    <span className="info-label"><Check size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />Retirada em:</span>
                    <span className="info-value">
                      {format(new Date(delivery.retrievedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {deliveries.length === 0 && !loading && (
        <div className="empty-state">
          <p><PackageIcon size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />Nenhuma entrega encontrada</p>
        </div>
      )}
    </div>
  )
}

