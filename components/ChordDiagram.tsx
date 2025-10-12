/**
 * ChordDiagram - Componente para mostrar diagramas de guitarra de acordes
 */

import React from 'react';

interface ChordDiagramProps {
  chord: string;
  size?: 'small' | 'medium' | 'large';
}

interface Finger {
  string: number;
  fret: number;
}

interface ChordDiagramData {
  fingers: Finger[];
  openStrings: number[];
  mutedStrings: number[];
}

const ChordDiagram: React.FC<ChordDiagramProps> = ({ chord, size = 'medium' }) => {
  // Diagramas básicos de acordes de guitarra
  const chordDiagrams: Record<string, ChordDiagramData> = {
    'C': {
      fingers: [
        { string: 5, fret: 3 },
        { string: 4, fret: 2 },
        { string: 2, fret: 1 }
      ],
      openStrings: [6, 3, 1],
      mutedStrings: []
    },
    'D': {
      fingers: [
        { string: 3, fret: 2 },
        { string: 1, fret: 2 },
        { string: 2, fret: 3 }
      ],
      openStrings: [4],
      mutedStrings: [6, 5]
    },
    'Em': {
      fingers: [
        { string: 5, fret: 2 },
        { string: 4, fret: 2 }
      ],
      openStrings: [6, 3, 2, 1],
      mutedStrings: []
    },
    'F': {
      fingers: [
        { string: 6, fret: 1 },
        { string: 5, fret: 3 },
        { string: 4, fret: 3 },
        { string: 3, fret: 2 }
      ],
      openStrings: [],
      mutedStrings: []
    },
    'G': {
      fingers: [
        { string: 6, fret: 3 },
        { string: 5, fret: 2 },
        { string: 1, fret: 3 }
      ],
      openStrings: [4, 3, 2],
      mutedStrings: []
    },
    'Am': {
      fingers: [
        { string: 4, fret: 2 },
        { string: 3, fret: 2 },
        { string: 2, fret: 1 }
      ],
      openStrings: [5, 1],
      mutedStrings: [6]
    },
    'Dm': {
      fingers: [
        { string: 5, fret: 1 },
        { string: 4, fret: 2 },
        { string: 2, fret: 1 }
      ],
      openStrings: [3, 1],
      mutedStrings: [6]
    },
    'A': {
      fingers: [
        { string: 4, fret: 2 },
        { string: 3, fret: 2 },
        { string: 2, fret: 2 }
      ],
      openStrings: [5, 1],
      mutedStrings: [6]
    },
    'E': {
      fingers: [
        { string: 5, fret: 2 },
        { string: 4, fret: 2 },
        { string: 3, fret: 1 }
      ],
      openStrings: [6, 2, 1],
      mutedStrings: []
    }
  };

  const diagram = chordDiagrams[chord];
  if (!diagram) {
    return (
      <div className={`flex items-center justify-center ${size === 'large' ? 'w-32 h-40' : size === 'medium' ? 'w-24 h-32' : 'w-16 h-20'}`}>
        <span className="text-gray-400 text-xs">N/A</span>
      </div>
    );
  }

  const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
  const frets = [0, 1, 2, 3, 4];
  
  const sizeClasses = {
    small: { width: 'w-16', height: 'h-20', text: 'text-xs', dot: 'w-2 h-2', line: 'w-12' },
    medium: { width: 'w-24', height: 'h-32', text: 'text-sm', dot: 'w-3 h-3', line: 'w-20' },
    large: { width: 'w-32', height: 'h-40', text: 'text-base', dot: 'w-4 h-4', line: 'w-28' }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`${classes.width} ${classes.height} flex flex-col items-center`}>
      {/* Título del acorde */}
      <div className={`${classes.text} font-bold text-white mb-2`}>
        {chord}
      </div>
      
      {/* Diagrama */}
      <div className="relative">
        {/* Cuerdas (verticales) */}
        <div className="space-y-2">
          {strings.map((string, index) => {
            const stringNum = index + 1;
            const isMuted = diagram.mutedStrings.includes(stringNum);
            const isOpen = diagram.openStrings.includes(stringNum);
            
            return (
              <div key={index} className="flex items-center space-x-2">
                {/* Nombre de la cuerda */}
                <span className={`${classes.text} text-gray-300 w-3`}>
                  {string}
                </span>
                
                {/* Cuerda */}
                <div className="relative">
                  {isMuted ? (
                    <div className={`${classes.line} h-px bg-red-500 relative`}>
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-red-500"></div>
                    </div>
                  ) : (
                    <div className={`${classes.line} h-px bg-gray-400`}></div>
                  )}
                  
                  {/* Trastes (horizontales) */}
                  {frets.map(fret => (
                    <div 
                      key={fret}
                      className={`absolute top-0 w-px h-4 bg-gray-600 ${
                        fret === 0 ? 'bg-gray-800' : ''
                      }`}
                      style={{ left: `${fret * (size === 'large' ? 28 : size === 'medium' ? 20 : 12) / 4}px` }}
                    ></div>
                  ))}
                  
                  {/* Dedos */}
                  {diagram.fingers
                    .filter(finger => finger.string === stringNum)
                    .map((finger, fingerIndex) => (
                      <div
                        key={fingerIndex}
                        className={`absolute ${classes.dot} bg-white rounded-full border border-gray-800 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center`}
                        style={{
                          left: `${finger.fret * (size === 'large' ? 28 : size === 'medium' ? 20 : 12) / 4}px`,
                          top: '50%'
                        }}
                      >
                        <span className={`${size === 'small' ? 'text-xs' : 'text-xs'} text-gray-800 font-bold`}>
                          {finger.fret}
                        </span>
                      </div>
                    ))}
                  
                  {/* Círculo abierto */}
                  {isOpen && (
                    <div
                      className="absolute w-2 h-2 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `-${size === 'large' ? 4 : size === 'medium' ? 3 : 2}px`,
                        top: '50%'
                      }}
                    ></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChordDiagram;
