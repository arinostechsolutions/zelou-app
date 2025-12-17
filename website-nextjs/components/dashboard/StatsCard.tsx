'use client'

import { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'
import './StatsCard.css'

interface StatsCardProps {
  title: string
  value: number
  icon: string | ReactNode
  color: string
  trend?: number
  trendLabel?: string
}

export default function StatsCard({ title, value, icon, color, trend, trendLabel }: StatsCardProps) {
  return (
    <div className="stats-card" style={{ borderTopColor: color }}>
      <div className="stats-card-header">
        <span className="stats-icon" style={{ backgroundColor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {typeof icon === 'string' ? icon : icon}
        </span>
        <h3 className="stats-title">{title}</h3>
      </div>
      <div className="stats-card-body">
        <p className="stats-value" style={{ color }}>
          {value.toLocaleString('pt-BR')}
        </p>
        {trend !== undefined && (
          <p className="stats-trend">
            <span className="trend-icon"><TrendingUp size={16} /></span>
            <span>{trend} {trendLabel || 'novos'}</span>
          </p>
        )}
      </div>
    </div>
  )
}

