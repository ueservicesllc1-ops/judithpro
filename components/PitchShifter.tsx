'use client'

import React, { useState } from 'react'

interface PitchShifterProps {
  audioElements: { [key: string]: HTMLAudioElement }
  stems?: { [key: string]: string | undefined }
  onPitchChange?: (semitones: number) => void
  onProcessedAudio?: (trackKey: any, audioUrl: any) => void
}

const PitchShifter: React.FC<PitchShifterProps> = ({
  audioElements,
  stems,
  onPitchChange,
  onProcessedAudio
}) => {
  const [semitones, setSemitones] = useState(0)

  // Aplicar pitch shift en tiempo real
  const applySemitones = (newSemitones: number) => {
    setSemitones(newSemitones)
    
    // Aplicar a todos los audioElements
    Object.values(audioElements).forEach(audio => {
      // Usar playbackRate para cambiar pitch
      // Cada semitono = 2^(1/12) ≈ 1.059463
      const pitchRatio = Math.pow(2, newSemitones / 12)
      audio.playbackRate = pitchRatio
    })
    
    console.log(`🎵 Pitch: ${newSemitones > 0 ? '+' : ''}${newSemitones} ST`)
    
    if (onPitchChange) {
      onPitchChange(newSemitones)
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center px-4">
      <div className="flex gap-12 items-center">
        {/* Botón Reset */}
        <button
          onClick={() => applySemitones(0)}
          className="px-4 py-2 rounded font-bold text-xs transition-all duration-300 bg-gray-700 border border-gray-500 text-gray-300 hover:bg-gray-600"
          style={{
            border: '1px solid',
            boxShadow: '0 0 4px rgba(107, 114, 128, 0.3)'
          }}
        >
          RESET
        </button>

        {/* Control Central de Semitonos */}
        <div className="flex items-center gap-8">
          {/* Botón - */}
          <button
            onClick={() => applySemitones(Math.max(-12, semitones - 1))}
            className="w-20 h-20 rounded-full font-bold text-4xl transition-all duration-300 bg-gray-700 border-2 border-red-500 text-red-400 hover:bg-red-900"
            style={{
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(239, 68, 68, 0.2)'
            }}
          >
            −
          </button>

          {/* Display de Semitonos */}
          <div className="text-center">
            <div 
              className="text-9xl font-bold text-green-400 font-mono"
              style={{
                textShadow: '0 0 30px rgba(34, 197, 94, 0.8), 0 0 15px rgba(34, 197, 94, 0.5)'
              }}
            >
              {semitones > 0 ? '+' : ''}{semitones}
            </div>
            <div className="text-green-300 text-lg font-mono mt-3">
              SEMITONOS
            </div>
          </div>
          
          {/* Botón + */}
          <button
            onClick={() => applySemitones(Math.min(12, semitones + 1))}
            className="w-20 h-20 rounded-full font-bold text-4xl transition-all duration-300 bg-gray-700 border-2 border-green-500 text-green-400 hover:bg-green-900"
            style={{
              boxShadow: '0 0 15px rgba(34, 197, 94, 0.5), inset 0 0 10px rgba(34, 197, 94, 0.2)'
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

export default PitchShifter