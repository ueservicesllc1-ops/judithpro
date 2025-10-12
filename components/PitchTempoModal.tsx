'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, RotateCcw, Music, Volume2, Target, Upload, Loader, Download, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { getBackendUrl } from '@/lib/config'

interface PitchTempoModalProps {
  isOpen: boolean
  onClose: () => void
}

const PitchTempoModal: React.FC<PitchTempoModalProps> = ({
  isOpen,
  onClose
}) => {
  // Estados para el archivo de audio
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // Estados para controles
  const [tempo, setTempo] = useState<number>(100)
  const [pitch, setPitch] = useState<number>(0)
  const [volume, setVolume] = useState<number>(100)
  const [detectedBpm, setDetectedBpm] = useState<number>(0)
  const [key, setKey] = useState<string>('-')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Referencias para Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)

  // Manejar selección de archivo
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor selecciona un archivo de audio válido')
      return
    }

    // Detener reproducción si está activa
    if (isPlaying) {
      pauseAudio()
    }

    // Resetear todos los controles
    setTempo(100)
    setPitch(0)
    setVolume(100)
    setCurrentTime(0)
    setDetectedBpm(0)
    setKey('-')

    setAudioFile(file)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)

    toast.success(`Archivo cargado: ${file.name}`)

    await loadAudioBuffer(file)
    await analyzeAudio(file)
  }

  // Cargar audio en AudioContext
  const loadAudioBuffer = async (file: File) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      audioBufferRef.current = audioBuffer
      setDuration(audioBuffer.duration)

      console.log('Audio buffer cargado:', audioBuffer.duration, 'segundos')
    } catch (error) {
      console.error('Error cargando audio buffer:', error)
      toast.error('Error al cargar el audio')
    }
  }

  // Analizar audio (BPM y Key)
  const analyzeAudio = async (file: File) => {
    setIsAnalyzing(true)
    try {
      const backendUrl = getBackendUrl();
      
      // Analizar BPM
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const bpmResponse = await fetch(`${backendUrl}/api/analyze-bpm`, {
          method: 'POST',
          body: formData
        })
        
        if (bpmResponse.ok) {
          const bpmData = await bpmResponse.json()
          
          if (bpmData.bpm) {
            setDetectedBpm(bpmData.bpm)
            toast.success(`BPM detectado: ${Math.round(bpmData.bpm)}`)
          }
        }
      } catch (error) {
        console.error('Error detectando BPM:', error)
      }

      // Analizar Key
      try {
        const keyFormData = new FormData()
        keyFormData.append('file', file)
        
        const keyResponse = await fetch(`${backendUrl}/api/analyze-key`, {
          method: 'POST',
          body: keyFormData
        })
        
        if (keyResponse.ok) {
          const keyData = await keyResponse.json()
          
          if (keyData.key) {
            setKey(keyData.key)
            toast.success(`Tonalidad detectada: ${keyData.key}`)
          }
        }
      } catch (error) {
        console.error('Error detectando tonalidad:', error)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Reproducir audio
  const playAudio = async () => {
    if (!audioContextRef.current || !audioBufferRef.current) {
      toast.error('No hay audio cargado')
      return
    }

    try {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop()
          sourceNodeRef.current.disconnect()
        } catch (e) {}
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBufferRef.current

      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContextRef.current.createGain()
        gainNodeRef.current.connect(audioContextRef.current.destination)
      }
      gainNodeRef.current.gain.value = volume / 100

      source.connect(gainNodeRef.current)
      sourceNodeRef.current = source

      // Calcular offset ajustado por tempo
      const tempoFactor = tempo / 100
      const adjustedOffset = currentTime * (100 / tempo)
      
      source.start(0, adjustedOffset)
      startTimeRef.current = audioContextRef.current.currentTime - currentTime
      setIsPlaying(true)

      // Actualizar duración basada en el buffer
      const newDuration = audioBufferRef.current.duration
      setDuration(newDuration)

      const updateTime = () => {
        if (audioContextRef.current && sourceNodeRef.current) {
          const elapsed = audioContextRef.current.currentTime - startTimeRef.current
          setCurrentTime(Math.min(elapsed, newDuration))

          if (elapsed < newDuration) {
            animationFrameRef.current = requestAnimationFrame(updateTime)
          } else {
            stopAudio()
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateTime)

      source.onended = () => {
        if (audioContextRef.current) {
          const elapsed = audioContextRef.current.currentTime - startTimeRef.current
          if (elapsed >= newDuration - 0.1) {
            stopAudio()
          }
        }
      }
    } catch (error) {
      console.error('Error al reproducir audio:', error)
      toast.error('Error al reproducir audio')
      toast.dismiss()
      setIsPlaying(false)
    }
  }

  // Pausar audio
  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
        sourceNodeRef.current.disconnect()
      } catch (e) {}
      sourceNodeRef.current = null
    }

    setIsPlaying(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  // Detener audio
  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
        sourceNodeRef.current.disconnect()
      } catch (e) {}
      sourceNodeRef.current = null
    }

    setIsPlaying(false)
    setCurrentTime(0)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      playAudio()
    }
  }

  const handleSeek = (time: number) => {
    const wasPlaying = isPlaying
    
    if (wasPlaying) {
      pauseAudio()
    }
    
    setCurrentTime(time)
    
    if (wasPlaying) {
      setTimeout(() => playAudio(), 50)
    }
  }

  // Aplicar cambios en tiempo real
  useEffect(() => {
    if (isPlaying) {
      const currentPos = currentTime
      pauseAudio()
      setCurrentTime(currentPos)
      setTimeout(() => playAudio(), 10)
    }
  }, [pitch, tempo])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100
    }
  }, [volume])

  const resetAll = () => {
    setTempo(100)
    setPitch(0)
    setVolume(100)
    toast.success('Valores restablecidos')
  }

  const exportProcessedAudio = async () => {
    if (!audioUrl) {
      toast.error('No hay audio para exportar')
      return
    }
    setShowExportModal(true)
  }

  const handleExport = async (format: 'mp3' | 'wav') => {
    if (!audioBufferRef.current || !audioContextRef.current) {
      toast.error('No hay audio procesado para exportar')
      return
    }

    setIsExporting(true)
    setShowExportModal(false)

    try {
      const offlineContext = new OfflineAudioContext(
        audioBufferRef.current.numberOfChannels,
        audioBufferRef.current.length,
        audioBufferRef.current.sampleRate
      )

      const source = offlineContext.createBufferSource()
      source.buffer = audioBufferRef.current

      const gainNode = offlineContext.createGain()
      gainNode.gain.value = volume / 100

      source.connect(gainNode)
      gainNode.connect(offlineContext.destination)

      source.start(0)
      const renderedBuffer = await offlineContext.startRendering()

      const wavBlob = audioBufferToWav(renderedBuffer)

      if (format === 'wav') {
        downloadBlob(wavBlob, `audio_processed_${Date.now()}.wav`)
        toast.success('Audio exportado como WAV exitosamente')
      } else {
        const formData = new FormData()
        formData.append('audio_file', wavBlob, 'temp.wav')

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/convert-to-mp3`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const mp3Blob = await response.blob()
          downloadBlob(mp3Blob, `audio_processed_${Date.now()}.mp3`)
          toast.success('Audio exportado como MP3 exitosamente')
        } else {
          throw new Error('Error al convertir a MP3')
        }
      }
    } catch (error) {
      console.error('Error exportando audio:', error)
      toast.error('Error al exportar el audio')
    } finally {
      setIsExporting(false)
    }
  }

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numberOfChannels = buffer.numberOfChannels
    const length = buffer.length * numberOfChannels * 2
    const arrayBuffer = new ArrayBuffer(44 + length)
    const view = new DataView(arrayBuffer)

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length, true)

    const channels = []
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    stopAudio()
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    
    setAudioFile(null)
    setAudioUrl('')
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-[90vw] h-[90vh] mx-4 flex flex-col border border-gray-600">
        {/* Header */}
        <div className="bg-black h-16 flex items-center justify-between px-6 border-b border-gray-600">
          <div className="flex items-center space-x-4">
            <Music className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Pitch & Tempo Control</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Sección superior dividida en dos */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Mitad izquierda - Tonalidad Detectada */}
              <div className="bg-gray-800 p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center">
                    <Music className="w-4 h-4 mr-2 text-white" />
                    Tonalidad Detectada
                  </h3>
                  {isAnalyzing && (
                    <Loader className="w-4 h-4 animate-spin text-white" />
                  )}
                </div>
                <div className="text-center p-3 bg-gray-700 border border-gray-600">
                  <div className="text-2xl font-bold text-white">
                    {key === '-' ? 'No detectada' : key}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    BPM: {detectedBpm > 0 ? detectedBpm.toFixed(0) : 'No detectado'}
                  </div>
                </div>
              </div>

              {/* Mitad derecha - Subir Canción */}
              <div className="bg-gray-800 p-4 border border-gray-600">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <h3 className="text-sm font-semibold text-white flex items-center mb-3">
                  <Upload className="w-4 h-4 mr-2 text-white" />
                  Subir Canción
                </h3>
                {!audioUrl ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white hover:bg-gray-200 text-black px-4 py-2 font-semibold transition-all duration-300 flex items-center justify-center space-x-2 border border-gray-600"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Archivo</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 bg-gray-700 border border-gray-600">
                      <Music className="w-4 h-4 text-white flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{audioFile?.name}</p>
                        <p className="text-gray-400 text-xs">
                          {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 text-sm transition-colors flex items-center justify-center space-x-1 border border-gray-600"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  </div>
                )}
                {!audioUrl && (
                  <p className="text-gray-400 text-xs text-center mt-2">
                    MP3, WAV, OGG, FLAC, M4A
                  </p>
                )}
              </div>
            </div>

            {/* Controles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Panel Izquierdo */}
              <div className="space-y-6">
                
                {/* Control de Tempo */}
                <div className="bg-gray-800 p-6 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Target className="w-5 h-5 mr-2 text-white" />
                      Tempo (Velocidad)
                    </h3>
                    <button
                      onClick={() => setTempo(100)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-white mb-2">
                      {tempo}%
                    </div>
                    <div className="text-sm text-gray-400">
                      {detectedBpm > 0 ? (
                        `BPM Original: ${detectedBpm.toFixed(0)} → ${(detectedBpm * tempo / 100).toFixed(0)}`
                      ) : (
                        'BPM: No detectado'
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="1"
                      value={tempo}
                      onChange={(e) => setTempo(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 appearance-none cursor-pointer accent-white"
                      disabled={!audioUrl}
                    />
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setTempo(Math.max(50, tempo - 5))}
                        disabled={!audioUrl}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 transition-colors disabled:opacity-50 border border-gray-600"
                      >
                        -5%
                      </button>
                      <button
                        onClick={() => setTempo(Math.min(200, tempo + 5))}
                        disabled={!audioUrl}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 transition-colors disabled:opacity-50 border border-gray-600"
                      >
                        +5%
                      </button>
                    </div>
                  </div>
                </div>

                {/* Control de Pitch */}
                <div className="bg-gray-800 p-6 border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Music className="w-5 h-5 mr-2 text-white" />
                      Pitch / Tono
                    </h3>
                    <button
                      onClick={() => setPitch(0)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Display principal con botones + y - a los costados */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={() => setPitch(Math.max(-12, pitch - 1))}
                        disabled={!audioUrl || pitch <= -12}
                        className="w-16 h-16 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white text-4xl font-bold border-2 border-gray-600 transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      
                      <div className="text-6xl font-bold text-white min-w-[120px]">
                        {pitch > 0 ? `+${pitch}` : pitch}
                      </div>
                      
                      <button
                        onClick={() => setPitch(Math.min(12, pitch + 1))}
                        disabled={!audioUrl || pitch >= 12}
                        className="w-16 h-16 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white text-4xl font-bold border-2 border-gray-600 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-400 mt-2">
                      {pitch === 0 ? 'Original' : pitch > 0 ? 'Más agudo' : 'Más grave'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={pitch}
                      onChange={(e) => setPitch(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 appearance-none cursor-pointer accent-white"
                      disabled={!audioUrl}
                    />
                    
                    <div className="flex gap-2">
                      {[-12, -6, 0, 6, 12].map(value => (
                        <button
                          key={value}
                          onClick={() => setPitch(value)}
                          disabled={!audioUrl}
                          className={`flex-1 py-2 px-3 text-sm transition-colors disabled:opacity-50 border border-gray-600 ${
                            pitch === value 
                              ? 'bg-white text-black' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          {value > 0 ? `+${value}` : value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Panel Derecho */}
              <div className="space-y-6">
                
                {/* Reproductor */}
                <div className="bg-gray-800 p-6 border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">Audio Preview</h3>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                      <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 appearance-none cursor-pointer accent-white"
                      disabled={!audioUrl}
                    />
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={togglePlayPause}
                      disabled={!audioUrl}
                      className="bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black p-4 transition-colors border border-gray-600"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    
                    <button
                      onClick={stopAudio}
                      disabled={!audioUrl || (!isPlaying && currentTime === 0)}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white p-4 transition-colors border border-gray-600"
                    >
                      <Square className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Visualización de Efectos */}
                <div className="bg-gray-800 p-6 border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">Efectos Aplicados en Tiempo Real</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Columna 1 - Efectos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600">
                        <span className="text-gray-300 text-sm">Tempo</span>
                        <span className="text-white font-mono text-sm">
                          {tempo}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600">
                        <span className="text-gray-300 text-sm">Pitch</span>
                        <span className="text-white font-mono text-sm">
                          {pitch === 0 ? '0' : `${pitch > 0 ? '+' : ''}${pitch}`} st
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600">
                        <span className="text-gray-300 text-sm">Tonalidad Original</span>
                        <span className="text-white font-mono text-sm">{key}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600">
                        <span className="text-gray-300 text-sm">Tonalidad Actual</span>
                        <span className="text-white font-mono text-sm">
                          {(() => {
                            if (key === '-' || pitch === 0) return key
                            
                            const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                            const keyParts = key.split(' ')
                            const baseNote = keyParts[0]
                            const mode = keyParts[1]
                            
                            const currentIndex = notes.indexOf(baseNote)
                            if (currentIndex === -1) return key
                            
                            let newIndex = (currentIndex + pitch) % 12
                            if (newIndex < 0) newIndex += 12
                            
                            return `${notes[newIndex]} ${mode}`
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Columna 2 - Volumen y Botones */}
                    <div className="space-y-4">
                      {/* Control de Volumen Horizontal */}
                      <div className="bg-black p-4 border-2 border-black">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Volume2 className="w-5 h-5 text-white" />
                            <span className="text-white font-semibold">Volumen</span>
                          </div>
                          <span className="text-white font-bold text-lg">{volume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 appearance-none cursor-pointer accent-white"
                          disabled={!audioUrl}
                        />
                      </div>

                      {/* Botones de Acción */}
                      <div className="space-y-3">
                        <button
                          onClick={resetAll}
                          className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 transition-colors flex items-center justify-center space-x-2 border border-gray-600"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="text-sm">Resetear Todo</span>
                        </button>

                        <button
                          onClick={exportProcessedAudio}
                          disabled={!audioUrl}
                          className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black py-3 transition-colors flex items-center justify-center space-x-2 border border-gray-600"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Exportar Audio</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de selección de formato */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 p-6 border border-gray-600 w-96">
            <h3 className="text-xl font-bold text-white mb-4">Seleccionar Formato de Exportación</h3>
            <p className="text-gray-300 mb-6">Elige el formato en el que deseas exportar el audio procesado:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExport('mp3')}
                disabled={isExporting}
                className="w-full bg-white hover:bg-gray-200 text-black py-3 transition-colors flex items-center justify-center space-x-2 border border-gray-600"
              >
                <Download className="w-5 h-5" />
                <span>Exportar como MP3</span>
              </button>

              <button
                onClick={() => handleExport('wav')}
                disabled={isExporting}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 transition-colors flex items-center justify-center space-x-2 border border-gray-600"
              >
                <Download className="w-5 h-5" />
                <span>Exportar como WAV</span>
              </button>

              <button
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 transition-colors border border-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de exportación */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 p-8 border border-gray-600">
            <div className="flex flex-col items-center space-y-4">
              <Loader className="w-12 h-12 animate-spin text-white" />
              <p className="text-white text-lg">Exportando audio...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PitchTempoModal