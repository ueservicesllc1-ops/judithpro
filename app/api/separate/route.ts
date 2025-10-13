import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // En producción (Railway), el backend está en el mismo contenedor
    // En local, usar localhost
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT
    const backendUrl = isProduction ? 'http://127.0.0.1:8000' : 'http://127.0.0.1:8000'
    
    console.log('🔗 Forwarding to backend:', `${backendUrl}/separate`, { isProduction })
    
    // Forward the request to the Python backend
    const response = await fetch(`${backendUrl}/separate`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in /api/separate:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
