import { NextResponse, type NextRequest } from 'next/server'

// Security middleware
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers (backup - also in next.config.js)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Block suspicious patterns
  const url = request.nextUrl.pathname
  const suspiciousPatterns = [
    /\.\./,           // path traversal
    /<script/i,       // XSS attempts in URL
    /union.*select/i, // SQL injection attempts
    /etc\/passwd/,    // system file access
  ]

  if (suspiciousPatterns.some(p => p.test(url))) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
