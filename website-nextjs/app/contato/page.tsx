'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './page.css'

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    condominium: '',
    units: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Erro ao enviar')

      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        condominium: '',
        units: '',
        message: ''
      })
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main>
        <section className="contact section">
          <div className="container">
            <h1 className="page-title">Fale com o Zelou</h1>
            <p className="page-subtitle">
              Entre em contato conosco e descubra como podemos ajudar seu condomínio
            </p>
            
            <div className="contact-content">
              <div className="contact-info">
                <h2>Informações de Contato</h2>
                <div className="info-item">
                  <strong>Email:</strong>
                  <a href="mailto:contato@ag2tecnologia.com">contato@ag2tecnologia.com</a>
                </div>
                <div className="info-item">
                  <strong>WhatsApp:</strong>
                  <a href="https://wa.me/5522992645933" target="_blank" rel="noopener noreferrer">
                    (22) 99264-5933
                  </a>
                </div>
              </div>

              <form className="contact-form" onSubmit={handleSubmit}>
                {success && (
                  <div className="success-message">
                    Mensagem enviada com sucesso! Entraremos em contato em breve.
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="name">
                    <span className="label-icon">👤</span>
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <span className="label-icon">📧</span>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    <span className="label-icon">📱</span>
                    Telefone/WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="condominium">
                    <span className="label-icon">🏢</span>
                    Nome do Condomínio
                  </label>
                  <input
                    type="text"
                    id="condominium"
                    name="condominium"
                    value={formData.condominium}
                    onChange={handleChange}
                    placeholder="Nome do seu condomínio"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="units">
                    <span className="label-icon">🏠</span>
                    Quantidade de Unidades
                  </label>
                  <input
                    type="number"
                    id="units"
                    name="units"
                    value={formData.units}
                    onChange={handleChange}
                    placeholder="Ex: 50"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">
                    <span className="label-icon">💬</span>
                    Mensagem *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Conte-nos como podemos ajudar seu condomínio..."
                    rows={5}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <span className="button-spinner"></span>
                      Enviando...
                    </span>
                  ) : (
                    'Enviar Mensagem'
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

