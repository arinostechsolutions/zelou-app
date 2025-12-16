import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './page.css'

export default function ServicosPage() {
  const services = [
    {
      icon: '📦',
      title: 'Entregas',
      description: 'A portaria cadastra as encomendas por meio de leitor de código de barras, morador recebe alerta no celular e retira o objeto apresentando o QR Code gerado pelo app.'
    },
    {
      icon: '⚠️',
      title: 'Irregularidades',
      description: 'Morador realiza ocorrência privada à administração, podendo anexar imagem e descrever o problema detalhadamente.'
    },
    {
      icon: '📅',
      title: 'Reservas',
      description: 'O morador faz as reservas das áreas comuns a qualquer hora, com sistema de aprovação automática ou manual conforme as regras do condomínio.'
    },
    {
      icon: '📢',
      title: 'Comunicados',
      description: 'A administração envia comunicados importantes e os moradores recebem notificação push em seus celulares. Podem também baixar o arquivo PDF do comunicado.'
    },
    {
      icon: '👥',
      title: 'Visitantes',
      description: 'O morador autoriza a entrada de convidados e/ou prestadores de serviços eventuais à portaria. Podendo inclusive enviar convites aos seus visitantes por meio do WhatsApp.'
    },
    {
      icon: '📄',
      title: 'Documentos',
      description: 'Moradores têm acesso aos documentos do condomínio como: Atas, convenção, regulamento interno, entre outros.'
    },
    {
      icon: '🔧',
      title: 'Manutenções',
      description: 'Solicitação e acompanhamento de serviços de manutenção no condomínio, com histórico completo e status em tempo real.'
    },
    {
      icon: '🔔',
      title: 'Notificações',
      description: 'Sistema completo de notificações push para manter todos informados sobre eventos importantes do condomínio.'
    }
  ]

  return (
    <>
      <Header />
      <main>
        <section className="services-page section">
          <div className="container">
            <h1 className="page-title">Nossos Serviços</h1>
            <p className="page-subtitle">
              Tudo pra facilitar a vida de quem mora em condomínio.
            </p>
            <div className="services-list">
              {services.map((service, index) => (
                <div key={index} className="service-item">
                  <div className="service-item-icon">{service.icon}</div>
                  <div className="service-item-content">
                    <h2 className="service-item-title">{service.title}</h2>
                    <p className="service-item-description">{service.description}</p>
                  </div>
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

