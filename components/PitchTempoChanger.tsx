'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, Download } from 'lucide-react'

interface PitchTempoChangerProps {
  audioUrl: string
  songTitle: string
}

const PitchTempoChanger: React.FC<PitchTempoChangerProps> = ({ audioUrl, songTitle }) => {
  const [pitch, setPitch] = useState(0) // -12 a +12 semitonos
  const [tempo, setTempo] = useState(1.0) // 0.5 a 2.0
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup
      if (sourceRef.current) {
        sourceRef.current.stop()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const handlePlayPause = async () => {
    if (!audioUrl) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const audioContext = audioContextRef.current
      
      if (isPlaying) {
        // Pausar
        if (sourceRef.current) {
          sourceRef.current.stop()
          sourceRef.current = null
        }
        setIsPlaying(false)
        return
      }

      // Reproducir
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const source = audioContext.createBufferSource()
      const gainNode = audioContext.createGain()

      // Aplicar cambios de pitch y tempo
      source.buffer = audioBuffer
      source.playbackRate.value = tempo
      
      // Para el pitch, usamos detune (en cents, 100 cents = 1 semitono)
      source.detune.value = pitch * 100

      source.connect(gainNode)
      gainNode.connect(audioContext.destination)

      sourceRef.current = source
      gainNodeRef.current = gainNode

      source.onended = () => {
        setIsPlaying(false)
        sourceRef.current = null
      }

      source.start()
      setIsPlaying(true)

    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const handleReset = () => {
    setPitch(0)
    setTempo(1.0)
    if (isPlaying) {
      handlePlayPause()
    }
  }

  const handleDownload = async () => {
    if (!audioUrl) return

    setIsProcessing(true)
    try {
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Crear un nuevo buffer con los cambios aplicados
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length / tempo,
        audioBuffer.sampleRate
      )

      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer
      source.playbackRate.value = tempo
      source.detune.value = pitch * 100
      source.connect(offlineContext.destination)
      source.start()

      const processedBuffer = await offlineContext.startRendering()
      
      // Convertir a WAV
      const wavBlob = audioBufferToWav(processedBuffer)
      const url = URL.createObjectURL(wavBlob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${songTitle}_pitch${pitch}_tempo${tempo.toFixed(1)}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)

    // Audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Cambiador de Tono y Tempo</h3>
        <button
          onClick={handleReset}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          title="Resetear"
        >
          <RotateCcw className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Controles de Pitch */}
      <div className="space-y-3">
        <label className="block text-white font-medium">
          Tono (Pitch): {pitch > 0 ? '+' : ''}{pitch} semitonos
        </label>
        <input
          type="range"
          min="-12"
          max="12"
          value={pitch}
          onChange={(e) => setPitch(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>-12</span>
          <span>0</span>
          <span>+12</span>
        </div>
      </div>

      {/* Controles de Tempo */}
      <div className="space-y-3">
        <label className="block text-white font-medium">
          Velocidad: {tempo.toFixed(2)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          value={tempo}
          onChange={(e) => setTempo(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Controles de reproducción */}
      <div className="flex space-x-4">
        <button
          onClick={handlePlayPause}
          disabled={!audioUrl}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={!audioUrl || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{isProcessing ? 'Procesando...' : 'Descargar'}</span>
        </button>
      </div>

      {/* Información */}
      <div className="text-sm text-gray-400 space-y-1">
        <p>• Tono: Cambia la altura musical sin afectar la velocidad</p>
        <p>• Velocidad: Cambia el tempo sin afectar el tono</p>
        <p>• Los cambios se aplican en tiempo real durante la reproducción</p>
      </div>
    </div>
  )
}

export default PitchTempoChanger
