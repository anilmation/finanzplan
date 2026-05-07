import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  yearId: z.string().uuid(),
  name: z.string().min(1),
  amount100Pct: z.number().positive(),
  employmentPct: z.number().min(0).max(100).default(100),
  frequency: z.enum(['monthly', 'yearly', 'once']),
  type: z.enum(['salary', 'other']),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 })

  const data = parsed.data
  const year = await prisma.budgetYear.findFirst({ where: { id: data.yearId, userId: user.id } })
  if (!year) return NextResponse.json({ error: 'Year not found' }, { status: 404 })

  const income = await prisma.income.create({
    data: {
      yearId: data.yearId,
      name: data.name,
      amount100Pct: data.amount100Pct,
      employmentPct: data.employmentPct,
      frequency: data.frequency,
      type: data.type,
      notes: data.notes,
    },
  })

  return NextResponse.json({
    ...income,
    amount100Pct: Number(income.amount100Pct),
    createdAt: income.createdAt.toISOString(),
  })
}
