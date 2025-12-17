import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Smartphone, UserCog, Wrench, DoorOpen } from 'lucide-react'
import './page.css'

export default function HowToUsePage() {
  const steps = [
    {
      title: 'Moradores',
      description: 'Moradores utilizam a plataforma baixando o aplicativo na Apple Store (iOS) ou Play Store (Android). Moradores titulares por meio do aplicativo ingressam seus dependentes.',
      icon: <Smartphone size={32} />
    },
    {
      title: 'Síndicos',
      description: 'Os síndicos recebem treinamento presencial e/ou online sobre como proceder com a inclusão de: usuários, áreas comuns, documentos, imagens de eventos e sobretudo de como visualizar e controlar as interações dos moradores.',
      icon: <UserCog size={32} />
    },
    {
      title: 'Zelador',
      description: 'Os zeladores recebem treinamento presencial e/ou online sobre como gerenciar irregularidades, aprovar reservas de áreas comuns, visualizar relatórios e manter a comunicação com moradores e administração.',
      icon: <Wrench size={32} />
    },
    {
      title: 'Portaria',
      description: 'Os Agentes de Portaria recebem treinamento presencial e/ou online de como: Visualizar, editar as informações, gerar entrada e saída dos visitantes autorizados pelos moradores.',
      icon: <DoorOpen size={32} />
    }
  ]

  return (
    <>
      <Header />
      <main>
        <section className="how-to-use section">
          <div className="container">
            <h1 className="page-title">Como usar a plataforma</h1>
            <p className="page-subtitle">
              Todos os atores conectados, compartilhando informações, transformam o eco-sistema condominial.
            </p>
            <div className="steps-grid">
              {steps.map((step, index) => (
                <div key={index} className="step-card">
                  <div className="step-icon">{step.icon}</div>
                  <h2 className="step-title">{step.title}</h2>
                  <p className="step-description">{step.description}</p>
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

