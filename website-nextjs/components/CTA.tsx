import Link from 'next/link'
import './CTA.css'

export default function CTA() {
  return (
    <section className="cta section">
      <div className="container">
        <div className="cta-content">
          <h2 className="cta-title">Que tal experimentar agora?</h2>
          <p className="cta-description">
            Cadastre seu condomínio e receba uma conta para testes.
          </p>
          <Link href="/precos" className="btn btn-primary cta-button">
            <span>Começar Agora</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

