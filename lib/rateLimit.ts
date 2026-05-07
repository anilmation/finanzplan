import { NextRequest, NextResponse } from 'next/server'

// In-memory fallback (for development / when Redis not configured)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>()

function inMemoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = inMemoryStore.get(key)
  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function rateLimitRequest(
  req: NextRequest,
  options: {
    limit?: number
    windowMs?: number
    identifier?: string
  } = {}
): Promise<{ success: boolean; response?: NextResponse }> {
  const { limit = 60, windowMs = 60_000, identifier } = options

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const key = identifier ? `${identifier}:${ip}` : `global:${ip}`

  // Try Upstash Redis if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        prefix: 'finanzplan',
      })

      const { success, remaining, reset } = await ratelimit.limit(key)

      if (!success) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
                'X-RateLimit-Remaining': '0',
              },
            }
          ),
        }
      }
      return { success: true }
    } catch (err) {
      console.error('Redis rate limit error, falling back to in-memory:', err)
    }
  }

  // Fallback to in-memory
  const allowed = inMemoryRateLimit(key, limit, windowMs)
  if (!allowed) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warte einen Moment.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      ),
    }
  }
  return { success: true }
}
