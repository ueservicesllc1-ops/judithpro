/**
 * Configuración de URLs del backend
 */

export const getBackendUrl = (): string => {
  // Si está definida la variable de entorno, usarla
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Detección automática basada en el dominio actual (solo en cliente)
  if (typeof window !== 'undefined') {
    const currentDomain = window.location.origin
    
    // Si estamos en producción (judith.life, railway.app, o run.app)
    if (currentDomain.includes('judith.life') || currentDomain.includes('railway.app') || currentDomain.includes('run.app')) {
      // Usar la misma URL del frontend como backend (están en el mismo servidor)
      return currentDomain
    }
  }
  
  // Desarrollo local
  return 'http://localhost:8000'
}

export const BACKEND_URL = getBackendUrl()

