'use client'

import { useEffect, useState } from 'react'
import { useStatistics } from '@/hooks/useStatistics'
import StatsCard from '@/components/dashboard/StatsCard'
import StatsChart from '@/components/dashboard/StatsChart'
import RecentActivity from '@/components/dashboard/RecentActivity'
import './page.css'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Buscar usuário do localStorage de forma rápida
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
        } catch {
          // Ignorar erro
        }
      }
    }
  }, [])

  // Determinar condominiumId baseado no usuário
  const condominiumId = user?.condominium?._id || user?.condominium
  const finalCondominiumId = user?.isMasterAdmin ? undefined : condominiumId

  // Usar hook customizado com cache
  const { stats, loading, error, refetch, isStale } = useStatistics({
    condominiumId: finalCondominiumId,
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Verificar a cada 5 minutos se precisa atualizar
  })

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando estatísticas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>❌ {error}</p>
        <button onClick={refetch} className="retry-button">
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="dashboard-page">
      {isStale && (
        <div className="cache-indicator">
          <span>⚠️ Dados podem estar desatualizados</span>
          <button onClick={refetch} className="refresh-button">
            Atualizar agora
          </button>
        </div>
      )}
      <div className="stats-grid">
        {user?.isMasterAdmin && (
          <StatsCard
            title="Total de Condomínios"
            value={stats.overview?.totalCondominiums || 0}
            icon="🏢"
            color="#8B5CF6"
          />
        )}
        <StatsCard
          title="Total de Usuários"
          value={stats.overview?.totalUsers || 0}
          icon="👥"
          color="#1ca8a8"
          trend={stats.recentActivity?.users || 0}
          trendLabel="novos (7 dias)"
        />
        <StatsCard
          title="Irregularidades"
          value={stats.overview?.totalReports || 0}
          icon="⚠️"
          color="#EF4444"
          trend={stats.recentActivity?.reports || 0}
          trendLabel="novas (7 dias)"
        />
        <StatsCard
          title="Reservas"
          value={stats.overview?.totalReservations || 0}
          icon="📅"
          color="#10B981"
          trend={stats.recentActivity?.reservations || 0}
          trendLabel="novas (7 dias)"
        />
        <StatsCard
          title="Entregas"
          value={stats.overview?.totalDeliveries || 0}
          icon="📦"
          color="#F59E0B"
          trend={stats.recentActivity?.deliveries || 0}
          trendLabel="novas (7 dias)"
        />
        {user?.isMasterAdmin && (
          <>
            <StatsCard
              title="Anúncios"
              value={stats.overview?.totalAnnouncements || 0}
              icon="📢"
              color="#6366F1"
            />
            <StatsCard
              title="Visitantes"
              value={stats.overview?.totalVisitors || 0}
              icon="🚪"
              color="#0EA5E9"
            />
            <StatsCard
              title="Manutenções"
              value={stats.overview?.totalMaintenances || 0}
              icon="🔧"
              color="#F97316"
            />
          </>
        )}
      </div>

      <div className="charts-grid">
        <StatsChart
          title="Irregularidades por Status"
          data={stats.reportsByStatus}
          type="pie"
        />
        <StatsChart
          title="Reservas por Status"
          data={stats.reservationsByStatus}
          type="bar"
        />
        <StatsChart
          title="Usuários por Função"
          data={stats.usersByRole}
          type="doughnut"
        />
      </div>

      <RecentActivity stats={stats} />

      {/* Métricas avançadas apenas para Master Admin */}
      {user?.isMasterAdmin && stats.masterAdminMetrics && (
        <div className="master-admin-metrics">
          <h2 className="section-title">📊 Métricas Avançadas (Master Admin)</h2>
          
          {/* Taxa de Crescimento */}
          <div className="growth-rates-section">
            <h3 className="subsection-title">Taxa de Crescimento (últimos 30 dias)</h3>
            <div className="growth-cards">
              <div className="growth-card">
                <div className="growth-header">
                  <span className="growth-icon">👥</span>
                  <span className="growth-label">Usuários</span>
                </div>
                <div className="growth-value">
                  {stats.masterAdminMetrics.growthRates.users.rate}%
                  <span className={`growth-trend ${stats.masterAdminMetrics.growthRates.users.trend}`}>
                    {stats.masterAdminMetrics.growthRates.users.trend === 'up' ? '📈' : '📉'}
                  </span>
                </div>
                <div className="growth-details">
                  {stats.masterAdminMetrics.growthRates.users.current} novos vs {stats.masterAdminMetrics.growthRates.users.previous} anteriores
                </div>
              </div>
              <div className="growth-card">
                <div className="growth-header">
                  <span className="growth-icon">🏢</span>
                  <span className="growth-label">Condomínios</span>
                </div>
                <div className="growth-value">
                  {stats.masterAdminMetrics.growthRates.condominiums.rate}%
                  <span className={`growth-trend ${stats.masterAdminMetrics.growthRates.condominiums.trend}`}>
                    {stats.masterAdminMetrics.growthRates.condominiums.trend === 'up' ? '📈' : '📉'}
                  </span>
                </div>
                <div className="growth-details">
                  {stats.masterAdminMetrics.growthRates.condominiums.current} novos vs {stats.masterAdminMetrics.growthRates.condominiums.previous} anteriores
                </div>
              </div>
            </div>
          </div>

          {/* Crescimento Mensal */}
          {stats.masterAdminMetrics.monthlyGrowth && stats.masterAdminMetrics.monthlyGrowth.length > 0 && (
            <div className="monthly-growth-section">
              <h3 className="subsection-title">Crescimento Mensal (últimos 6 meses)</h3>
              <StatsChart
                title=""
                data={stats.masterAdminMetrics.monthlyGrowth.reduce((acc: any, item: any) => {
                  acc[item.month] = item.users
                  return acc
                }, {})}
                type="bar"
              />
            </div>
          )}

          {/* Top Condomínios */}
          {stats.masterAdminMetrics.topCondominiums && stats.masterAdminMetrics.topCondominiums.length > 0 && (
            <div className="top-condominiums-section">
              <h3 className="subsection-title">Top 10 Condomínios por Usuários</h3>
              <div className="condominiums-table">
                <table>
                  <thead>
                    <tr>
                      <th>Posição</th>
                      <th>Condomínio</th>
                      <th>Usuários</th>
                      <th>Entregas</th>
                      <th>Relatórios</th>
                      <th>Reservas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.masterAdminMetrics.topCondominiums.map((condo: any, index: number) => (
                      <tr key={condo.condominiumId || index}>
                        <td>#{index + 1}</td>
                        <td>{condo.condominiumName || 'Não informado'}</td>
                        <td>{condo.userCount || 0}</td>
                        <td>{condo.deliveries || 0}</td>
                        <td>{condo.reports || 0}</td>
                        <td>{condo.reservations || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Uso de APIs */}
          {stats.masterAdminMetrics.apiUsage && (
            <div className="api-usage-section">
              <h3 className="subsection-title">Uso de Funcionalidades (Percentual por Usuário/Condomínio)</h3>
              <div className="api-usage-grid">
                {Object.entries(stats.masterAdminMetrics.apiUsage).map(([key, value]: [string, any]) => (
                  <div key={key} className="api-usage-card">
                    <div className="api-usage-header">
                      <span className="api-usage-label">{formatApiLabel(key)}</span>
                      <span className="api-usage-percentage">{value.percentage}%</span>
                    </div>
                    <div className="api-usage-bar">
                      <div 
                        className="api-usage-fill" 
                        style={{ width: `${Math.min(parseFloat(value.percentage), 100)}%` }}
                      ></div>
                    </div>
                    <div className="api-usage-total">Total: {value.total}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribuição por Estado */}
          {stats.masterAdminMetrics.usersByState && stats.masterAdminMetrics.usersByState.length > 0 && (
            <div className="users-by-state-section">
              <h3 className="subsection-title">Distribuição de Usuários por Estado</h3>
              <StatsChart
                title=""
                data={stats.masterAdminMetrics.usersByState.reduce((acc: any, item: any) => {
                  acc[item.state || 'Não informado'] = item.count
                  return acc
                }, {})}
                type="pie"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatApiLabel(key: string): string {
  const labels: Record<string, string> = {
    deliveries: 'Entregas',
    reports: 'Relatórios',
    reservations: 'Reservas',
    visitors: 'Visitantes',
    announcements: 'Anúncios',
    maintenances: 'Manutenções',
  }
  return labels[key] || key
}

