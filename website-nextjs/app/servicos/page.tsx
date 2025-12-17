import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Package, AlertTriangle, Calendar, Megaphone, Users, FileText, Wrench, Bell } from 'lucide-react'
import './page.css'

export default function ServicosPage() {
  const services = [
    {
      icon: <Package size={32} />,
      title: 'Entregas',
      description: 'A portaria registra a entrada da encomenda através de fotos, informações adicionais e o morador recebe uma notificação no celular dos detalhes da chegada desta encomenda. Depois que o morador retira a encomenda, a portaria registra a retirada através do app ou do painel web, mantendo um histórico completo de todas as entregas.'
    },
    {
      icon: <AlertTriangle size={32} />,
      title: 'Irregularidades',
      description: 'Morador realiza ocorrência privada à administração, podendo anexar imagem e descrever o problema detalhadamente.'
    },
    {
      icon: <Calendar size={32} />,
      title: 'Reservas',
      description: 'O morador faz as reservas das áreas comuns a qualquer hora, com sistema de aprovação automática ou manual conforme as regras do condomínio.'
    },
    {
      icon: <Megaphone size={32} />,
      title: 'Comunicados',
      description: 'A administração envia comunicados importantes e os moradores recebem notificação push em seus celulares.'
    },
    {
      icon: <Users size={32} />,
      title: 'Visitantes',
      description: 'O morador autoriza a entrada de convidados e/ou prestadores de serviços eventuais à portaria. Podendo inclusive enviar convites aos seus visitantes por meio do WhatsApp.'
    },
    {
      icon: <FileText size={32} />,
      title: 'Documentos',
      description: 'Moradores têm acesso aos documentos do condomínio como: Atas, convenção, regulamento interno, entre outros.'
    },
    {
      icon: <Wrench size={32} />,
      title: 'Manutenções',
      description: 'Solicitação e acompanhamento de serviços de manutenção no condomínio, com histórico completo e status em tempo real.'
    },
    {
      icon: <Bell size={32} />,
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

