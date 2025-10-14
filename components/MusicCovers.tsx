'use client'

import React from 'react'
import { 
  Music, 
  Clock, 
  Ruler, 
  Play, 
  Volume2, 
  Mic,
  Activity,
  Zap,
  Target,
  Youtube
} from 'lucide-react'

export interface MusicCover {
  id: string
  title: string
  description: string
  icon: React.ElementType
  bgColor: string
  textColor: string
  action: () => void
  color: string
  gradient: string
}

export const createMusicCovers = (
  onChordAnalysis: () => void,
  onMetronome: () => void,
  onAudioSeparation: () => void,
  onTempoChange: () => void,
  onPitchChange: () => void,
  onVolumeControl: () => void,
  onRecording: () => void,
  onBeatEditor: () => void,
  onClickTrack: () => void,
  onBpmDisplay: () => void,
  onYoutubeExtract: () => void
): MusicCover[] => [
  // Categoría: Importar
  {
    id: 'youtube-extract',
    title: 'Extraer de YouTube',
    description: 'Extrae audio de videos de YouTube',
    icon: Youtube,
    bgColor: 'linear-gradient(135deg, #FF0000, #CC0000, #990000)',
    textColor: 'white',
    color: '#FF0000',
    gradient: 'linear-gradient(135deg, #FF0000, #CC0000, #990000)',
    action: onYoutubeExtract
  },
  
  // Categoría: Análisis
  {
    id: 'chord-analysis',
    title: 'Análisis de Acordes',
    description: 'Detecta y analiza acordes en tiempo real',
    icon: Activity,
    bgColor: 'linear-gradient(135deg, #3B82F6, #1E40AF, #1E3A8A)',
    textColor: 'white',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #1E40AF, #1E3A8A)',
    action: onChordAnalysis
  },
  {
    id: 'audio-separation',
    title: 'Separación de Audio',
    description: 'Separa voces, instrumentos y percusión',
    icon: Mic,
    bgColor: 'linear-gradient(135deg, #8B5CF6, #7C3AED, #6D28D9)',
    textColor: 'white',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED, #6D28D9)',
    action: onAudioSeparation
  },
  
  // Categoría: Herramientas
  {
    id: 'metronome',
    title: 'Metrónomo',
    description: 'Metrónomo visual con diferentes ritmos',
    icon: Clock,
    bgColor: 'linear-gradient(135deg, #EF4444, #DC2626, #B91C1C)',
    textColor: 'white',
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444, #DC2626, #B91C1C)',
    action: onMetronome
  },
  {
    id: 'bpm-display',
    title: 'Detector de BPM',
    description: 'Detecta y muestra el tempo automáticamente',
    icon: Target,
    bgColor: 'linear-gradient(135deg, #EC4899, #DB2777, #BE185D)',
    textColor: 'white',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899, #DB2777, #BE185D)',
    action: onBpmDisplay
  },
  
  // Categoría: Efectos
  {
    id: 'tempo-change',
    title: 'Pitch & Tempo Control',
    description: 'Cambia tempo y tono del audio',
    icon: Play,
    bgColor: 'linear-gradient(135deg, #06B6D4, #0891B2, #0E7490)',
    textColor: 'white',
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4, #0891B2, #0E7490)',
    action: onTempoChange
  },
  // {
  //   id: 'pitch-change',
  //   title: 'Cambio de Tono',
  //   description: 'Cambia el tono sin afectar el tempo',
  //   icon: Volume2,
  //   bgColor: 'linear-gradient(135deg, #84CC16, #65A30D, #4D7C0F)',
  //   textColor: 'white',
  //   color: '#84CC16',
  //   gradient: 'linear-gradient(135deg, #84CC16, #65A30D, #4D7C0F)',
  //   action: onPitchChange
  // },
  
  // Categoría: Reproducción
  {
    id: 'volume-control',
    title: 'Control de Volumen',
    description: 'Control avanzado de volumen y ecualización',
    icon: Volume2,
    bgColor: 'linear-gradient(135deg, #6366F1, #4F46E5, #4338CA)',
    textColor: 'white',
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1, #4F46E5, #4338CA)',
    action: onVolumeControl
  },
  // DESHABILITADO PARA VERSIÓN 1.0 - ESTARÁ EN 2.0
  // {
  //   id: 'recording',
  //   title: 'Grabación',
  //   description: 'Graba y edita audio en tiempo real',
  //   icon: Mic,
  //   bgColor: 'linear-gradient(135deg, #F97316, #EA580C, #C2410C)',
  //   textColor: 'white',
  //   color: '#F97316',
  //   gradient: 'linear-gradient(135deg, #F97316, #EA580C, #C2410C)',
  //   action: onRecording
  // },
  // DESHABILITADO PARA VERSIÓN 1.0 - ESTARÁ EN 2.0
  // {
  //   id: 'beat-editor',
  //   title: 'Editor de Beats',
  //   description: 'Crea y edita patrones de percusión',
  //   icon: Activity,
  //   bgColor: 'linear-gradient(135deg, #8B5A2B, #7C2D12, #6B1F09)',
  //   textColor: 'white',
  //   color: '#8B5A2B',
  //   gradient: 'linear-gradient(135deg, #8B5A2B, #7C2D12, #6B1F09)',
  //   action: onBeatEditor
  // },
  // DESHABILITADO PARA VERSIÓN 1.0 - ESTARÁ EN 2.0
  // {
  //   id: 'click-track',
  //   title: 'Click Track',
  //   description: 'Genera pistas de click personalizadas',
  //   icon: Target,
  //   bgColor: 'linear-gradient(135deg, #BE185D, #9D174D, #831843)',
  //   textColor: 'white',
  //   color: '#BE185D',
  //   gradient: 'linear-gradient(135deg, #BE185D, #9D174D, #831843)',
  //   action: onClickTrack
  // }
]

export default createMusicCovers
