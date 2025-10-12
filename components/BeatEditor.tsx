'use client'
import React, { useState, useEffect } from 'react'

interface BeatEditorProps {
  currentBeatShift: number
  onBeatShiftChange: (beatShift: number) => void
  bpm: number
  isPlaying: boolean
  onPlayPause: () => void
  onStop: () => void
}

const BeatEditor: React.FC<BeatEditorProps> = ({
  currentBeatShift,
  onBeatShiftChange,
  bpm,
  isPlaying,
  onPlayPause,
  onStop
}) => {
  const [beatShift, setBeatShift] = useState(currentBeatShift)
  const [showCountIn, setShowCountIn] = useState(false)
  const [countInBeats, setCountInBeats] = useState(4)

  useEffect(() => {
    setBeatShift(currentBeatShift)
  }, [currentBeatShift])

  const handleBeatShiftChange = (newBeatShift: number) => {
    setBeatShift(newBeatShift)
    onBeatShiftChange(newBeatShift)
  }

  const adjustBeatShift = (delta: number) => {
    const newShift = beatShift + delta
    handleBeatShiftChange(newShift)
  }

  const getBeatShiftDescription = (shift: number) => {
    if (shift === 0) return 'Sincronizado'
    if (shift > 0) return `${shift} beat${shift > 1 ? 's' : ''} adelante`
    return `${Math.abs(shift)} beat${Math.abs(shift) > 1 ? 's' : ''} atrás`
  }

  const getBeatShiftTime = (shift: number) => {
    const beatDuration = 60 / bpm
    const timeShift = shift * beatDuration
    return timeShift.toFixed(2)
  }


  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <h3 className="text-white text-lg font-semibold mb-4">Editor de Beat</h3>
      
      {/* Beat Shift Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm">Desplazamiento del Click:</span>
          <span className="text-white font-mono text-lg">
            {beatShift === 0 ? '0' : beatShift > 0 ? `+${beatShift}` : beatShift}
          </span>
        </div>
        
        <div className="text-xs text-gray-400 mb-3">
          {getBeatShiftDescription(beatShift)} ({getBeatShiftTime(beatShift)}s)
        </div>
        
        {/* Beat Shift Indicator */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-gray-400 text-sm">Posición:</span>
          <div className="flex space-x-1">
            {[-2, -1, 0, 1, 2].map((shift) => (
              <div
                key={shift}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  beatShift === shift
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {shift === 0 ? '0' : shift > 0 ? `+${shift}` : shift}
              </div>
            ))}
          </div>
        </div>

        {/* Beat Shift Slider */}
        <div className="mb-4">
          <input
            type="range"
            min="-2"
            max="2"
            step="0.25"
            value={beatShift}
            onChange={(e) => handleBeatShiftChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>-2 beats</span>
            <span>0</span>
            <span>+2 beats</span>
          </div>
        </div>

        {/* Beat Shift Adjustment Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => adjustBeatShift(-1)}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-2 rounded text-sm font-semibold"
          >
            -1 beat
          </button>
          <button
            onClick={() => adjustBeatShift(-0.25)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-2 rounded text-sm font-semibold"
          >
            -¼ beat
          </button>
          <button
            onClick={() => adjustBeatShift(0.25)}
            className="bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded text-sm font-semibold"
          >
            +¼ beat
          </button>
          <button
            onClick={() => adjustBeatShift(1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded text-sm font-semibold"
          >
            +1 beat
          </button>
        </div>
      </div>

      {/* Count-In Settings */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm">Count-In (1-2-3-4):</span>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showCountIn}
              onChange={(e) => setShowCountIn(e.target.checked)}
              className="mr-2"
            />
            <span className="text-white text-sm">Activar</span>
          </label>
        </div>
        
        {showCountIn && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Beats:</span>
            <select
              value={countInBeats}
              onChange={(e) => setCountInBeats(parseInt(e.target.value))}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="flex space-x-2">
        <button
          onClick={onPlayPause}
          className={`flex-1 py-2 px-4 rounded font-semibold ${
            isPlaying
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isPlaying ? 'Pausar' : 'Reproducir'}
        </button>
        <button
          onClick={onStop}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-semibold"
        >
          Detener
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 text-xs text-gray-400">
        <p>• Mueve el click adelante o atrás para sincronizar con el acento</p>
        <p>• +1 beat = Click 1 beat adelante</p>
        <p>• -1 beat = Click 1 beat atrás</p>
        <p>• ¼ beat = Ajuste fino para sincronización perfecta</p>
      </div>
    </div>
  )
}

export default BeatEditor
