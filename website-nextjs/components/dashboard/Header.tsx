'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import './Header.css'

interface User {
  condominium: {
    name: string
  }
}

export default function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null)
  const currentDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch {
          // Ignorar erro
        }
      }
    }
  }, [])

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-info">
          <h1 className="header-title">Dashboard</h1>
          <p className="header-date">{currentDate}</p>
        </div>
        <div className="header-condo">
          <span className="condo-badge">{user?.condominium?.name}</span>
        </div>
      </div>
    </header>
  )
}

