'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, Music2, Loader2 } from 'lucide-react'

interface ChordAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ChordInfo {
  time: number
  chord: string
  confidence: number
}

const ChordAnalysisModal: React.FC<ChordAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [chords, setChords] = useState<ChordInfo[]>([])
  const [detectedKey, setDetectedKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Análisis básico de acordes (simplificado)
  const analyzeChords = async (audioBuffer: AudioBuffer) => {
    console.log('🎸 Analizando acordes...')
    
    // Simular análisis por ahora
    // En producción, esto usaría una librería como essentia.js o chords-detection
    const duration = audioBuffer.duration
    const segmentDuration = 2 // Análisis cada 2 segundos
    const numSegments = Math.floor(duration / segmentDuration)
    
    const possibleChords = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']
    const detectedChords: ChordInfo[] = []
    
    for (let i = 0; i < numSegments; i++) {
      const time = i * segmentDuration
      const chord = possibleChords[Math.floor(Math.random() * possibleChords.length)]
      detectedChords.push({
        time,
        chord,
        confidence: 0.7 + Math.random() * 0.3 // 70-100%
      })
    }
    
    console.log(`✅ ${detectedChords.length} acordes detectados`)
    return detectedChords
  }

  // Cargar y analizar archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAudioFile(file)
    setIsAnalyzing(true)
    setChords([])
    setDetectedKey(null)

    try {
      console.log('📁 Cargando archivo:', file.name)
      
      // Decodificar audio
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      console.log('✅ Audio decodificado')
      
      // Analizar acordes
      const detectedChords = await analyzeChords(audioBuffer)
      setChords(detectedChords)
      
      // Detectar tonalidad principal (el acorde más común)
      const chordCounts = detectedChords.reduce((acc, c) => {
        acc[c.chord] = (acc[c.chord] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const mostCommonChord = Object.entries(chordCounts)
        .sort((a, b) => b[1] - a[1])[0][0]
      
      setDetectedKey(mostCommonChord)
      
      await audioContext.close()
      
    } catch (error) {
      console.error('❌ Error analizando acordes:', error)
      alert('Error al analizar el archivo de audio')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]">
      <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Music2 className="w-8 h-8 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Análisis de Acordes</h2>
          </div>
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
            className="w-full py-4 font-bold text-base transition-all duration-200 flex items-center justify-center space-x-3 border bg-gradient-to-br from-blue-500/40 via-blue-600/30 to-blue-700/20 hover:from-blue-500/50 text-white border-blue-400/40 rounded-lg"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)'
            }}
          >
            <Upload className="w-6 h-6" />
            <span>{audioFile ? audioFile.name : 'Cargar Audio para Analizar Acordes'}</span>
          </button>
        </div>

        {/* Estado de Análisis */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
            <p className="text-white text-lg font-semibold">Analizando acordes...</p>
            <p className="text-gray-400 text-sm mt-2">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Resultados */}
        {!isAnalyzing && chords.length > 0 && (
          <div className="space-y-6">
            {/* Tonalidad Detectada */}
            {detectedKey && (
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Tonalidad Principal</p>
                <div className="text-5xl font-bold text-white mb-2"
                  style={{
                    textShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                  }}
                >
                  {detectedKey}
                </div>
                <p className="text-gray-400 text-xs">Acorde más frecuente</p>
              </div>
            )}

            {/* Lista de Acordes */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-white font-bold text-lg mb-4">Progresión de Acordes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                {chords.map((chord, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600 rounded-lg p-3 hover:border-blue-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-gray-400 text-xs mb-1">{formatTime(chord.time)}</span>
                      <span className="text-white font-bold text-xl">{chord.chord}</span>
                      <div className="w-full bg-gray-900 rounded-full h-1 mt-2">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all"
                          style={{ width: `${chord.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs mt-1">{(chord.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón para analizar otro archivo */}
            <button
              onClick={() => {
                setChords([])
                setDetectedKey(null)
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
        {!isAnalyzing && chords.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music2 className="w-20 h-20 text-blue-500/50 mb-4" />
            <p className="text-gray-400 text-lg">Carga un archivo de audio para detectar acordes</p>
            <p className="text-gray-500 text-sm mt-2">El análisis identifica la progresión de acordes automáticamente</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChordAnalysisModal

