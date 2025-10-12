'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, Music } from 'lucide-react'

interface BpmDetectorModalProps {
  isOpen: boolean
  onClose: () => void
}

const BpmDetectorModal: React.FC<BpmDetectorModalProps> = ({ isOpen, onClose }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null)
  const [detectedKey, setDetectedKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detectar BPM usando análisis de picos en el audio
  const detectBPM = async (audioBuffer: AudioBuffer): Promise<number> => {
    console.log('🎵 Analizando BPM...')
    
    // Obtener datos del canal (mono o promedio de stereo)
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    
    // Calcular energía por ventanas
    const windowSize = Math.floor(sampleRate * 0.05) // Ventanas de 50ms
    const energies: number[] = []
    
    for (let i = 0; i < channelData.length; i += windowSize) {
      let energy = 0
      for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
        energy += Math.abs(channelData[i + j])
      }
      energies.push(energy / windowSize)
    }
    
    // Detectar picos
    const threshold = energies.reduce((a, b) => a + b, 0) / energies.length * 1.5
    const peaks: number[] = []
    
    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && 
          energies[i] > energies[i - 1] && 
          energies[i] > energies[i + 1]) {
        peaks.push(i)
      }
    }
    
    // Calcular intervalos entre picos
    const intervals: number[] = []
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1])
    }
    
    if (intervals.length === 0) {
      throw new Error('No se pudieron detectar picos en el audio')
    }
    
    // Calcular intervalo promedio
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    
    // Convertir a BPM
    const timePerWindow = windowSize / sampleRate
    const bpm = 60 / (avgInterval * timePerWindow)
    
    console.log(`✅ BPM detectado: ${bpm.toFixed(1)}`)
    
    // Ajustar si está fuera de rango típico (60-180 BPM)
    let finalBpm = bpm
    while (finalBpm < 60) finalBpm *= 2
    while (finalBpm > 180) finalBpm /= 2
    
    return Math.round(finalBpm * 10) / 10 // Redondear a 1 decimal
  }

  // Cargar y analizar archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAudioFile(file)
    setIsAnalyzing(true)
    setDetectedBpm(null)
    setDetectedKey(null)

    try {
      console.log('📁 Cargando archivo:', file.name)
      
      // Decodificar audio
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      console.log('✅ Audio decodificado')
      console.log('   Duration:', audioBuffer.duration.toFixed(2), 's')
      console.log('   Sample Rate:', audioBuffer.sampleRate, 'Hz')
      console.log('   Channels:', audioBuffer.numberOfChannels)
      
      // Detectar BPM
      const bpm = await detectBPM(audioBuffer)
      setDetectedBpm(bpm)
      
      // TODO: Detectar key/tonalidad (por ahora dejamos null)
      // Esto requeriría una librería más compleja como music-tempo o essentia.js
      
      await audioContext.close()
      
    } catch (error) {
      console.error('❌ Error analizando audio:', error)
      alert('Error al analizar el archivo de audio')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]">
      <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Detector de BPM</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Botón de Cargar Audio */}
        <div className="mb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="w-full py-4 font-bold text-base transition-all duration-200 flex items-center justify-center space-x-3 border bg-gradient-to-br from-purple-500/40 via-purple-600/30 to-purple-700/20 hover:from-purple-500/50 text-white border-purple-400/40 rounded-lg"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 8px 20px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)'
            }}
          >
            <Upload className="w-6 h-6" />
            <span>{audioFile ? audioFile.name : 'Cargar Audio para Analizar'}</span>
          </button>
        </div>

        {/* Estado de Análisis */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mb-4"></div>
            <p className="text-white text-lg font-semibold">Analizando audio...</p>
            <p className="text-gray-400 text-sm mt-2">Detectando tempo y tonalidad</p>
          </div>
        )}

        {/* Resultado del BPM */}
        {!isAnalyzing && detectedBpm !== null && (
          <div className="space-y-6">
            {/* Display de BPM - Estilo profesional */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-gray-800/80 to-gray-900/80 border-2 border-purple-500/50 rounded-2xl p-8 shadow-2xl"
              style={{
                boxShadow: '0 0 40px rgba(168, 85, 247, 0.4), inset 0 2px 20px rgba(168, 85, 247, 0.1)'
              }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <Music className="w-8 h-8 text-purple-400" />
                <h3 className="text-white font-bold text-2xl">BPM Detectado</h3>
              </div>
              
              <div className="relative">
                {/* BPM Display LED Style */}
                <div 
                  className="relative px-12 py-6"
                  style={{
                    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
                    boxShadow: `
                      inset 0 4px 8px rgba(0,0,0,0.8),
                      inset 0 -2px 4px rgba(255,255,255,0.05),
                      0 4px 16px rgba(0,0,0,0.6)
                    `
                  }}
                >
                  <div 
                    className="relative px-8 py-4"
                    style={{
                      background: 'linear-gradient(180deg, #001a00 0%, #003300 50%, #001a00 100%)',
                      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)',
                      border: '2px solid #002200'
                    }}
                  >
                    <div 
                      className="text-6xl font-bold text-center tabular-nums"
                      style={{
                        color: '#00ff00',
                        textShadow: '0 0 20px rgba(0,255,0,0.8), 0 0 10px rgba(0,255,0,0.5)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.1em'
                      }}
                    >
                      {detectedBpm.toFixed(1)}
                    </div>
                  </div>
                </div>
                
                {/* Label BPM */}
                <div className="text-center mt-4">
                  <span className="text-gray-400 text-sm uppercase tracking-widest">Beats Por Minuto</span>
                </div>
              </div>

              {/* Indicador Visual - Pulsing */}
              <div className="mt-6 flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full bg-green-500 animate-pulse"
                  style={{
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.8)',
                    animationDuration: `${60 / detectedBpm}s`
                  }}
                />
                <span className="text-green-400 text-sm font-semibold">Tempo Detectado</span>
              </div>
            </div>

            {/* Info del archivo */}
            {audioFile && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Información del Archivo</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Archivo:</span>
                    <p className="text-white font-mono truncate">{audioFile.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Tamaño:</span>
                    <p className="text-white font-mono">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón para analizar otro archivo */}
            <button
              onClick={() => {
                setDetectedBpm(null)
                setAudioFile(null)
                fileInputRef.current?.click()
              }}
              className="w-full py-3 font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 border bg-gradient-to-br from-gray-700/40 via-gray-800/30 to-gray-900/20 hover:from-gray-700/50 text-white border-gray-600/40 rounded-lg"
            >
              <Upload className="w-5 h-5" />
              <span>Analizar Otro Archivo</span>
            </button>
          </div>
        )}

        {/* Mensaje inicial */}
        {!isAnalyzing && detectedBpm === null && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music className="w-20 h-20 text-purple-500/50 mb-4" />
            <p className="text-gray-400 text-lg">Carga un archivo de audio para detectar su BPM</p>
            <p className="text-gray-500 text-sm mt-2">El análisis toma solo unos segundos</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BpmDetectorModal

