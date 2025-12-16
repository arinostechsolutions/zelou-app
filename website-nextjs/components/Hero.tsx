import Link from 'next/link'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            Zelou
            <span className="hero-subtitle">A tecnologia que transforma.</span>
          </h1>
          <p className="hero-description">
            O Zelou é a plataforma digital que facilita a vida de quem administra e mora em condomínio. 
            Uma rede de gestão colaborativa completa para síndicos, administradores e moradores.
          </p>
          <div className="hero-buttons">
            <Link href="/precos" className="btn btn-primary">
              Experimente Agora
            </Link>
            <Link href="/servicos" className="btn btn-secondary">
              Conheça os Serviços
            </Link>
          </div>
        </div>
      </div>
      <div className="hero-background">
        <div className="hero-gradient"></div>
      </div>
    </section>
  )
}

