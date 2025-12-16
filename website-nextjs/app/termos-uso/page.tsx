import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './page.css'

async function getTermsOfUse() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const res = await fetch(`${backendUrl}/api/legal/terms-of-use`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    return data.content
  } catch (error) {
    console.error('Erro ao carregar termos de uso:', error)
    return '<p>Conteúdo não disponível no momento. Por favor, tente novamente mais tarde.</p>'
  }
}

export default async function TermsOfUsePage() {
  const content = await getTermsOfUse()

  return (
    <>
      <Header />
      <main>
        <section className="legal-page section">
          <div className="container">
            <h1 className="page-title">Termos de Uso</h1>
            <div 
              className="legal-content" 
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

