'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'
import './layout.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  // IMPORTANTE: Todos os hooks devem ser chamados antes de qualquer retorno antecipado
  useEffect(() => {
    // Se estiver na página de login, não precisa verificar autenticação
    if (pathname === '/dashboard/login') {
      setIsAuthorized(null) // Não importa para a página de login
      return
    }

    // Verificação rápida e não-bloqueante
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      
      if (!token || !savedUser) {
        setIsAuthorized(false)
        router.push('/dashboard/login')
        return
      }

      try {
        const user = JSON.parse(savedUser)
        if (user.role === 'sindico' || user.isMasterAdmin) {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
          router.push('/dashboard/login')
        }
      } catch {
        setIsAuthorized(false)
        router.push('/dashboard/login')
      }
    }
  }, [router, pathname])

  // Se estiver na página de login, não aplicar o layout do dashboard
  if (pathname === '/dashboard/login') {
    return <>{children}</>
  }

  // Mostrar loading apenas enquanto verifica (muito rápido)
  if (isAuthorized === null) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}

