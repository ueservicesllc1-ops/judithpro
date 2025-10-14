/**
 * NewSongUpload - Componente para subir canciones nuevas a la nube
 */

import React, { useState } from 'react';
import { X, Upload, Music, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveSong } from '@/lib/firestore';
import realB2Service from '@/lib/realB2Service';
import { getBackendUrl } from '@/lib/config';
import AdminModalLabel from './AdminModalLabel';

interface NewSongUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (songData: any) => void;
  onOpenMixer?: (songId: string) => void;
  skipSeparationModal?: boolean;
}

// SeparationOptions removed - audio separation will be reimplemented

const NewSongUpload: React.FC<NewSongUploadProps> = ({ isOpen, onClose, onUploadComplete, onOpenMixer, skipSeparationModal = false }) => {
  const { user } = useAuth();
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [metadataExtracted, setMetadataExtracted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedSongData, setUploadedSongData] = useState<any>(null);
  
  // REMOVED: Audio separation states - will be reimplemented
  // const [showSeparationModal, setShowSeparationModal] = useState(false);
  // const [separationOptions, setSeparationOptions] = useState<SeparationOptions | null>(null);
  // const [isProcessingSeparation, setIsProcessingSeparation] = useState(false);
  // const [separationProgress, setSeparationProgress] = useState(0);
  // const [separationMessage, setSeparationMessage] = useState('');

  // REMOVED: Audio separation functions - will be reimplemented
  // - saveSeparatedSongToCloud()
  // - pollSeparationStatus()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo de audio válido (MP3, WAV, M4A, AAC, OGG)');
        return;
      }
      
      // Validar tamaño (máximo 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 100MB.');
        return;
      }
      
      setSelectedFile(file);
      console.log('Archivo seleccionado:', file.name, file.size, 'bytes');
      
      // Auto-cargar datos del archivo
      const fileName = file.name;
      const parsedData = parseFileName(fileName);
      
      // Siempre cargar el título, y el artista si está disponible
      setSongTitle(parsedData.title);
      if (parsedData.artist) {
        setArtistName(parsedData.artist);
      }
      console.log('Datos auto-cargados:', parsedData);
    }
  };

  // Función para parsear el nombre del archivo y extraer artista y título
  const parseFileName = (fileName: string) => {
    // Remover extensión
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // Patrones comunes de nombres de archivos de música
    const patterns = [
      // "Artista - Título" o "Artista - Título (Año)"
      /^(.+?)\s*-\s*(.+?)(?:\s*\([0-9]{4}\))?$/,
      // "Título - Artista"
      /^(.+?)\s*-\s*(.+?)$/,
      // "Artista_Título" o "Artista_Título (Año)"
      /^(.+?)_(.+?)(?:\s*\([0-9]{4}\))?$/,
      // Solo título (sin separador)
      /^(.+)$/
    ];
    
    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        if (pattern === patterns[3]) {
          // Solo título encontrado
          return {
            artist: '',
            title: match[1].trim()
          };
        } else {
          // Artista y título encontrados
          return {
            artist: match[1].trim(),
            title: match[2].trim()
          };
        }
      }
    }
    
    // Si no coincide con ningún patrón, usar el nombre completo como título
    return {
      artist: '',
      title: nameWithoutExt
    };
  };

  // REMOVED: Audio separation processing functions - will be reimplemented
  // - handleSeparationOptions()
  // - processAudioSeparation()

  const handleUploadSong = async () => {
    try {
      if (!songTitle || !artistName || !selectedFile) {
        alert('Por favor completa todos los campos y selecciona un archivo');
        return;
      }

      if (!user?.uid) {
        alert('Debes estar autenticado para subir a la nube');
        return;
      }

      // Generar ID único para la canción
      const songId = `newsong_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🎵 Preparando nueva canción: ${artistName} - ${songTitle}`);
      console.log(`📁 Archivo: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`🆔 ID de canción: ${songId}`);
      
      // Datos básicos de la canción (sin subir a B2 aún)
      const songData = {
        id: songId,
        songId: songId,
        title: songTitle,
        artist: artistName,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadDate: new Date().toLocaleString(),
        userId: user.uid,
        status: 'pending_separation' // Estado pendiente de separación
      };
      
      // Guardar datos de la canción
      setUploadedSongData(songData);
      
      // REMOVED: Audio separation modal logic
      // TODO: Implement new separation logic here
      console.log('✅ Song prepared - separation needs to be reimplemented');
      
      // Por ahora, completar la subida directamente sin separación
      if (onUploadComplete) {
        onUploadComplete(songData);
      }
      onClose();
      
    } catch (error) {
      console.error('❌ Error preparando nueva canción:', error);
      alert(`❌ Error al preparar la canción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSongTitle('');
      setArtistName('');
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadedSongData(null);
      // REMOVED: Separation state cleanup - will be reimplemented
      // setShowSeparationModal(false);
      // setSeparationOptions(null);
      // setIsProcessingSeparation(false);
      onClose();
    }
  };

  // const handleEditorClose = () => { // REMOVED
  //   setShowAudioEditor(false);
  //   
  //   // Llamar callback si existe para actualizar la lista de canciones
  //   if (onUploadComplete && uploadedSongData) {
  //     onUploadComplete(uploadedSongData);
  //   }
  //   
  //   // Limpiar y cerrar todo
  //   handleClose();
  // };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <AdminModalLabel modalName="NewSongUpload" />
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary-400" />
            <h2 className="text-xl font-bold text-white">🎵 Nueva Canción</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-white text-2xl disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Los metadatos se extraen automáticamente del archivo */}
          {selectedFile && (songTitle || artistName) && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-bold mb-2">Metadatos extraídos automáticamente:</h4>
              {songTitle && (
                <p className="text-blue-400 text-sm mb-1">
                  <span className="font-medium">Título:</span> {songTitle}
                </p>
              )}
              {artistName && (
                <p className="text-green-400 text-sm">
                  <span className="font-medium">Artista:</span> {artistName}
                </p>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-white font-bold mb-2">📁 Archivo de Audio:</label>
            <input
              type="file"
              accept=".wav,.mp3,.m4a,.aac,.ogg"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-primary-500 focus:outline-none disabled:opacity-50"
            />
            {selectedFile && (
              <div className="mt-2 space-y-1">
                <p className="text-green-400 text-sm">
                  ✅ Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                {(songTitle || artistName) && (
                  <p className="text-blue-400 text-sm">
                    🔄 Datos auto-cargados del nombre del archivo
                  </p>
                )}
              </div>
            )}
          </div>

          {isUploading && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Subiendo...</span>
                <span className="text-white text-sm">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          

          <button
            onClick={handleUploadSong}
            disabled={!songTitle || !artistName || !selectedFile}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Music className="h-4 w-4" />
            <span>🤖 Procesar con IA</span>
          </button>

          <div className="text-xs text-gray-400 text-center space-y-1">
            <div>🤖 El archivo se procesará con IA para separar las pistas automáticamente</div>
            <div className="text-gray-500">
              💡 <strong>Tip:</strong> Nombra tu archivo como "Artista - Título" para auto-cargar los datos
              <br />Ejemplos: "Juan Pérez - Mi Canción.mp3" o "Banda - Rock Song (2024).wav"
            </div>
          </div>
        </div>

        {/* REMOVED: Progress Bar for Separation - will be reimplemented */}

        {/* Audio Separation Modal removed - will be reimplemented */}
      </div>

      {/* Audio Editor - REMOVED */}
    </div>
  );
};

export default NewSongUpload;

