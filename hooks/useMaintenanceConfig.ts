'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface MaintenanceConfig {
  isActive: boolean
  startTime: string
  endTime: string
  message: string
}

export const useMaintenanceConfig = () => {
  const [config, setConfig] = useState<MaintenanceConfig>({
    isActive: true, // Activo para testing
    startTime: '02:00',
    endTime: '08:00',
    message: 'Judith está en mantenimiento para mejorar tu experiencia'
  })
  const [isMaintenanceTime, setIsMaintenanceTime] = useState(true) // Cambiar a true para testing local
  const [loading, setLoading] = useState(true)

  // Cargar configuración desde Firestore
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configRef = doc(db, 'admin', 'maintenance')
        const configDoc = await getDoc(configRef)
        
        if (configDoc.exists()) {
          const data = configDoc.data() as MaintenanceConfig
          setConfig(data)
        }
      } catch (error) {
        console.error('Error cargando configuración de mantenimiento:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Verificar si es horario de mantenimiento
  useEffect(() => {
    if (!config.isActive) {
      setIsMaintenanceTime(false)
      return
    }

    const checkMaintenanceTime = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute

      // Convertir horarios de inicio y fin a minutos
      const [startHour, startMin] = config.startTime.split(':').map(Number)
      const [endHour, endMin] = config.endTime.split(':').map(Number)
      
      const startTimeMinutes = startHour * 60 + startMin
      const endTimeMinutes = endHour * 60 + endMin

      // Verificar si estamos en horario de mantenimiento
      let inMaintenance = false
      
      if (startTimeMinutes < endTimeMinutes) {
        // Horario normal (ej: 2:00 - 8:00)
        inMaintenance = currentTime >= startTimeMinutes && currentTime < endTimeMinutes
      } else {
        // Horario que cruza medianoche (ej: 22:00 - 6:00)
        inMaintenance = currentTime >= startTimeMinutes || currentTime < endTimeMinutes
      }

      setIsMaintenanceTime(inMaintenance)
    }

    // Verificar inmediatamente
    checkMaintenanceTime()

    // Verificar cada minuto
    const interval = setInterval(checkMaintenanceTime, 60000)

    return () => clearInterval(interval)
  }, [config.isActive, config.startTime, config.endTime])

  return {
    config,
    isMaintenanceTime,
    loading,
    showMaintenancePopup: config.isActive && isMaintenanceTime
  }
}
