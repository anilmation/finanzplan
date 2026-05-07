import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimitRequest } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: NextRequest) {
  const { success, response } = await rateLimitRequest(req, { limit: 3, windowMs: 3600_000 })
  if (!success) return response!

  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.user.delete({ where: { id: user.id } })

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      await adminClient.auth.admin.deleteUser(user.id)
    }

    logger.security('Account deleted', { userId: user.id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('Account deletion failed', { userId: user.id, error: String(err) })
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 })
  }
}
