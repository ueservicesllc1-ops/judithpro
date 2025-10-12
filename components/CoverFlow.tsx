'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Music, Clock, Ruler, Settings, Play, Pause } from 'lucide-react'
// Sin GSAP - usando CSS puro para el efecto iTunes

// Componente para cargar imagen del cover
const CoverImage: React.FC<{ coverId: string, gradient: string, title: string }> = ({ coverId, gradient, title }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  
  const coverIdMap: { [key: string]: number } = {
    'youtube-extract': 1,
    'chord-analysis': 2,
    'audio-separation': 3,
    'metronome': 4,
    'bpm-display': 5,
    'tempo-change': 6,
    'pitch-change': 7,
    'volume-control': 8,
    // 'recording': 9,        // DESHABILITADO PARA V1.0
    // 'beat-editor': 10,     // DESHABILITADO PARA V1.0
    // 'click-track': 11      // DESHABILITADO PARA V1.0
  }
  
  const imageNumber = coverIdMap[coverId]
  
  useEffect(() => {
    if (!imageNumber) return
    
    // Intentar primero con .jpg, si falla intentar con .jpeg
    setCurrentImageUrl(`/images/cover${imageNumber}.jpg`)
  }, [imageNumber])
  
  const handleImageError = () => {
    // Si falla con .jpg, intentar con .jpeg
    if (currentImageUrl && currentImageUrl.endsWith('.jpg')) {
      setCurrentImageUrl(`/images/cover${imageNumber}.jpeg`)
    } else {
      setImageLoaded(false)
    }
  }
  
  return (
    <>
      {currentImageUrl && (
        <img 
          src={currentImageUrl} 
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          style={{ 
            display: imageLoaded ? 'block' : 'none',
            borderRadius: '0px',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            imageRendering: 'auto'
          }}
        />
      )}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ 
          background: gradient,
          display: imageLoaded ? 'none' : 'block',
          borderRadius: '0px',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      />
    </>
  )
}

interface Cover {
  id: string
  title: string
  description: string
  icon: React.ElementType
  bgColor: string
  textColor: string
  action: () => void
  color: string
  gradient: string
}

interface CoverFlowProps {
  covers: Cover[]
  onCoverSelect?: (cover: Cover) => void
  compact?: boolean
}

const CoverFlow: React.FC<CoverFlowProps> = ({ covers, onCoverSelect, compact = false }) => {
  const [currentIndex, setCurrentIndex] = useState(Math.floor(covers.length / 2))
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const slidesRef = useRef<(HTMLDivElement | null)[]>([])
  const draggableRef = useRef<any>(null)

  // Función para obtener el estilo de cada cover (estilo iTunes puro)
  const getCoverStyle = React.useCallback((index: number) => {
    const offset = index - currentIndex
    const distance = Math.abs(offset)
    
    // Mostrar 5 covers: central + 2 laterales + 2 más atrás
    if (distance > 2) {
      return {
        transform: 'translateX(0px) translateY(0px) translateZ(-1000px) rotateY(0deg) scale(0)',
        opacity: 0,
        zIndex: -1000,
        transition: 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    }
    
    // Posición base para iTunes style
    let translateX = offset * 240 // MENOS separación - más juntos
    let translateY = compact ? -80 : -40 // SUBIR AÚN MÁS EN MODO COMPACTO
    let translateZ = -distance * 70
    let rotateY = offset * 20 // Menos rotación - más juntos
    let scale = 1
    let opacity = 1

    // Ajustes para el cover central - MUY GRANDE
    if (offset === 0) {
      scale = 1.5 // Mucho más grande
      translateZ = 0
      rotateY = 0
      opacity = 1
    }

    // Ajustes para covers laterales - MÁS JUNTOS
    if (distance === 1) {
      scale = 1.0 // UNIFORMES
      translateZ = -80 // Más juntos
      opacity = 0.9 // MENOS TRANSPARENTES
    }

    // Ajustes para covers más atrás - MÁS JUNTOS
    if (distance === 2) {
      scale = 0.9 // UNIFORMES
      translateZ = -220 // MÁS ATRÁS QUE LOS LATERALES
      opacity = 0.8 // MENOS TRANSPARENTES
    }

    // Ajustar z-index para que los más atrás queden detrás de los laterales
    let zIndex = covers.length - distance
    if (distance === 2) {
      zIndex = covers.length - 3 // Los más atrás tienen menor z-index
    }

    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity: opacity,
      zIndex: zIndex,
      transition: 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }
  }, [currentIndex, covers.length])

  // Navegación con teclado - CARRUSEL INFINITO
  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    if (isAnimating) return

    if (event.key === 'ArrowRight') {
      setCurrentIndex(prev => prev === covers.length - 1 ? 0 : prev + 1)
    } else if (event.key === 'ArrowLeft') {
      setCurrentIndex(prev => prev === 0 ? covers.length - 1 : prev - 1)
    } else if (event.key === 'Enter') {
      onCoverSelect?.(covers[currentIndex])
      covers[currentIndex]?.action()
    }
  }, [isAnimating, currentIndex, covers, onCoverSelect])

  // Click en cover
  const handleCoverClick = React.useCallback((cover: Cover, index: number) => {
    if (isAnimating) return
    
    setCurrentIndex(index)
    onCoverSelect?.(cover)
    cover.action()
  }, [isAnimating, onCoverSelect])

  // Navegación manual - CARRUSEL INFINITO
  const handlePrevious = React.useCallback(() => {
    if (isAnimating) return
    setCurrentIndex(prev => prev === 0 ? covers.length - 1 : prev - 1)
  }, [isAnimating, covers.length])

  const handleNext = React.useCallback(() => {
    if (isAnimating) return
    setCurrentIndex(prev => prev === covers.length - 1 ? 0 : prev + 1)
  }, [isAnimating, covers.length])

  // Efecto hover 3D (CSS puro)
  const handleMouseEnter = React.useCallback((index: number) => {
    if (isAnimating) return
    
    const slide = slidesRef.current[index]
    if (!slide) return

    const offset = index - currentIndex
    const distance = Math.abs(offset)
    let newScale = 1.2
    let newRotateY = (index - currentIndex) * -30 - 3

    // Ajustar escala según la distancia - MÁS UNIFORMES
    if (distance === 0) {
      newScale = 1.6 // Central
    } else if (distance === 1) {
      newScale = 1.1 // Laterales más uniformes
    } else if (distance === 2) {
      newScale = 1.0 // Más atrás más uniformes
    }

    slide.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        slide.style.transform = `translateX(${offset * 240}px) translateY(${compact ? -80 : -40}px) translateZ(${-Math.abs(offset) * 70}px) rotateY(${newRotateY}deg) scale(${newScale})`
  }, [isAnimating, currentIndex])

  const handleMouseLeave = React.useCallback((index: number) => {
    if (isAnimating) return
    
    const slide = slidesRef.current[index]
    if (!slide) return

    // Restaurar el estilo original
    const style = getCoverStyle(index)
    slide.style.transform = style.transform
    slide.style.opacity = style.opacity.toString()
  }, [isAnimating, currentIndex, getCoverStyle])

  // Configurar eventos de mouse para swipe básico
  useEffect(() => {
    if (!containerRef.current) return

    let startX = 0
    let isDragging = false

    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX
      isDragging = true
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging) return
      isDragging = false

      const deltaX = e.clientX - startX
      const threshold = 50

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          setCurrentIndex(prev => prev === 0 ? covers.length - 1 : prev - 1)
        } else if (deltaX < 0) {
          setCurrentIndex(prev => prev === covers.length - 1 ? 0 : prev + 1)
        }
      }
    }

    const container = containerRef.current
    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [currentIndex, covers.length])

  // Configurar eventos y animaciones
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <div className="w-full h-80 flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Controles de navegación */}
      <div className="flex items-center justify-between w-full mb-6 px-8 z-10">
        <button
          onClick={handlePrevious}
          disabled={isAnimating}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg rounded-full"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        
        {/* Indicadores */}
        <div className="flex space-x-2">
          {covers.map((_, index) => (
            <button
              key={index}
              onClick={() => handleCoverClick(covers[index], index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-blue-400 scale-125 shadow-lg shadow-blue-500/50' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              disabled={isAnimating}
            />
          ))}
        </div>
        
        <button
          onClick={handleNext}
          disabled={isAnimating}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg rounded-full"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Área principal del CoverFlow */}
      <div 
        ref={containerRef}
        className="relative w-full h-64 flex items-center justify-center"
        style={{ 
          perspective: '1200px',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Piso con reflejo de cristal tipo espejo */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.1) 100%)',
            backdropFilter: 'blur(4px)',
            borderTop: '2px solid rgba(255,255,255,0.15)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 -20px 40px rgba(0,0,0,0.3)'
          }}
        />
        
        <div className="relative w-full h-full flex items-center justify-center">
          {covers.map((cover, index) => (
            <div
              key={cover.id}
              ref={(el) => { slidesRef.current[index] = el }}
              className="absolute cursor-pointer"
              onClick={() => handleCoverClick(cover, index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
              style={{
                ...getCoverStyle(index),
                transformStyle: 'preserve-3d',
                width: compact ? '240px' : '360px',
                height: compact ? '126px' : '190px' // Mantener proporción 1.91:1
              }}
            >
              {/* Cover principal */}
              <div
                className="w-full h-full relative overflow-hidden group"
                style={{
                  borderRadius: '0px',
                  transformStyle: 'preserve-3d',
                  boxShadow: `
                    0 20px 60px rgba(0, 0, 0, 0.8),
                    0 10px 30px rgba(0, 0, 0, 0.6)
                  `,
                  border: 'none',
                  outline: 'none',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)'
                }}
              >
                {/* Imagen de fondo que cubre todo el cover */}
                <CoverImage coverId={cover.id} gradient={cover.gradient} title={cover.title} />
                
                {/* Overlay oscuro para mejor legibilidad del texto */}
                <div className="absolute inset-0 bg-black/20" style={{ borderRadius: '0px' }} />
                
                {/* Efecto de cristal superior */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" style={{ borderRadius: '0px' }} />
                
                {/* Reflejo superior */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent" style={{ borderRadius: '0px' }} />
                
                {/* Contenido del cover - Con título visible */}
                <div className="relative z-10 h-full flex flex-col items-center justify-end p-4">
                  {/* Título del cover */}
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg mb-1 drop-shadow-lg">
                      {cover.title}
                    </h3>
                    <p className="text-white/90 text-xs drop-shadow-md leading-tight">
                      {cover.description}
                    </p>
                  </div>
                </div>

                {/* Borde brillante para el cover activo */}
                {index === currentIndex && (
                  <div className="absolute inset-0 border-2 border-white/50 rounded-16" 
                       style={{ boxShadow: `0 0 30px ${cover.color}80` }} />
                )}
              </div>
              
              {/* Reflejo en el piso */}
              <div
                className="absolute top-full left-0 w-full h-32 opacity-30"
                style={{
                  background: cover.gradient,
                  transform: 'scaleY(-1)',
                  filter: 'blur(4px) brightness(0.7)',
                  borderRadius: '16px',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Efecto de cristal en el reflejo */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/25 via-transparent to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default CoverFlow
