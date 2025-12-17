import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import './page.css'

export default function PrecosPage() {
  const plans = [
    {
      name: 'Até 60 unidades',
      price: '490,90',
      period: 'mensal',
      description: 'O valor mensal é fixo.',
      features: [
        'Taxa de Implantação',
        'Custo de Treinamento On-line',
        'Módulo Portaria',
        'Módulo Encomendas',
        'Todos os recursos básicos'
      ],
      popular: false
    },
    {
      name: 'De 61 a 100 unidades',
      price: '690,90',
      period: 'mensal',
      description: 'O valor mensal é fixo.',
      features: [
        'Taxa de Implantação',
        'Custo de Treinamento On-line',
        'Módulo Portaria',
        'Módulo Encomendas',
        'Todos os recursos básicos'
      ],
      popular: true
    },
    {
      name: 'De 101 a 200 unidades',
      price: '879,90',
      period: 'mensal',
      description: 'O valor mensal é fixo.',
      features: [
        'Taxa de Implantação',
        'Custo de Treinamento On-line',
        'Módulo Portaria',
        'Módulo Encomendas',
        'Todos os recursos básicos'
      ],
      popular: false
    },
    {
      name: 'De 201 a 300 unidades',
      price: '1.159,90',
      period: 'mensal',
      description: 'O valor mensal é fixo.',
      features: [
        'Taxa de Implantação',
        'Custo de Treinamento On-line',
        'Módulo Portaria',
        'Módulo Encomendas',
        'Todos os recursos básicos'
      ],
      popular: false
    },
    {
      name: 'Acima de 300 unidades',
      price: 'Consultar',
      period: '',
      description: 'Entre em contato para um orçamento personalizado.',
      features: [
        'Taxa de Implantação',
        'Custo de Treinamento On-line',
        'Módulo Portaria',
        'Módulo Encomendas',
        'Todos os recursos básicos',
        'Atendimento personalizado'
      ],
      popular: false,
      custom: true
    }
  ]

  return (
    <>
      <Header />
      <main>
        <section className="pricing section">
          <div className="container">
            <h1 className="page-title">Preços Simples e Acessíveis</h1>
            <p className="page-subtitle">
              Experimente Agora o Zelou por 30 dias de Graça!
            </p>
            <div className="pricing-grid">
              {plans.map((plan, index) => (
                <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                  {plan.popular && <div className="popular-badge">Mais Popular</div>}
                  <h2 className="plan-name">{plan.name}</h2>
                  <div className="plan-price">
                    {!plan.custom ? (
                      <>
                        <span className="currency">R$</span>
                        <span className="amount">{plan.price}</span>
                        <span className="period">/{plan.period}</span>
                      </>
                    ) : (
                      <span className="amount" style={{ fontSize: '2.5rem' }}>{plan.price}</span>
                    )}
                  </div>
                  <p className="plan-description">{plan.description}</p>
                  <ul className="plan-features">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="feature-item">
                        <span className="check-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/contato" className="btn btn-primary plan-button">
                    Faça sua Inscrição Agora
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

