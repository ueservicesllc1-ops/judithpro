'use client'

import { useEffect, useRef, useState } from 'react'
import DJKnob from './DJKnob'

interface EQBand {
  frequency: number
  gain: number
  q: number
  type: BiquadFilterType
  name: string
}

interface ProfessionalEQProps {
  audioBuffer: AudioBuffer
  masterVolume: number
  isMuted: boolean
  isPlaying: boolean
  shouldStop: boolean
  onPlayStateChange: (playing: boolean) => void
  onStopComplete: () => void
  onBandsChange?: (bands: EQBand[]) => void // Callback para compartir los datos de las bandas
}

export type { EQBand }

export default function ProfessionalEQ({ 
  audioBuffer,
  masterVolume,
  isMuted,
  isPlaying,
  shouldStop,
  onPlayStateChange,
  onStopComplete,
  onBandsChange
}: ProfessionalEQProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const filtersRef = useRef<BiquadFilterNode[]>([])
  const sourceStartedRef = useRef(false) // Para trackear si el source ya fue iniciado

  // Valores por defecto de las bandas
  const defaultBands: EQBand[] = [
    { frequency: 32, gain: 0, q: 1.0, type: 'lowshelf', name: 'Sub Bass' },
    { frequency: 64, gain: 0, q: 1.0, type: 'peaking', name: 'Bass' },
    { frequency: 125, gain: 0, q: 1.0, type: 'peaking', name: 'Low Mid' },
    { frequency: 250, gain: 0, q: 1.0, type: 'peaking', name: 'Mid' },
    { frequency: 500, gain: 0, q: 1.0, type: 'peaking', name: 'High Mid' },
    { frequency: 1000, gain: 0, q: 1.0, type: 'peaking', name: 'Presence' },
    { frequency: 2000, gain: 0, q: 1.0, type: 'peaking', name: 'Brilliance' },
    { frequency: 8000, gain: 0, q: 1.0, type: 'highshelf', name: 'Air' },
  ]

  // 8 bandas de EQ paramétrico
  const [bands, setBands] = useState<EQBand[]>(defaultBands)

  // Compartir los datos de las bandas con el componente padre
  useEffect(() => {
    if (onBandsChange) {
      onBandsChange(bands)
    }
  }, [bands, onBandsChange])

  // Inicializar audio
  useEffect(() => {
    console.log('🎛️ Inicializando EQ Paramétrico...')

    const audioContext = new AudioContext()
    audioContextRef.current = audioContext

    // Crear source
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.loop = false
    sourceNodeRef.current = source
    sourceStartedRef.current = false // El source NO ha sido iniciado aún

    // Crear gain node
    const gainNode = audioContext.createGain()
    gainNode.gain.value = isMuted ? 0 : masterVolume
    gainNodeRef.current = gainNode

    // Crear filtros para cada banda
    const filters: BiquadFilterNode[] = []
    bands.forEach((band, index) => {
      const filter = audioContext.createBiquadFilter()
      filter.type = band.type
      filter.frequency.value = band.frequency
      filter.gain.value = band.gain
      filter.Q.value = band.q
      filters.push(filter)
      console.log(`   Band ${index + 1}: ${band.name} - Type: ${band.type}, Freq: ${band.frequency}Hz, Gain: ${band.gain}dB, Q: ${band.q}`)
    })
    filtersRef.current = filters
    
    console.log(`   Total filters creados: ${filters.length}`)
    console.log(`   Todos los gains en 0? ${bands.every(b => b.gain === 0)}`)

    // Conectar cadena: source → filters → gain → destination
    let currentNode: AudioNode = source
    
    // SIEMPRE conectar todos los filtros
    filters.forEach((filter, idx) => {
      currentNode.connect(filter)
      currentNode = filter
      console.log(`   Conectado: ${bands[idx].name}`)
    })
    currentNode.connect(gainNode)
    gainNode.connect(audioContext.destination)

    console.log('✅ EQ Paramétrico inicializado - Cadena completa conectada')
    console.log(`   Source → ${filters.length} Filters → Gain → Destination`)

    // Handler cuando termina el audio
    source.onended = () => {
      console.log('🔚 Audio terminado')
      sourceStartedRef.current = false
      onPlayStateChange(false)
    }

    // Cleanup
    return () => {
      console.log('🧹 Limpiando EQ Paramétrico...')
      try {
        if (sourceNodeRef.current) {
          sourceNodeRef.current.stop()
          sourceNodeRef.current.disconnect()
        }
        filters.forEach(filter => filter.disconnect())
        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect()
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
      } catch (e) {
        console.warn('Error en cleanup:', e)
      }
      sourceStartedRef.current = false
    }
  }, [audioBuffer])

  // Actualizar volumen en tiempo real
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : masterVolume
    }
  }, [masterVolume, isMuted])

  // Manejar stop (recrear todo desde cero)
  useEffect(() => {
    if (!shouldStop) return
    
    console.log('⏹️ STOP SOLICITADO')

    if (!audioContextRef.current || !sourceNodeRef.current) {
      console.log('   ⚠️ No hay audioContext o source para detener')
      onStopComplete()
      return
    }

    console.log('   Deteniendo audio...')

    // 1. PRIMERO: Silenciar inmediatamente
    if (gainNodeRef.current && audioContextRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime)
        console.log('   ✓ Gain a 0 - Silenciado inmediatamente')
      } catch (e) {
        console.warn('   ⚠️ Error silenciando:', e)
      }
    }

    // 2. Detener el source
    if (sourceNodeRef.current && sourceStartedRef.current) {
      try {
        sourceNodeRef.current.stop()
        sourceStartedRef.current = false
        console.log('   ✓ Source detenido con stop()')
      } catch (e) {
        console.warn('   ⚠️ Error deteniendo source:', e)
      }
    }

    // 3. Suspender el AudioContext
    if (audioContextRef.current.state !== 'suspended') {
      audioContextRef.current.suspend()
      console.log('   ✓ AudioContext suspendido')
    }

    // 4. Desconectar el source viejo
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect()
        console.log('   ✓ Source desconectado')
      }
    } catch (e) {
      console.warn('   ⚠️ Error desconectando:', e)
    }

    // 5. Crear nuevo source desde cero
    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.loop = false
    sourceNodeRef.current = source
    sourceStartedRef.current = false
    console.log('   ✓ Nuevo source creado (NO iniciado)')

    // 6. Reconectar toda la cadena de audio
    let currentNode: AudioNode = source
    filtersRef.current.forEach((filter) => {
      currentNode.connect(filter)
      currentNode = filter
    })
    if (gainNodeRef.current) {
      currentNode.connect(gainNodeRef.current)
      // Restaurar gain al valor master
      gainNodeRef.current.gain.value = isMuted ? 0 : masterVolume
      console.log(`   ✓ Gain restaurado a ${isMuted ? 0 : masterVolume}`)
    }
    console.log('   ✓ Cadena reconectada')

    // 7. Handler cuando termina el audio
    source.onended = () => {
      console.log('🔚 Audio terminado naturalmente')
      sourceStartedRef.current = false
      onPlayStateChange(false)
    }

    console.log('✅ STOP COMPLETO - Listo para Play desde inicio')
    onStopComplete()
  }, [shouldStop])

  // Manejar play/pause
  useEffect(() => {
    if (!audioContextRef.current || !sourceNodeRef.current) {
      console.log('❌ No hay audioContext o source')
      return
    }

    console.log(`🎵 isPlaying cambió a: ${isPlaying}`)
    console.log(`   - sourceStarted: ${sourceStartedRef.current}`)
    console.log(`   - contextState: ${audioContextRef.current.state}`)
    console.log(`   - Stack trace:`, new Error().stack)

    if (isPlaying) {
      // Si el source ya está iniciado y el context está running, no hacer nada (ya está sonando)
      if (sourceStartedRef.current && audioContextRef.current.state === 'running') {
        console.log('⚠️ Ya está reproduciéndose, ignorando...')
        return
      }

      // SIEMPRE resumir el AudioContext primero si está suspendido
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('✅ AudioContext resumido')
        })
      }

      // Si el source nunca ha sido iniciado, iniciarlo
      if (!sourceStartedRef.current) {
        try {
          sourceNodeRef.current.start()
          sourceStartedRef.current = true
          console.log('▶️ Reproducción INICIADA por primera vez')
        } catch (e) {
          console.error('❌ Error al iniciar source:', e)
        }
      } else {
        console.log('▶️ Reproducción CONTINUADA (source ya estaba iniciado)')
      }
    } else {
      // Pausar (suspend) solo si está running
      console.log('⏸️ PAUSA SOLICITADA')
      if (audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend()
        console.log('⏸️ Reproducción PAUSADA - AudioContext suspendido')
      } else {
        console.log('⏸️ AudioContext ya estaba suspendido/closed')
      }
    }
  }, [isPlaying])

  // Actualizar valores de banda en tiempo real
  const updateBand = (index: number, field: 'gain' | 'frequency' | 'q', value: number) => {
    const newBands = [...bands]
    newBands[index][field] = value
    setBands(newBands)

    // Actualizar filtro
    const filter = filtersRef.current[index]
    if (filter) {
      if (field === 'gain') {
        filter.gain.value = value
      } else if (field === 'frequency') {
        filter.frequency.value = value
      } else if (field === 'q') {
        filter.Q.value = value
      }
    }
  }

  // Reset de una banda (vuelve a valores por defecto)
  const resetBand = (index: number) => {
    const defaultBand = defaultBands[index]
    const newBands = [...bands]
    newBands[index] = { ...defaultBand }
    setBands(newBands)

    // Actualizar filtros
    const filter = filtersRef.current[index]
    if (filter) {
      filter.frequency.value = defaultBand.frequency
      filter.gain.value = defaultBand.gain
      filter.Q.value = defaultBand.q
    }
    console.log(`🔄 Banda ${index + 1} reseteada: ${defaultBand.name}`)
  }

  // Reset todas las bandas (vuelve a valores por defecto)
  const resetAll = () => {
    const newBands = [...defaultBands]
    setBands(newBands)

    // Actualizar todos los filtros
    filtersRef.current.forEach((filter, index) => {
      const defaultBand = defaultBands[index]
      filter.frequency.value = defaultBand.frequency
      filter.gain.value = defaultBand.gain
      filter.Q.value = defaultBand.q
    })
    console.log('🔄 Todas las bandas reseteadas a valores por defecto')
  }

  // Normalizar valores para las perillas (0-1)
  // DJKnob: 0 = abajo izquierda (-135°), 1 = abajo derecha (+135°)
  // Para gain: -24dB abajo izquierda, +24dB abajo derecha
  const normalizeGain = (gain: number) => (gain + 24) / 48 // -24 a +24 → 0 a 1
  const denormalizeGain = (value: number) => value * 48 - 24 // 0 a 1 → -24 a +24
  
  // Para frecuencia: 20Hz abajo izquierda, 20kHz abajo derecha
  const normalizeFreq = (freq: number) => Math.log(freq / 20) / Math.log(20000 / 20) // 20-20000 logarítmico → 0-1
  const denormalizeFreq = (value: number) => 20 * Math.pow(20000 / 20, value) // 0-1 → 20-20000 logarítmico
  
  // Para Q: 0.1 debe estar abajo (0) y 10 arriba (1)
  const normalizeQ = (q: number) => (q - 0.1) / 9.9 // 0.1 a 10 → 0 a 1
  const denormalizeQ = (value: number) => value * 9.9 + 0.1 // 0 a 1 → 0.1 a 10

  return (
    <div className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2">
      {/* Header */}
      <div className="mb-1">
        <h4 className="text-white font-bold text-sm">8-Band Parametric EQ</h4>
        <p className="text-gray-400 text-[9px]">Ajusta en tiempo real</p>
      </div>

      {/* EQ Bands - Horizontal Layout */}
      <div className="flex gap-1 justify-between">
        {bands.map((band, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center bg-gradient-to-b from-gray-800/80 to-gray-900/80 border-2 border-gray-700 rounded-lg p-1 min-w-[70px] hover:border-blue-500/30 transition-all"
            style={{
              boxShadow: band.gain !== 0 
                ? `0 0 15px ${band.gain > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                : 'none'
            }}
          >
            {/* Band Name */}
            <div className="text-white font-bold text-[9px] tracking-tight mb-0.5 text-center">
              {band.name}
            </div>

            {/* Gain Knob - Principal */}
            <div className="flex flex-col items-center mb-1">
              <DJKnob
                value={normalizeGain(band.gain)}
                onChange={(value) => updateBand(index, 'gain', denormalizeGain(value))}
                size={40}
                label="GAIN"
                invertLED={true}
              />
              <span className={`text-[9px] font-bold ${
                band.gain > 0 ? 'text-green-400' : band.gain < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
              </span>
            </div>

            {/* Frequency Knob */}
            <div className="flex flex-col items-center mb-0.5">
              <DJKnob
                value={normalizeFreq(band.frequency)}
                onChange={(value) => updateBand(index, 'frequency', denormalizeFreq(value))}
                size={32}
                label="FREQ"
                disabled={band.type === 'lowshelf' || band.type === 'highshelf'}
                invertLED={true}
              />
              <span className="text-[8px] font-mono text-blue-400">
                {band.frequency < 1000 
                  ? `${band.frequency.toFixed(0)}`
                  : `${(band.frequency / 1000).toFixed(1)}k`
                }
              </span>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => resetBand(index)}
              className="text-gray-400 hover:text-white transition-colors px-1 py-0.5 bg-gray-700/50 hover:bg-gray-600/50 rounded text-[9px] font-semibold"
            >
              RESET
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

