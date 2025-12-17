'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, AlertTriangle, Calendar, Package, Users, LogOut } from 'lucide-react'
import './Sidebar.css'

interface User {
  name: string
  role: string
  condominium: {
    name: string
  }
}

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

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

  const handleLogout = () => {
    // Limpar dados de autenticação
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Limpar cache também
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('zelou_cache_')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    // Usar window.location.href para garantir navegação completa
    window.location.href = '/dashboard/login'
  }

  const menuItems = [
    { path: '/dashboard', icon: <BarChart3 size={20} />, label: 'Dashboard', exact: true },
    { path: '/dashboard/irregularidades', icon: <AlertTriangle size={20} />, label: 'Irregularidades' },
    { path: '/dashboard/reservas', icon: <Calendar size={20} />, label: 'Reservas' },
    { path: '/dashboard/entregas', icon: <Package size={20} />, label: 'Entregas' },
    { path: '/dashboard/usuarios', icon: <Users size={20} />, label: 'Usuários' },
  ]

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <Image 
          src="/logo.png" 
          alt="Zelou" 
          width={50}
          height={50}
          className="sidebar-logo"
        />
        <div className="sidebar-title">
          <h2>Zelou</h2>
          <p>Dashboard</p>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <p className="user-name">{user?.name}</p>
          <p className="user-role">
            {user?.role === 'sindico' ? 'Síndico' : 'Administrador'}
          </p>
          <p className="user-condo">{user?.condominium?.name}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.path
            : pathname.startsWith(item.path)
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              prefetch={true}
            >
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut size={20} /></span>
          <span className="nav-label">Sair</span>
        </button>
      </div>
    </aside>
  )
}

