'use client'

import { useState, useRef, useEffect, TouchEvent, MouseEvent } from 'react'
import Image from 'next/image'
import './MockupCarousel.css'

interface MockupImage {
  src: string
  alt: string
  title: string
  description: string
}

export default function MockupCarousel() {
  const mockups: MockupImage[] = [
    {
      src: '/tela-login.PNG',
      alt: 'Tela de Login',
      title: 'Login Seguro',
      description: 'Acesse o aplicativo de forma segura com autenticação robusta. O sistema de login do Zelou garante que apenas moradores autorizados tenham acesso às funcionalidades do condomínio, protegendo informações pessoais e mantendo a privacidade de todos os usuários.',
    },
    {
      src: '/menu.PNG',
      alt: 'Menu Principal',
      title: 'Menu Intuitivo',
      description: 'Navegue facilmente por todas as funcionalidades do aplicativo através de um menu intuitivo e organizado. O design pensado na experiência do usuário permite acesso rápido a reservas, entregas, manutenções, documentos e muito mais, tudo em um só lugar.',
    },
    {
      src: '/reservas.PNG',
      alt: 'Reservas',
      title: 'Reservas de Áreas',
      description: 'Gerencie as reservas de áreas comuns do condomínio de forma simples e eficiente. Visualize disponibilidade em tempo real, faça reservas com poucos toques e receba confirmações instantâneas. Nunca mais perca a oportunidade de usar a piscina, salão de festas ou quadra esportiva.',
    },
    {
      src: '/detalhes-entrega.PNG',
      alt: 'Detalhes de Entrega',
      title: 'Gestão de Entregas',
      description: 'Acompanhe todas as suas entregas em tempo real. O sistema de gestão de entregas do Zelou permite que você veja quando um pacote chegou, quem recebeu, e receba notificações quando houver novas entregas. Organize e controle tudo sem sair de casa.',
    },
    {
      src: '/manutenções.PNG',
      alt: 'Manutenções',
      title: 'Controle de Manutenções',
      description: 'Mantenha-se informado sobre todas as manutenções programadas e em andamento no condomínio. Visualize o histórico completo, acompanhe o status das solicitações e receba avisos sobre interrupções de serviços. Transparência total para os moradores.',
    },
    {
      src: '/detalhe-smanutenção.PNG',
      alt: 'Detalhes de Manutenção',
      title: 'Detalhes de Manutenção',
      description: 'Acesse informações detalhadas sobre cada manutenção, incluindo descrição do serviço, prazo estimado, responsável pela execução e status atual. Tenha visibilidade completa de tudo que acontece no condomínio, garantindo transparência e organização.',
    },
  ]

  // Criar array infinito: duplicar os mockups para criar loop
  const infiniteMockups = [...mockups, ...mockups, ...mockups]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [selectedMockup, setSelectedMockup] = useState<MockupImage | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const clickStartX = useRef(0)
  const clickStartY = useRef(0)
  const hasMoved = useRef(false)

  const getItemWidth = () => {
    if (!carouselRef.current || typeof window === 'undefined') return 0
    const firstSlide = carouselRef.current.querySelector('.mockup-slide') as HTMLElement
    if (!firstSlide) return 0
    // Gap é 60px no desktop, 40px no tablet, 32px no mobile
    const gap = window.innerWidth > 968 ? 60 : window.innerWidth > 768 ? 40 : 32
    return firstSlide.offsetWidth + gap
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current || isScrollingRef.current) return
    e.preventDefault()
    setIsDragging(true)
    setStartX(e.pageX - carouselRef.current.offsetLeft)
    setScrollLeft(carouselRef.current.scrollLeft)
    clickStartX.current = e.pageX
    clickStartY.current = e.pageY
    hasMoved.current = false
    carouselRef.current.style.cursor = 'grabbing'
    carouselRef.current.style.userSelect = 'none'
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current || isScrollingRef.current) return
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 2.5 // Velocidade aumentada para scroll mais fluido
    carouselRef.current.scrollLeft = scrollLeft - walk
    
    // Marcar que houve movimento
    const deltaX = Math.abs(e.pageX - clickStartX.current)
    const deltaY = Math.abs(e.pageY - clickStartY.current)
    if (deltaX > 5 || deltaY > 5) {
      hasMoved.current = true
    }
  }

  const handleMouseUp = (e?: MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return
    
    // Verificar se foi um clique (não um arrasto)
    if (e && !hasMoved.current) {
      const target = e.target as HTMLElement
      const mockupSlide = target.closest('.mockup-slide')
      if (mockupSlide) {
        const slideIndex = Array.from(carouselRef.current.children).indexOf(mockupSlide as Element)
        const realIndex = slideIndex % mockups.length
        setSelectedMockup(mockups[realIndex])
      }
    }
    
    setIsDragging(false)
    hasMoved.current = false
    carouselRef.current.style.cursor = 'grab'
    carouselRef.current.style.userSelect = 'auto'
    // Não fazer snap, deixar scroll livre e fluido
    updateCurrentIndex()
  }

  const handleMouseLeave = () => {
    if (!carouselRef.current) return
    setIsDragging(false)
    hasMoved.current = false
    carouselRef.current.style.cursor = 'grab'
    carouselRef.current.style.userSelect = 'auto'
    // Não fazer snap, deixar scroll livre e fluido
    updateCurrentIndex()
  }

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!carouselRef.current || isScrollingRef.current) return
    setIsDragging(true)
    const touch = e.touches[0]
    setStartX(touch.pageX - carouselRef.current.offsetLeft)
    setScrollLeft(carouselRef.current.scrollLeft)
    clickStartX.current = touch.pageX
    clickStartY.current = touch.pageY
    hasMoved.current = false
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current || isScrollingRef.current) return
    const touch = e.touches[0]
    const x = touch.pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 2.5 // Velocidade aumentada para scroll mais fluido
    carouselRef.current.scrollLeft = scrollLeft - walk
    
    // Marcar que houve movimento
    const deltaX = Math.abs(touch.pageX - clickStartX.current)
    const deltaY = Math.abs(touch.pageY - clickStartY.current)
    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true
    }
  }

  const handleTouchEnd = (e?: TouchEvent<HTMLDivElement>) => {
    if (!carouselRef.current) {
      setIsDragging(false)
      hasMoved.current = false
      return
    }
    
    // Verificar se foi um toque (não um arrasto)
    if (e && !hasMoved.current) {
      const touch = e.changedTouches[0]
      const target = document.elementFromPoint(touch.pageX, touch.pageY)
      if (target) {
        const mockupSlide = target.closest('.mockup-slide')
        if (mockupSlide && carouselRef.current) {
          const slideIndex = Array.from(carouselRef.current.children).indexOf(mockupSlide as Element)
          const realIndex = slideIndex % mockups.length
          setSelectedMockup(mockups[realIndex])
        }
      }
    }
    
    setIsDragging(false)
    hasMoved.current = false
    // Não fazer snap, deixar scroll livre e fluido
    updateCurrentIndex()
  }

  const updateCurrentIndex = () => {
    // Apenas atualizar o índice atual sem snap
    if (!carouselRef.current) return
    const itemWidth = getItemWidth()
    if (itemWidth === 0) return

    const scrollPosition = carouselRef.current.scrollLeft
    const newIndex = Math.round(scrollPosition / itemWidth)
    const realIndex = newIndex % mockups.length
    setCurrentIndex(realIndex)

    // Resetar posição quando necessário para criar loop infinito (sem animação, imperceptível)
    const middleSection = itemWidth * mockups.length
    const currentScroll = carouselRef.current.scrollLeft

    if (currentScroll < middleSection - itemWidth * 2) {
      carouselRef.current.scrollLeft = currentScroll + middleSection
    } else if (currentScroll > middleSection * 2 + itemWidth * 2) {
      carouselRef.current.scrollLeft = currentScroll - middleSection
    }
  }

  const goToSlide = (index: number) => {
    if (!carouselRef.current || isScrollingRef.current) return
    const itemWidth = getItemWidth()
    if (itemWidth === 0) return

    // Calcular posição no array infinito (começar do meio + índice)
    const currentScroll = carouselRef.current.scrollLeft
    const currentRealIndex = Math.round(currentScroll / itemWidth) % mockups.length
    const middleSection = mockups.length * itemWidth
    
    // Calcular a posição mais próxima no array infinito
    let targetIndex = middleSection + index
    
    // Se estiver na primeira seção, usar a segunda
    if (currentScroll < middleSection) {
      targetIndex = middleSection + index
    }
    // Se estiver na terceira seção, usar a segunda
    else if (currentScroll > middleSection * 2) {
      targetIndex = middleSection + index
    }
    // Se estiver na segunda seção, ajustar baseado na direção
    else {
      const diff = (index - currentRealIndex + mockups.length) % mockups.length
      if (diff > mockups.length / 2) {
        targetIndex = currentScroll - (mockups.length - diff) * itemWidth
      } else {
        targetIndex = currentScroll + diff * itemWidth
      }
    }
    
    isScrollingRef.current = true
    carouselRef.current.scrollTo({
      left: targetIndex,
      behavior: 'smooth',
    })
    setCurrentIndex(index)

    setTimeout(() => {
      isScrollingRef.current = false
    }, 500)
  }

  const goToPrevious = () => {
    const newIndex = (currentIndex - 1 + mockups.length) % mockups.length
    goToSlide(newIndex)
  }

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % mockups.length
    goToSlide(newIndex)
  }

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    // Aguardar o carregamento das imagens para calcular largura corretamente
    const initCarousel = () => {
      const itemWidth = getItemWidth()
      if (itemWidth > 0) {
        // Inicializar posição no meio do array infinito
        carousel.scrollLeft = mockups.length * itemWidth
      }
    }

    // Tentar inicializar imediatamente
    initCarousel()

    // Se não funcionar, tentar após um pequeno delay
    const timeoutId = setTimeout(initCarousel, 100)

    const handleScroll = () => {
      if (isScrollingRef.current) return
      const itemWidth = getItemWidth()
      if (itemWidth === 0) return

      const scrollPosition = carousel.scrollLeft
      const middleSection = itemWidth * mockups.length

      // Atualizar índice real (sem snap, apenas para indicadores)
      const newIndex = Math.round(scrollPosition / itemWidth)
      const realIndex = newIndex % mockups.length
      setCurrentIndex(realIndex)

      // Resetar posição para criar loop infinito (sem animação, imperceptível)
      if (scrollPosition < middleSection - itemWidth * 2) {
        carousel.scrollLeft = scrollPosition + middleSection
      } else if (scrollPosition > middleSection * 2 + itemWidth * 2) {
        carousel.scrollLeft = scrollPosition - middleSection
      }
    }

    carousel.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      clearTimeout(timeoutId)
      carousel.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Fechar modal com ESC e prevenir scroll do body
  useEffect(() => {
    if (selectedMockup) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelectedMockup(null)
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [selectedMockup])

  return (
    <section className="mockup-carousel-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Conheça o Zelou</h2>
          <p className="section-subtitle">
            Explore as funcionalidades do nosso aplicativo através dos mockups
          </p>
        </div>

        <div className="carousel-wrapper">
          <button
            className="carousel-nav-button carousel-nav-prev"
            onClick={goToPrevious}
            aria-label="Anterior"
          >
            <span>‹</span>
          </button>

          <div
            ref={carouselRef}
            className="mockup-carousel"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={(e) => handleMouseUp(e)}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e)}
          >
            {infiniteMockups.map((mockup, index) => (
              <div key={index} className="mockup-slide">
                <div className="mockup-container">
                  <div className="mockup-frame">
                    <Image
                      src={mockup.src}
                      alt={mockup.alt}
                      fill
                      className="mockup-image"
                      sizes="(max-width: 768px) 100vw, 400px"
                      priority={index >= mockups.length && index < mockups.length * 2}
                    />
                  </div>
                  <div className="mockup-title">{mockup.title}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="carousel-nav-button carousel-nav-next"
            onClick={goToNext}
            aria-label="Próximo"
          >
            <span>›</span>
          </button>
        </div>

        <div className="carousel-indicators">
          {mockups.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedMockup && (
        <div 
          className="mockup-modal-overlay"
          onClick={() => setSelectedMockup(null)}
        >
          <div 
            className="mockup-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="mockup-modal-close"
              onClick={() => setSelectedMockup(null)}
              aria-label="Fechar modal"
            >
              ×
            </button>
            <div className="mockup-modal-info">
              <h3 className="mockup-modal-title">{selectedMockup.title}</h3>
              <p className="mockup-modal-description">{selectedMockup.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

