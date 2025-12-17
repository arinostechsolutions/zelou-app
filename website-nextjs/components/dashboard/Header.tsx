'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Menu, X } from 'lucide-react'
import './Header.css'

interface User {
  condominium: {
    name: string
  }
}

export default function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

    // Controlar sidebar
    const sidebar = document.querySelector('.dashboard-sidebar')
    if (sidebar) {
      if (sidebarOpen) {
        sidebar.classList.add('open')
      } else {
        sidebar.classList.remove('open')
      }
    }
  }, [sidebarOpen])

  useEffect(() => {
    // Fechar sidebar ao clicar fora
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.querySelector('.dashboard-sidebar')
      const menuButton = document.querySelector('.menu-toggle-button')
      if (sidebar && sidebarOpen && 
          !sidebar.contains(e.target as Node) && 
          !menuButton?.contains(e.target as Node)) {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [sidebarOpen])

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <button 
          className="menu-toggle-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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

