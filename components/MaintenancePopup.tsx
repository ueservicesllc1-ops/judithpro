'use client'

import React, { useState, useEffect } from 'react'
import { Clock, AlertTriangle, Zap, RefreshCw } from 'lucide-react'
import Image from 'next/image'

interface MaintenancePopupProps {
  isOpen: boolean
  onClose: () => void
  customMessage?: string
}

const MaintenancePopup: React.FC<MaintenancePopupProps> = ({ isOpen, onClose, customMessage }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Secuencia de animaciones
      setTimeout(() => setAnimationPhase(1), 100)
      setTimeout(() => setAnimationPhase(2), 300)
      setTimeout(() => setAnimationPhase(3), 500)
    }
  }, [isOpen])

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentSecond = now.getSeconds()
      
      // Calcular minutos hasta las 8 AM
      let hoursUntil8 = 8 - currentHour
      let minutesUntil8 = 60 - currentMinute
      let secondsUntil8 = 60 - currentSecond
      
      // Ajustar si ya pasó las 8 AM del día actual
      if (currentHour >= 8) {
        hoursUntil8 = (24 - currentHour) + 8
      }
      
      // Corregir minutos y segundos
      if (currentMinute > 0) {
        hoursUntil8 -= 1
      } else {
        minutesUntil8 = 0
      }
      
      if (currentSecond > 0 && currentMinute === 0) {
        minutesUntil8 = 59
        hoursUntil8 -= 1
      }
      
      const totalMinutes = (hoursUntil8 * 60) + minutesUntil8
      const totalSeconds = (totalMinutes * 60) + secondsUntil8
      
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    // Actualizar inmediatamente
    updateCountdown()
    
    // Actualizar cada segundo
    const interval = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop con efecto de blur y partículas */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        style={{
          animation: isVisible ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out'
        }}
      >
        {/* Partículas flotantes con colores de mantenimiento */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Modal principal */}
      <div 
        className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-black border-2 border-orange-500/30 rounded-3xl p-8 max-w-2xl mx-4 shadow-2xl"
        style={{
          animation: isVisible ? 'slideInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideOutScale 0.3s ease-out',
          boxShadow: '0 0 50px rgba(249, 115, 22, 0.3), inset 0 0 50px rgba(75, 85, 99, 0.1)'
        }}
      >
        {/* Contenido principal */}
        <div className="text-center space-y-6">
          {/* Icono de mantenimiento */}
          <div 
            className="relative"
            style={{
              animation: animationPhase >= 1 ? 'bounceIn 0.6s ease-out' : 'none',
              opacity: animationPhase >= 1 ? 1 : 0
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-12 h-12 text-white animate-spin" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <AlertTriangle className="w-8 h-8 text-yellow-400 animate-bounce" />
                </div>
              </div>
            </div>
          </div>

          {/* Título principal */}
          <div 
            className="space-y-4"
            style={{
              animation: animationPhase >= 2 ? 'slideInUp 0.6s ease-out' : 'none',
              opacity: animationPhase >= 2 ? 1 : 0
            }}
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              🛠️ Mantenimiento Programado
            </h2>
            <div className="text-xl text-gray-300 leading-relaxed">
              <p className="mb-4">
                {customMessage || 'Judith está en mantenimiento para mejorar tu experiencia'}
              </p>
              <p className="text-gray-400">
                Volveremos a las <span className="text-yellow-400 font-bold">8:00 AM EST</span>
              </p>
            </div>
          </div>

          {/* Cuenta regresiva */}
          <div 
            className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-orange-500/20"
            style={{
              animation: animationPhase >= 3 ? 'slideInUp 0.6s ease-out' : 'none',
              opacity: animationPhase >= 3 ? 1 : 0
            }}
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Clock className="w-6 h-6 text-orange-400" />
              <span className="text-gray-300 font-semibold">Tiempo restante:</span>
            </div>
            
            <div className="text-4xl font-mono font-bold text-orange-400 mb-2">
              {timeLeft}
            </div>
            
            <div className="text-sm text-gray-400">
              Horas : Minutos : Segundos
            </div>
          </div>

          {/* Información adicional */}
          <div 
            className="space-y-3"
            style={{
              animation: animationPhase >= 3 ? 'slideInUp 0.6s ease-out' : 'none',
              opacity: animationPhase >= 3 ? 1 : 0
            }}
          >
            <div className="flex items-center justify-center space-x-3 p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300">Optimizando servidores para mejor rendimiento</span>
            </div>
            
            <div className="text-sm text-gray-400">
              Este mantenimiento nos permite brindarte una experiencia más rápida y estable
            </div>
          </div>

          {/* Botón de cerrar (opcional) */}
          <div 
            className="pt-4"
            style={{
              animation: animationPhase >= 3 ? 'slideInUp 0.6s ease-out' : 'none',
              opacity: animationPhase >= 3 ? 1 : 0
            }}
          >
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 font-semibold rounded-full text-sm transition-all duration-300 border border-gray-600"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>

      {/* Estilos CSS para las animaciones */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes slideInScale {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(50px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes slideOutScale {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translateY(-50px);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  )
}

export default MaintenancePopup
