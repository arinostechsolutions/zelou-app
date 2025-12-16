import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, condominium, units, message } = body

    // Validação básica
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Nome, email e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Enviar para o backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
    const backendResponse = await fetch(`${backendUrl}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        condominium,
        units,
        message,
      }),
    })

    if (!backendResponse.ok) {
      throw new Error('Erro ao enviar mensagem para o backend')
    }

    const data = await backendResponse.json()

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erro ao processar contato:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}

