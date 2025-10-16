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
    const hostname = window.location.hostname
    
    // Si estamos en judith.life, usar HTTPS
    if (hostname === 'judith.life' || hostname === 'www.judith.life') {
      return 'https://judith.life:8000'
    }
    
    // Si estamos en otras producciones (railway.app, run.app, o IP)
    if (currentDomain.includes('railway.app') || 
        currentDomain.includes('run.app') ||
        /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      // Si es IP o dominio de producción, usar el mismo host pero puerto 8000
      const protocol = window.location.protocol
      return `${protocol}//${hostname}:8000`
    }
  }
  
  // Desarrollo local
  return 'http://localhost:8000'
}

export const BACKEND_URL = getBackendUrl()

