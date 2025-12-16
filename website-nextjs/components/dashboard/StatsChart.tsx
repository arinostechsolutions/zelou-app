'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './StatsChart.css'

interface StatsChartProps {
  title: string
  data: Record<string, number>
  type: 'pie' | 'bar' | 'doughnut'
}

const COLORS = [
  '#1ca8a8', // Primary teal
  '#0ea5e9', // Sky blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
]

export default function StatsChart({ title, data, type }: StatsChartProps) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name: formatLabel(name),
    value,
  }))

  if (chartData.length === 0) {
    return (
      <div className="stats-chart">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-empty">
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stats-chart">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        {type === 'pie' || type === 'doughnut' ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={type === 'doughnut' ? 80 : 100}
                innerRadius={type === 'doughnut' ? 40 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="url(#colorGradient)" 
                radius={[10, 10, 0, 0]}
                animationDuration={1000}
              >
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1ca8a8" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function formatLabel(label: string): string {
  const labels: Record<string, string> = {
    'aberta': 'Aberta',
    'andamento': 'Em Andamento',
    'concluida': 'Concluída',
    'pendente': 'Pendente',
    'aprovada': 'Aprovada',
    'rejeitada': 'Rejeitada',
    'cancelada': 'Cancelada',
    'recebida': 'Recebida',
    'retirada': 'Retirada',
    'morador': 'Morador',
    'porteiro': 'Porteiro',
    'zelador': 'Zelador',
    'sindico': 'Síndico',
    'master': 'Master',
  }
  return labels[label] || label.charAt(0).toUpperCase() + label.slice(1)
}

