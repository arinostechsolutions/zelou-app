'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import './ImageCarousel.css'

interface CarouselImage {
  src: string
  alt: string
  title?: string
  description?: string
}

interface ImageCarouselProps {
  images: CarouselImage[]
  autoPlay?: boolean
  interval?: number
  showDots?: boolean
  showArrows?: boolean
}

export default function ImageCarousel({
  images,
  autoPlay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!autoPlay || isPaused || images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, isPaused, images.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div
      className="image-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel-container">
        {images.map((image, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            <div className="slide-image">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="image"
                priority={index === 0}
                sizes="100vw"
              />
              {(image.title || image.description) && (
                <div className="slide-overlay">
                  <div className="slide-content">
                    {image.title && <h3 className="slide-title">{image.title}</h3>}
                    {image.description && (
                      <p className="slide-description">{image.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showArrows && images.length > 1 && (
        <>
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={goToPrevious}
            aria-label="Imagem anterior"
          >
            <span>‹</span>
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={goToNext}
            aria-label="Próxima imagem"
          >
            <span>›</span>
          </button>
        </>
      )}

      {showDots && images.length > 1 && (
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

