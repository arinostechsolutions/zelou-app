import Link from 'next/link'
import Image from 'next/image'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <Image 
                src="/logo.png" 
                alt="Zelou" 
                width={40}
                height={40}
                className="footer-logo-image"
              />
              <h3 className="footer-title">Zelou</h3>
            </div>
            <p className="footer-description">
              A tecnologia que transforma a gestão do seu condomínio.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Links Rápidos</h4>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/servicos">Serviços</Link></li>
              <li><Link href="/como-usar">Como Usar</Link></li>
              <li><Link href="/precos">Preços</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li><Link href="/politica-privacidade">Política de Privacidade</Link></li>
              <li><Link href="/termos-uso">Termos de Uso</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Contato</h4>
            <ul className="footer-links">
              <li><Link href="/contato">Fale Conosco</Link></li>
              <li>
                <a href="mailto:contato@ag2tecnologia.com">contato@ag2tecnologia.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Zelou. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

