import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { trackUrl, format, trackName } = await request.json()
    
    console.log('📥 Solicitud de descarga:', { trackUrl, format, trackName })
    
    if (!trackUrl || !format) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Descargar el archivo original
    console.log('📡 Descargando archivo desde:', trackUrl)
    const response = await fetch(trackUrl)
    if (!response.ok) {
      throw new Error(`Error descargando: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('✅ Archivo descargado, tamaño:', buffer.length, 'bytes')
    
    // Crear archivo temporal
    const tempDir = path.join(process.cwd(), 'temp_conversion')
    await fs.mkdir(tempDir, { recursive: true })
    
    const timestamp = Date.now()
    const inputFile = path.join(tempDir, `input_${timestamp}.wav`)
    const outputFile = path.join(tempDir, `output_${timestamp}.${format}`)
    
    // Guardar archivo de entrada
    await fs.writeFile(inputFile, buffer)
    console.log('💾 Archivo temporal guardado:', inputFile)
    
    // Convertir con FFmpeg
    console.log('🔄 Iniciando conversión a', format.toUpperCase())
    
    let ffmpegCommand = ''
    if (format === 'mp3') {
      // Convertir a MP3 con buena calidad (320kbps)
      ffmpegCommand = `ffmpeg -y -i "${inputFile}" -codec:a libmp3lame -b:a 320k "${outputFile}"`
    } else {
      // WAV - convertir a formato estándar
      ffmpegCommand = `ffmpeg -y -i "${inputFile}" -codec:a pcm_s16le -ar 44100 "${outputFile}"`
    }
    
    console.log('🎬 Ejecutando:', ffmpegCommand)
    const { stdout, stderr } = await execAsync(ffmpegCommand)
    console.log('FFmpeg stdout:', stdout)
    if (stderr) console.log('FFmpeg stderr:', stderr)
    console.log('✅ Conversión completada')
    
    // Leer archivo convertido
    const convertedBuffer = await fs.readFile(outputFile)
    console.log('📦 Archivo convertido, tamaño:', convertedBuffer.length, 'bytes')
    
    // Limpiar archivos temporales
    await fs.unlink(inputFile).catch((err) => console.log('Error limpiando input:', err))
    await fs.unlink(outputFile).catch((err) => console.log('Error limpiando output:', err))
    
    // Enviar archivo
    return new NextResponse(Buffer.from(convertedBuffer), {
      headers: {
        'Content-Type': format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
        'Content-Disposition': `attachment; filename="${trackName}.${format}"`,
        'Content-Length': convertedBuffer.length.toString(),
      },
    })
    
  } catch (error: any) {
    console.error('❌ Error en conversión:', error)
    return NextResponse.json({ 
      error: 'Error converting audio', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
