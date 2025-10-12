'use client'
import React from 'react'

interface BpmDisplayProps {
  songId?: string
  originalUrl?: string
  headerBpm?: number
  headerKey?: string
}

const BpmDisplay: React.FC<BpmDisplayProps> = ({ 
  headerBpm,
  headerKey
}) => {

  return (
    <div className="flex items-center space-x-4">
      {/* BPM Display */}
      <div className="flex items-center space-x-2">
        <span className="text-white text-xs font-mono">BPM:</span>
        <div className="bg-black p-1 shadow-lg">
          {headerBpm ? (
            <div className="bg-gray-800 text-gray-200 font-mono text-base font-bold tracking-wider px-3 py-1">
              {headerBpm % 1 === 0 ? headerBpm.toFixed(0) : headerBpm.toFixed(1)}
            </div>
          ) : (
            <div className="bg-gray-900 text-gray-500 font-mono text-base font-bold tracking-wider px-3 py-1">
              -
            </div>
          )}
        </div>
      </div>
      
      {/* Key Display */}
      <div className="flex items-center space-x-2">
        <span className="text-white text-xs font-mono">KEY:</span>
        <div className="bg-black p-1 shadow-lg">
          {headerKey ? (
            <div className="bg-gray-700 text-gray-100 font-mono text-base font-bold tracking-wider px-3 py-1">
              {headerKey}
            </div>
          ) : (
            <div className="bg-gray-900 text-gray-500 font-mono text-base font-bold tracking-wider px-3 py-1">
              -
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BpmDisplay
