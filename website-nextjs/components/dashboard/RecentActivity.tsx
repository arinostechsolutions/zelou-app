'use client'

import './RecentActivity.css'

interface RecentActivityProps {
  stats: any
}

export default function RecentActivity({ stats }: RecentActivityProps) {
  const activities = [
    {
      label: 'Novos usuários',
      value: stats.recentActivity?.users || 0,
      icon: '👥',
      color: '#1ca8a8',
    },
    {
      label: 'Novas irregularidades',
      value: stats.recentActivity?.reports || 0,
      icon: '⚠️',
      color: '#EF4444',
    },
    {
      label: 'Novas reservas',
      value: stats.recentActivity?.reservations || 0,
      icon: '📅',
      color: '#10B981',
    },
    {
      label: 'Novas entregas',
      value: stats.recentActivity?.deliveries || 0,
      icon: '📦',
      color: '#F59E0B',
    },
  ]

  return (
    <div className="recent-activity">
      <h2 className="activity-title">Atividade Recente (Últimos 7 dias)</h2>
      <div className="activity-grid">
        {activities.map((activity, index) => (
          <div key={index} className="activity-item" style={{ borderLeftColor: activity.color }}>
            <div className="activity-icon" style={{ backgroundColor: `${activity.color}20` }}>
              {activity.icon}
            </div>
            <div className="activity-content">
              <p className="activity-label">{activity.label}</p>
              <p className="activity-value" style={{ color: activity.color }}>
                {activity.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

