import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitRequest } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || token.length < 50) return null

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch (err) {
    logger.error('Auth error', { error: String(err) })
    return null
  }
}

// Rate-limited auth middleware for API routes
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
  options: { rateLimit?: number; rateLimitWindow?: number } = {}
): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // Rate limit check
  const { success, response } = await rateLimitRequest(req, {
    limit: options.rateLimit ?? 60,
    windowMs: options.rateLimitWindow ?? 60_000,
    identifier: `api:${req.nextUrl.pathname}`,
  })

  if (!success) {
    logger.security('Rate limit exceeded', { ip, path: req.nextUrl.pathname })
    return response!
  }

  // Auth check
  const user = await getUserFromRequest(req)
  if (!user) {
    logger.security('Unauthorized API access', { ip, path: req.nextUrl.pathname })
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  return handler(req, user.id)
}
