import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './page.css'

async function getPrivacyPolicy() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const res = await fetch(`${backendUrl}/api/legal/privacy-policy`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    return data.content
  } catch (error) {
    console.error('Erro ao carregar política de privacidade:', error)
    return '<p>Conteúdo não disponível no momento. Por favor, tente novamente mais tarde.</p>'
  }
}

export default async function PrivacyPolicyPage() {
  const content = await getPrivacyPolicy()

  return (
    <>
      <Header />
      <main>
        <section className="legal-page section">
          <div className="container">
            <h1 className="page-title">Política de Privacidade</h1>
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

