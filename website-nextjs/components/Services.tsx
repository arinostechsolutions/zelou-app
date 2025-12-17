import { Package, AlertTriangle, Calendar, Megaphone, Users, FileText, Wrench, Bell } from 'lucide-react'
import './Services.css'

export default function Services() {
  const services = [
    {
      icon: <Package size={32} />,
      title: 'Entregas',
      description: 'A portaria cadastra as encomendas, o morador recebe alerta no celular e retira apresentando o QR Code gerado pelo app.'
    },
    {
      icon: <AlertTriangle size={32} />,
      title: 'Irregularidades',
      description: 'Morador realiza relatórios de irregularidades à administração, podendo anexar imagens e descrever o problema.'
    },
    {
      icon: <Calendar size={32} />,
      title: 'Reservas',
      description: 'O morador faz as reservas das áreas comuns a qualquer hora, com aprovação automática ou manual conforme as regras.'
    },
    {
      icon: <Megaphone size={32} />,
      title: 'Comunicados',
      description: 'A administração envia comunicados importantes e os moradores recebem notificação push em seus celulares.'
    },
    {
      icon: <Users size={32} />,
      title: 'Visitantes',
      description: 'O morador autoriza a entrada de convidados e prestadores de serviços, podendo enviar convites por WhatsApp.'
    },
    {
      icon: <FileText size={32} />,
      title: 'Documentos',
      description: 'Moradores têm acesso aos documentos do condomínio como atas, convenção, regulamento interno, entre outros.'
    },
    {
      icon: <Wrench size={32} />,
      title: 'Manutenções',
      description: 'Solicitação e acompanhamento de serviços de manutenção no condomínio, com histórico completo.'
    },
    {
      icon: <Bell size={32} />,
      title: 'Notificações',
      description: 'Sistema completo de notificações push para manter todos informados sobre eventos importantes.'
    }
  ]

  return (
    <section className="services section">
      <div className="container">
        <h2 className="section-title">Nossos Serviços</h2>
        <p className="section-subtitle">
          Tudo pra facilitar a vida de quem mora em condomínio.
        </p>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

