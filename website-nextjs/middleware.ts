import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // A verificação de autenticação será feita no lado do cliente
  // através do AuthContext e DashboardLayout
  // Este middleware apenas redireciona se necessário

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}

