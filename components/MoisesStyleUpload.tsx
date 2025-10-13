/**
 * Moises Style Upload Component
 * Arquitectura simplificada estilo Moises:
 * - Solo B2 Storage
 * - URLs consistentes
 * - Sin almacenamiento local
 * - Flujo simplificado
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveSong } from '../lib/firestore';
import { getBackendUrl } from '../lib/config';
import AdminModalLabel from './AdminModalLabel';

interface MoisesStyleUploadProps {
  onUploadComplete?: (songData: any) => void;
  preloadedFile?: File | null; // Archivo precargado desde YouTube u otra fuente
}

interface SeparationOptions {
  separationType: string; // 'vocals-instrumental', 'vocals-drums-bass-other', 'custom'
  vocals?: boolean;
  drums?: boolean;
  bass?: boolean;
  other?: boolean;
  hiFiMode: boolean;
}

const MoisesStyleUpload: React.FC<MoisesStyleUploadProps> = ({ onUploadComplete, preloadedFile }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(preloadedFile || null);
  const [showNoFilePopup, setShowNoFilePopup] = useState(false);
  const [separationOptions, setSeparationOptions] = useState<SeparationOptions>({
    separationType: 'vocals-instrumental',
    vocals: false,
    drums: false,
    bass: false,
    other: false,
    hiFiMode: false
  });

  // Efecto para manejar archivo precargado
  React.useEffect(() => {
    if (preloadedFile) {
      setUploadedFile(preloadedFile);
      setUploadMessage(`Archivo de YouTube: ${preloadedFile.name}`);
      console.log('📁 Archivo precargado desde YouTube:', preloadedFile.name);
    }
  }, [preloadedFile]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadMessage(`Archivo seleccionado: ${file.name}`);
    }
  }, []);

  // Función para calcular la duración del audio
  const getAudioDuration = async (file: File): Promise<{duration: string, durationSeconds: number}> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        const durationSeconds = Math.floor(audio.duration);
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        resolve({ duration, durationSeconds });
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        reject(new Error('Error al cargar el audio para calcular duración'));
      };
      
      audio.src = URL.createObjectURL(file);
    });
  };

  const getSeparationType = (options: SeparationOptions): string => {
    return options.separationType;
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      setShowNoFilePopup(true);
      return;
    }
    
    if (!user) {
      console.error('❌ No hay usuario:', { user });
      return;
    }

    console.log('🚀 Iniciando upload:', {
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.type,
      userId: user.uid,
      separationType: getSeparationType(separationOptions),
      hiFi: separationOptions.hiFiMode
    });

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage('Iniciando subida estilo Moises...');

    try {
      // Crear FormData
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('separation_type', getSeparationType(separationOptions));
      formData.append('hi_fi', separationOptions.hiFiMode.toString());
      formData.append('user_id', user.uid);

      console.log('📤 FormData creado:', {
        separationType: getSeparationType(separationOptions),
        hiFi: separationOptions.hiFiMode.toString(),
        userId: user.uid
      });

      setUploadProgress(20);
      setUploadMessage('📤 Enviando archivo al servidor...');

      console.log('🌐 Enviando request a: /api/separate');
      
      // Llamar al endpoint de Next.js que hace proxy al backend Python
      const response = await fetch('/api/separate', {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Response recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      setUploadProgress(40);
      setUploadMessage('☁️ Subiendo archivo a la nube...');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Resultado Moises Style:', result);

      // Siempre usar formato Moises Style
      if (result.success && result.data) {
        setUploadMessage('🤖 Procesando con IA (Demucs)...');
        setUploadProgress(60);
        
        // Esperar a que se complete la separación
        await waitForSeparationCompletion(result.data.task_id, uploadedFile, user);
        
      } else {
        throw new Error(result.error || 'Error en el procesamiento');
      }

    } catch (error) {
      console.error('❌ Error completo en upload:', {
        error,
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setUploadMessage(`❌ Error: ${errorMessage}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleOptionChange = (option: keyof SeparationOptions) => {
    // Si están activando un track individual (vocals, drums, bass, other)
    if (option === 'vocals' || option === 'drums' || option === 'bass' || option === 'other') {
      setSeparationOptions(prev => {
        const newValue = !prev[option];
        
        // Si están activando un track individual, desactivar "vocals-instrumental"
        if (newValue) {
          return {
            ...prev,
            [option]: newValue,
            separationType: 'custom' // Cambiar a modo custom
          };
        } else {
          // Si están desactivando, verificar si todos los tracks están desactivados
          const updatedOptions = {
            ...prev,
            [option]: newValue
          };
          
          // Si todos los tracks individuales están desactivados, activar "vocals-instrumental"
          if (!updatedOptions.vocals && !updatedOptions.drums && !updatedOptions.bass && !updatedOptions.other) {
            return {
              ...updatedOptions,
              separationType: 'vocals-instrumental'
            };
          }
          
          return updatedOptions;
        }
      });
    } else {
      // Para hiFiMode u otras opciones
      setSeparationOptions(prev => ({
        ...prev,
        [option]: !prev[option]
      }));
    }
  };

  const waitForSeparationCompletion = async (taskId: string, file: File, user: any) => {
    const maxAttempts = 300; // 15 minutos máximo para Railway
    let attempts = 0;

  const poll = async () => {
    try {
      // Usar el proxy de Next.js en vez de ir directo al backend
      const statusResponse = await fetch(`/api/status/${taskId}`);
        const statusResult = await statusResponse.json();

        // Usar el progreso del backend
        const backendProgress = statusResult.progress || 0;
        const totalProgress = 60 + (backendProgress * 0.3); // 60% base + 30% del backend
        setUploadProgress(Math.min(totalProgress, 95)); // Máximo 95% hasta completar
        
        setUploadMessage(`Procesando con IA... ${backendProgress}% (${attempts + 1}/300)`);

        if (statusResult.status === 'completed') {
          setUploadMessage('💾 Guardando metadata en base de datos...');
          setUploadProgress(95);

          // Calcular duración del audio
          let audioDuration = { duration: '0:00', durationSeconds: 0 };
          try {
            audioDuration = await getAudioDuration(file);
            console.log(`✅ Duración calculada: ${audioDuration.duration} (${audioDuration.durationSeconds}s)`);
          } catch (error) {
            console.warn('⚠️ No se pudo calcular la duración:', error);
          }

          // Usar valores del backend
          let calculatedKey = statusResult.key || 'E';
          let calculatedTimeSignature = statusResult.timeSignature || '4/4';

          // Guardar en Firestore
          const songData = {
            title: file.name.replace(/\.[^/.]+$/, ""), // Sin extensión
            artist: user.displayName || 'Usuario',
            genre: 'Unknown',
            bpm: statusResult.bpm || 126,
            key: calculatedKey,
            duration: audioDuration.duration,
            durationSeconds: audioDuration.durationSeconds,
            timeSignature: calculatedTimeSignature,
            album: '',
            thumbnail: '🎵',
            fileUrl: statusResult.stems?.original || `${getBackendUrl()}/audio/${taskId}/original.mp3`,
            uploadedAt: new Date().toISOString(),
            userId: user.uid,
            fileSize: file.size,
            fileName: file.name,
            status: 'completed' as const,
            stems: statusResult.stems || {
              vocals: `${getBackendUrl()}/audio/${taskId}/vocals.wav`,
              drums: `${getBackendUrl()}/audio/${taskId}/drums.wav`,
              bass: `${getBackendUrl()}/audio/${taskId}/bass.wav`,
              other: `${getBackendUrl()}/audio/${taskId}/other.wav`
            },
            separationTaskId: taskId
          };

          const firestoreSongId = await saveSong(songData);
          console.log('✅ Guardado en Firestore:', firestoreSongId);

          setUploadProgress(100);
          setUploadMessage('🎉 ¡Separación completada exitosamente!');

          // Notificar al componente padre
          if (onUploadComplete) {
            const completeData = {
              ...songData,
              id: firestoreSongId
            };
            console.log('🎵 MoisesStyleUpload - Llamando onUploadComplete con:', completeData);
            onUploadComplete(completeData);
          }

          // Reset después de un momento
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadMessage('');
            setUploadedFile(null);
          }, 2000);

        } else if (statusResult.status === 'failed') {
          throw new Error(`Separación falló: ${statusResult.error || 'Error desconocido'}`);
        } else {
          attempts++;
          console.log(`Polling attempt ${attempts}/${maxAttempts}, status: ${statusResult.status}, progress: ${backendProgress}%`);
          
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000); // Poll cada 5 segundos para reducir carga
          } else {
            throw new Error(`Separación tardó demasiado tiempo (${maxAttempts} intentos = ${maxAttempts * 3 / 60} minutos). Último estado: ${statusResult.status}, progreso: ${backendProgress}%`);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setUploadMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setIsUploading(false);
        setUploadProgress(0);
      }
    };

    await poll();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 shadow-lg">
      <AdminModalLabel modalName="MoisesStyleUpload" />
      <div className="space-y-6">

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Seleccionar Archivo de Audio
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="w-full p-3 border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isUploading}
          />
          {uploadedFile && (
            <div className="mt-2 p-3 bg-green-900 border border-green-700">
              <p className="text-green-300">
                <strong>Archivo:</strong> {uploadedFile.name}
              </p>
              <p className="text-green-400 text-sm">
                <strong>Tamaño:</strong> {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {/* Separation Options */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Opciones de Separación
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Botón Rápido Voz + Pista */}
            <button
              onClick={() => {
                // Si ya está seleccionado, deseleccionar
                if (separationOptions.separationType === 'vocals-instrumental') {
                  setSeparationOptions(prev => ({
                    ...prev,
                    separationType: 'vocals-instrumental',
                    vocals: false,
                    drums: false,
                    bass: false,
                    other: false
                  }));
                } else {
                  // Configurar automáticamente para separación de voz + instrumental con Spleeter
                  // y desactivar todos los tracks individuales
                  setSeparationOptions(prev => ({
                    ...prev,
                    separationType: 'vocals-instrumental',
                    vocals: false,
                    drums: false,
                    bass: false,
                    other: false
                  }));
                }
              }}
              disabled={isUploading}
              className={`col-span-2 w-full p-4 border transition-all duration-300 font-medium relative shadow-lg overflow-hidden bg-black ${
                isUploading
                  ? 'border-white/20 bg-gradient-to-b from-white/10 via-white/5 to-transparent text-gray-500 cursor-not-allowed'
                  : separationOptions.separationType === 'vocals-instrumental'
                    ? 'border-green-400/50 bg-gradient-to-r from-green-500/30 via-green-400/20 to-transparent text-white hover:from-green-500/35 hover:via-green-400/25'
                    : 'border-white/20 bg-gradient-to-b from-white/10 via-white/5 to-transparent text-white hover:from-white/15 hover:via-white/8'
              }`}
            >
              🎤 Voz + Pista
              <div className={`w-4 h-2 rounded transition-colors absolute top-2 right-2 ${
                separationOptions.separationType === 'vocals-instrumental'
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-gray-500'
              }`}></div>
            </button>
            
            {[
              { key: 'vocals', label: '🎤 Vocals', description: 'Voces principales' },
              { key: 'drums', label: '🥁 Drums', description: 'Batería y percusión' },
              { key: 'bass', label: '🎸 Bass', description: 'Línea de bajo' },
              { key: 'other', label: '🎹 Other', description: 'Otros instrumentos' }
            ].map(({ key, label, description }) => (
             <button
               key={key}
               onClick={() => handleOptionChange(key as keyof SeparationOptions)}
                disabled={isUploading}
               className={`p-3 border transition-all duration-300 text-left relative shadow-lg overflow-hidden bg-black ${
                 separationOptions[key as keyof SeparationOptions]
                   ? 'border-blue-400/50 bg-gradient-to-b from-blue-500/20 via-blue-400/10 to-transparent text-white hover:from-blue-500/25 hover:via-blue-400/15'
                   : 'border-white/20 bg-gradient-to-b from-white/10 via-white/5 to-transparent text-white hover:from-white/15 hover:via-white/8'
               }`}
             >
               <div className={`w-4 h-2 rounded transition-colors absolute top-2 right-2 ${
                 separationOptions[key as keyof SeparationOptions] 
                   ? 'bg-blue-500 animate-pulse' 
                   : 'bg-gray-500'
               }`}></div>
               <div>
                 <div className="font-medium">{label}</div>
                 <div className="text-sm opacity-75">{description}</div>
               </div>
             </button>
            ))}
          </div>
        </div>

        {/* Hi-Fi Mode */}
        <div>
           <button
             onClick={() => handleOptionChange('hiFiMode')}
                disabled={isUploading}
             className={`w-full p-3 border transition-all duration-300 text-left relative shadow-lg overflow-hidden bg-black ${
               separationOptions.hiFiMode
                 ? 'border-white/30 bg-gradient-to-b from-white/20 via-white/10 to-transparent text-white hover:from-white/25 hover:via-white/15'
                 : 'border-white/20 bg-gradient-to-b from-white/10 via-white/5 to-transparent text-white hover:from-white/15 hover:via-white/8'
             }`}
           >
             <div className={`w-4 h-2 rounded transition-colors absolute top-2 right-2 ${
               separationOptions.hiFiMode ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'
             }`}></div>
             <div>
               <div className="font-medium">🎚️ Modo Hi-Fi</div>
               <div className="text-sm opacity-75">Calidad superior (procesamiento más lento)</div>
             </div>
           </button>
        </div>


        {/* Upload Button / Progress Bar */}
        {isUploading ? (
          <div className="space-y-4">
            {/* Barra de progreso mejorada */}
            <div className="w-full bg-gray-800 h-8 relative overflow-hidden rounded-lg border border-gray-600">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out flex items-center justify-center animate-pulse"
                style={{ width: `${Math.max(uploadProgress, 20)}%` }}
              >
                <span className="text-white font-bold text-sm drop-shadow-lg">
                  {Math.max(uploadProgress, 20).toFixed(0)}%
                </span>
              </div>
              {/* Efecto de brillo que se mueve */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
            
            {/* Mensaje de estado */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
              <p className="text-white font-medium text-lg animate-pulse">
                {uploadMessage || 'Procesando...'}
              </p>
              <p className="text-gray-400 text-sm">
                ⏱️ No te preocupes, esto puede tardar varios minutos
              </p>
              <p className="text-gray-500 text-xs">
                🔄 Estamos separando tu audio con IA...
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full py-3 px-6 font-medium text-white transition-all duration-300 shadow-lg overflow-hidden border bg-black ${
              isUploading
                ? 'bg-gradient-to-b from-white/10 via-white/5 to-transparent border-white/20 cursor-not-allowed'
                : 'bg-gradient-to-b from-white/10 via-white/5 to-transparent border-white/20 hover:from-white/15 hover:via-white/8 focus:ring-4 focus:ring-white/20'
            }`}
          >
            Separar Tracks
          </button>
        )}

      </div>

      {/* Popup para cuando no hay archivo */}
      {showNoFilePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black bg-gradient-to-b from-white/15 via-white/8 to-transparent border border-white/20 p-6 max-w-md mx-4 shadow-lg overflow-hidden">
            <div className="text-center">
              <h3 className="text-white text-lg font-semibold mb-4">
                Para separar los tracks...
              </h3>
              <p className="text-gray-300 mb-6">
                Primero sube una canción Bro
              </p>
              <button
                onClick={() => setShowNoFilePopup(false)}
                className="bg-black border border-white/20 bg-gradient-to-b from-white/10 via-white/5 to-transparent hover:from-white/15 hover:via-white/8 text-white px-6 py-2 transition-all duration-300 shadow-lg overflow-hidden"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoisesStyleUpload;