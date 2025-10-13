import { NextRequest, NextResponse } from 'next/server'

// Deshabilitar caché para este endpoint
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params
    
    // En Railway, el backend está en el mismo contenedor
    const backendUrl = 'http://127.0.0.1:8000'
    
    console.log('🔍 Checking status for task:', taskId)
    
    // Forward the request to the Python backend - SIN CACHE
    const response = await fetch(`${backendUrl}/status/${taskId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Retornar sin caché
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Error in /api/status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

