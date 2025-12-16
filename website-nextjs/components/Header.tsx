'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import './Header.css'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo">
            <Image 
              src="/logo.png" 
              alt="Zelou" 
              width={40}
              height={40}
              className="logo-image"
              priority
            />
            <span className="logo-text">Zelou</span>
          </Link>

          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            <Link 
              href="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/servicos" 
              className={`nav-link ${isActive('/servicos') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Serviços
            </Link>
            <Link 
              href="/como-usar" 
              className={`nav-link ${isActive('/como-usar') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Como Usar
            </Link>
            <Link 
              href="/precos" 
              className={`nav-link ${isActive('/precos') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Preços
            </Link>
            <Link 
              href="/contato" 
              className={`nav-link ${isActive('/contato') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Contato
            </Link>
            <Link 
              href="/dashboard/login" 
              className="btn btn-primary login-btn"
              onClick={() => setMenuOpen(false)}
              prefetch={true}
            >
              Login
            </Link>
          </nav>

          <button 
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? 'open' : ''}></span>
            <span className={menuOpen ? 'open' : ''}></span>
            <span className={menuOpen ? 'open' : ''}></span>
          </button>
        </div>
      </div>
    </header>
  )
}

