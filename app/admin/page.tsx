'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Image as ImageIcon, Users, Crown, Settings, Clock } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy } from 'firebase/firestore'
import { getUserSongs } from '@/lib/firestore'

interface User {
  id: string
  email: string
  displayName: string
  isPremium: boolean
  songsCount: number
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [showCoverAdmin, setShowCoverAdmin] = useState(false)
  const [showUsersAdmin, setShowUsersAdmin] = useState(false)
  const [showMaintenanceAdmin, setShowMaintenanceAdmin] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  
  // Estados para configuración de mantenimiento
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    isActive: false,
    startTime: '02:00',
    endTime: '08:00',
    message: 'Judith está en mantenimiento para mejorar tu experiencia'
  })
  const [saving, setSaving] = useState(false)

  const coverList = [
    { id: 1, name: 'Extraer de YouTube', file: 'cover1.jpg', active: true },
    { id: 2, name: 'Análisis de Acordes', file: 'cover2.jpg', active: true },
    { id: 3, name: 'Separación de Audio', file: 'cover3.jpg', active: true },
    { id: 4, name: 'Metrónomo', file: 'cover4.jpg', active: true },
    { id: 5, name: 'Detector de BPM', file: 'cover5.jpg', active: true },
    { id: 6, name: 'Cambio de Tempo', file: 'cover6.jpg', active: true },
    { id: 7, name: 'Cambio de Pitch', file: 'cover7.jpg', active: true },
    { id: 8, name: 'Control de Volumen', file: 'cover8.jpg', active: true },
    { id: 9, name: 'Grabación', file: 'cover9.jpg', active: false },
    { id: 10, name: 'Editor de Beats', file: 'cover10.jpg', active: false },
    { id: 11, name: 'Click Track', file: 'cover11.jpg', active: false },
  ]

  // Cargar usuarios desde Firestore
  useEffect(() => {
    if (showUsersAdmin) {
      loadUsers()
    }
  }, [showUsersAdmin])

  // Cargar configuración de mantenimiento
  useEffect(() => {
    if (showMaintenanceAdmin) {
      loadMaintenanceConfig()
    }
  }, [showMaintenanceAdmin])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const usersData: User[] = []
      
      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data()
        
        // Obtener cantidad de canciones del usuario
        const songs = await getUserSongs(userDoc.id)
        
        usersData.push({
          id: userDoc.id,
          email: userData.email || 'Sin email',
          displayName: userData.displayName || userData.name || 'Sin nombre',
          isPremium: userData.isPremium || false,
          songsCount: songs.length,
          createdAt: userData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
        })
      }
      
      setUsers(usersData)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePremium = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return
      
      const newPremiumStatus = !user.isPremium
      
      // Actualizar en Firestore
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        isPremium: newPremiumStatus
      })
      
      // Actualizar estado local
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isPremium: newPremiumStatus } : u
      ))
      
      console.log(`Usuario ${user.email} ahora es ${newPremiumStatus ? 'PREMIUM' : 'FREE'}`)
    } catch (error) {
      console.error('Error actualizando usuario:', error)
      alert('Error al actualizar el estado premium del usuario')
    }
  }

  const loadMaintenanceConfig = async () => {
    try {
      const configRef = doc(db, 'admin', 'maintenance')
      const configDoc = await getDocs(collection(db, 'admin'))
      
      if (!configDoc.empty) {
        const configData = configDoc.docs.find(doc => doc.id === 'maintenance')?.data()
        if (configData) {
          setMaintenanceConfig(configData)
        }
      }
    } catch (error) {
      console.error('Error cargando configuración de mantenimiento:', error)
    }
  }

  const saveMaintenanceConfig = async () => {
    setSaving(true)
    try {
      const configRef = doc(db, 'admin', 'maintenance')
      await setDoc(configRef, maintenanceConfig, { merge: true })
      alert('Configuración de mantenimiento guardada exitosamente')
    } catch (error) {
      console.error('Error guardando configuración:', error)
      alert('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </button>
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {!showCoverAdmin && !showUsersAdmin && !showMaintenanceAdmin ? (
          /* Dashboard Principal */
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Opciones de Administración</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Botón Administrar Cover */}
              <button
                onClick={() => setShowCoverAdmin(true)}
                className="group relative bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                    <ImageIcon className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Administrar Cover</h3>
                    <p className="text-sm text-purple-100">
                      Gestionar imágenes del CoverFlow
                    </p>
                  </div>
                </div>
              </button>

              {/* Botón Usuarios */}
              <button
                onClick={() => setShowUsersAdmin(true)}
                className="group relative bg-gradient-to-br from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Usuarios</h3>
                    <p className="text-sm text-green-100">
                      Gestionar usuarios y suscripciones
                    </p>
                  </div>
                </div>
              </button>

              {/* Botón Mantenimiento */}
              <button
                onClick={() => setShowMaintenanceAdmin(true)}
                className="group relative bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                    <Settings className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Mantenimiento</h3>
                    <p className="text-sm text-orange-100">
                      Configurar horarios de mantenimiento
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : showCoverAdmin ? (
          /* Sección de Administración de Cover */
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowCoverAdmin(false)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Volver al Dashboard</span>
              </button>
              <h2 className="text-xl font-bold text-white mb-2">Referencia de Imágenes del CoverFlow</h2>
              <p className="text-gray-400 text-sm">
                Para cambiar las imágenes del CoverFlow, coloca archivos JPG en la carpeta <code className="bg-gray-800 px-2 py-1 rounded text-green-400">/public/images/</code>
              </p>
            </div>

            {/* Tabla de referencia */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Funcionalidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre de Archivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ruta Completa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {coverList.map((cover) => (
                    <tr key={cover.id} className={`hover:bg-gray-750 transition-colors ${!cover.active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{cover.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          {cover.name}
                          {!cover.active && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-orange-900/30 text-orange-400 border border-orange-700 rounded">
                              V2.0
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-400">{cover.file}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">/public/images/{cover.file}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Instrucciones */}
            <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">📋 Instrucciones</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Coloca tus imágenes en la carpeta <code className="bg-gray-700 px-2 py-1 rounded text-green-400">/public/images/</code></li>
                <li>• Nombra las imágenes como <code className="bg-gray-700 px-2 py-1 rounded text-green-400">cover1.jpg</code>, <code className="bg-gray-700 px-2 py-1 rounded text-green-400">cover2.jpg</code>, etc.</li>
                <li>• Si la imagen no existe, se mostrará un gradiente de color por defecto</li>
                <li>• Tamaño recomendado: 800x600px o superior</li>
                <li>• Formato recomendado: JPG (también funciona PNG, JPEG, WebP)</li>
                <li>• Las imágenes se actualizan automáticamente al recargar la página</li>
              </ul>
            </div>
          </div>
        ) : showUsersAdmin ? (
          /* Sección de Administración de Usuarios */
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowUsersAdmin(false)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Volver al Dashboard</span>
              </button>
              <h2 className="text-xl font-bold text-white mb-2">Gestión de Usuarios</h2>
              <p className="text-gray-400 text-sm mb-4">
                Administra los usuarios y sus suscripciones Premium
              </p>
              
              {/* Aviso de restricciones */}
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
                <h3 className="text-yellow-400 font-bold mb-2">⚠️ Restricciones a partir del 1 de Noviembre 2025</h3>
                <ul className="text-yellow-200 text-sm space-y-1">
                  <li>• Usuarios FREE: Solo 3 canciones en su lista</li>
                  <li>• Usuarios FREE: No podrán separar nuevos multitracks</li>
                  <li>• Usuarios FREE: Solo podrán usar los tracks ya separados</li>
                  <li>• Usuarios PREMIUM: Sin restricciones</li>
                </ul>
              </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando usuarios...</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-400">No hay usuarios registrados</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Canciones</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fecha Registro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {user.displayName || 'Sin nombre'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span className={`px-2 py-1 rounded ${user.songsCount > 3 ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                          {user.songsCount} canciones
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {user.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.isPremium ? (
                          <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-full text-xs">
                            <Crown className="w-3 h-3" />
                            PREMIUM
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                            FREE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => togglePremium(user.id)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            user.isPremium
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                          }`}
                        >
                          {user.isPremium ? 'Quitar Premium' : 'Hacer Premium'}
                        </button>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Estadísticas */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-gray-400 text-sm mb-2">Total Usuarios</h3>
                <p className="text-3xl font-bold text-white">{users.length}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-gray-400 text-sm mb-2">Usuarios Premium</h3>
                <p className="text-3xl font-bold text-yellow-400">{users.filter(u => u.isPremium).length}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-gray-400 text-sm mb-2">Usuarios Free</h3>
                <p className="text-3xl font-bold text-gray-400">{users.filter(u => !u.isPremium).length}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Sección de Configuración de Mantenimiento */
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowMaintenanceAdmin(false)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Volver al Dashboard</span>
              </button>
              <h2 className="text-xl font-bold text-white mb-2">Configuración de Mantenimiento</h2>
              <p className="text-gray-400 text-sm mb-4">
                Configura cuándo mostrar el popup de mantenimiento a los usuarios
              </p>
            </div>

            {/* Formulario de configuración */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl">
              <div className="space-y-6">
                {/* Toggle para activar/desactivar */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Activar Mantenimiento</h3>
                    <p className="text-gray-400 text-sm">
                      Mostrar popup de mantenimiento a los usuarios
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintenanceConfig.isActive}
                      onChange={(e) => setMaintenanceConfig({
                        ...maintenanceConfig,
                        isActive: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {/* Horarios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Hora de Inicio
                    </label>
                    <input
                      type="time"
                      value={maintenanceConfig.startTime}
                      onChange={(e) => setMaintenanceConfig({
                        ...maintenanceConfig,
                        startTime: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Hora de Fin
                    </label>
                    <input
                      type="time"
                      value={maintenanceConfig.endTime}
                      onChange={(e) => setMaintenanceConfig({
                        ...maintenanceConfig,
                        endTime: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Mensaje personalizado */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mensaje Personalizado
                  </label>
                  <textarea
                    value={maintenanceConfig.message}
                    onChange={(e) => setMaintenanceConfig({
                      ...maintenanceConfig,
                      message: e.target.value
                    })}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Mensaje que se mostrará a los usuarios durante el mantenimiento"
                  />
                </div>

                {/* Vista previa */}
                <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Vista Previa:</h4>
                  <div className="text-sm text-gray-400">
                    <p><strong>Activo:</strong> {maintenanceConfig.isActive ? 'Sí' : 'No'}</p>
                    <p><strong>Horario:</strong> {maintenanceConfig.startTime} - {maintenanceConfig.endTime}</p>
                    <p><strong>Mensaje:</strong> {maintenanceConfig.message}</p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-4">
                  <button
                    onClick={saveMaintenanceConfig}
                    disabled={saving}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                  
                  <button
                    onClick={() => setMaintenanceConfig({
                      isActive: false,
                      startTime: '02:00',
                      endTime: '08:00',
                      message: 'Judith está en mantenimiento para mejorar tu experiencia'
                    })}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                  >
                    Restaurar Valores por Defecto
                  </button>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-6">
              <h3 className="text-blue-400 font-bold mb-2">ℹ️ Información Importante</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• El popup aparecerá automáticamente durante el horario configurado</li>
                <li>• Los horarios se interpretan en la zona horaria del servidor (EST)</li>
                <li>• La cuenta regresiva se calcula automáticamente hasta la hora de fin</li>
                <li>• Puedes activar/desactivar el mantenimiento en cualquier momento</li>
                <li>• Los cambios se aplican inmediatamente a todos los usuarios</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
