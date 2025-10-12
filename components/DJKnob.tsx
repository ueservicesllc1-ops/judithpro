'use client'

import React, { useState, useRef, useEffect } from 'react'

interface DJKnobProps {
  value: number // 0 to 1
  onChange: (value: number) => void
  size?: number
  label?: string
  isMuted?: boolean
  onMuteToggle?: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  disabled?: boolean
  invertLED?: boolean // Invierte la línea LED 180 grados
}

const DJKnob: React.FC<DJKnobProps> = ({ 
  value, 
  onChange, 
  size = 120,
  label = 'VOLUME',
  isMuted = false,
  onMuteToggle,
  onDragStart,
  onDragEnd,
  disabled = false,
  invertLED = false
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const knobRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const startValueRef = useRef<number>(0)

  // Convert value (0-1) to angle (-135 to 135 degrees, 270 degree range)
  const valueToAngle = (val: number) => (val * 270) - 135

  // Convert angle to value
  const angleToValue = (angle: number) => (angle + 135) / 270

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    startYRef.current = e.clientY
    startValueRef.current = value
    if (onDragStart) onDragStart()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    startYRef.current = e.touches[0].clientY
    startValueRef.current = value
    if (onDragStart) onDragStart()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (clientY: number) => {
      const deltaY = startYRef.current - clientY
      const sensitivity = 0.005
      const newValue = Math.max(0, Math.min(1, startValueRef.current + deltaY * sensitivity))
      onChange(newValue)
    }

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY)
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY)

    const handleEnd = () => {
      setIsDragging(false)
      if (onDragEnd) onDragEnd()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, onChange])

  // Mouse wheel support (usando listener nativo para preventDefault)
  useEffect(() => {
    const knobElement = knobRef.current
    if (!knobElement) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = -e.deltaY * 0.001
      const newValue = Math.max(0, Math.min(1, value + delta))
      onChange(newValue)
    }

    knobElement.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      knobElement.removeEventListener('wheel', handleWheel)
    }
  }, [value, onChange])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault()
        onChange(Math.min(1, value + 0.05))
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault()
        onChange(Math.max(0, value - 0.05))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [value, onChange])

  const angle = valueToAngle(value)
  const ledAngle = invertLED ? angle + 180 : angle // Invertir LED 180 grados si está activado
  const ledCount = 28 // Menos LEDs para mayor separación
  const activeLeds = Math.round(value * ledCount)

  return (
    <div className={`flex flex-col items-center space-y-6 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Label - LED Display */}
      {label && (
        <div 
          className="relative px-3 py-1.5"
          style={{
            background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
            boxShadow: `
              inset 0 2px 4px rgba(0,0,0,0.8),
              inset 0 -1px 2px rgba(255,255,255,0.05),
              0 2px 8px rgba(0,0,0,0.6)
            `
          }}
        >
          {/* LED Screen */}
          <div 
            className="relative px-4 py-1.5"
            style={{
              background: 'linear-gradient(180deg, #001a00 0%, #003300 50%, #001a00 100%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)',
              border: '1px solid #002200'
            }}
          >
            <div 
              className="text-xs font-bold tracking-widest text-center"
              style={{
                color: '#00ff00',
                textShadow: '0 0 8px rgba(0,255,0,0.8), 0 0 4px rgba(0,255,0,0.5)',
                fontFamily: 'monospace',
                letterSpacing: '0.3em'
              }}
            >
              {label}
            </div>
          </div>
        </div>
      )}

      {/* Knob Container */}
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Outer Ring - Metal texture */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%)',
            boxShadow: `
              inset 0 2px 4px rgba(255,255,255,0.1),
              inset 0 -2px 4px rgba(0,0,0,0.5),
              0 8px 16px rgba(0,0,0,0.6)
            `
          }}
        />

        {/* Knob Body */}
        <div
          ref={knobRef}
          className="absolute inset-0 m-3 rounded-full cursor-pointer select-none"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, #374151, #1f2937 60%, #111827)
            `,
            boxShadow: `
              inset 0 -2px 8px rgba(0,0,0,0.8),
              inset 0 2px 4px rgba(255,255,255,0.05),
              0 4px 8px rgba(0,0,0,0.4)
            `,
            transform: `rotate(${ledAngle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Indicator Line */}
          <div
            className="absolute top-2 left-1/2 w-1 h-6 -ml-0.5 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.8), 0 0 12px rgba(59, 130, 246, 0.4)'
            }}
          />

          {/* Center Cap - Con botón de mute */}
          <div
            className="absolute inset-0 m-6 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 40% 40%, #1f2937, #111827)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
            }}
          >
            {/* Botón Mute/Unmute */}
            {onMuteToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMuteToggle()
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-700"
                style={{
                  pointerEvents: 'auto'
                }}
              >
                {isMuted ? (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            )}
          </div>

        </div>

        {/* LED Ring - Puntos alrededor del botón (ENCIMA) */}
        <div className="absolute -inset-3 pointer-events-none" style={{ zIndex: 10 }}>
          <svg 
            className="w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            {Array.from({ length: ledCount }).map((_, i) => {
              const ledAngle = (i / ledCount) * 270 - 135 // De -135° a 135° (270° de rango, inicia desde abajo izquierda)
              const rad = (ledAngle * Math.PI) / 180
              const x = 50 + Math.cos(rad) * 48
              const y = 50 + Math.sin(rad) * 48
              const isActive = i < activeLeds
              
              // Color based on position
              let color = '#374151' // gray-700 inactive
              if (isActive) {
                if (i < ledCount * 0.6) {
                  color = '#22c55e' // green
                } else if (i < ledCount * 0.85) {
                  color = '#eab308' // yellow
                } else {
                  color = '#ef4444' // red
                }
              }

              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill={color}
                  className="transition-all duration-100"
                  style={{
                    opacity: isActive ? 1 : 0.35
                  }}
                />
              )
            })}
          </svg>
        </div>
      </div>

      {/* Volume Percentage */}
      <div className="text-center -mt-3">
        <div className="text-xs font-bold text-white tabular-nums">
          {Math.round(value * 100)}
        </div>
        <div className="text-[8px] text-gray-500">
          %
        </div>
      </div>
    </div>
  )
}

export default DJKnob

