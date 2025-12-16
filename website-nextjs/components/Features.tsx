import './Features.css'

export default function Features() {
  return (
    <section className="features section">
      <div className="container">
        <h2 className="section-title">Fácil e intuitivo</h2>
        <p className="section-subtitle">
          Visualize e controle tudo pelo painel administrativo
        </p>
        <div className="features-content">
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Painel Administrativo</h3>
            <p className="feature-description">
              O Zelou tem uma excelente interface para a administração visualizar e controlar 
              o que os moradores estão acionando no aplicativo.
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📱</div>
            <h3 className="feature-title">Aplicativo Mobile</h3>
            <p className="feature-description">
              Moradores utilizam a plataforma baixando o aplicativo na Apple Store (iOS) ou 
              Play Store (Android). Totalmente integrado e em tempo real.
            </p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔔</div>
            <h3 className="feature-title">Alertas em Tempo Real</h3>
            <p className="feature-description">
              A administração é avisada por meio de alertas no painel quando o morador faz 
              uma reserva, envia mensagem ou realiza uma ocorrência.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

