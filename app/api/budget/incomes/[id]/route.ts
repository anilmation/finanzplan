import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const income = await prisma.income.findFirst({ where: { id: params.id, year: { userId: user.id } } })
  if (!income) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.income.update({
    where: { id: params.id },
    data: {
      name: body.name ?? income.name,
      amount100Pct: body.amount100Pct ?? income.amount100Pct,
      employmentPct: body.employmentPct ?? income.employmentPct,
      factor: body.factor ?? income.factor,
      frequency: body.frequency ?? income.frequency,
      type: body.type ?? income.type,
      notes: body.notes ?? income.notes,
      monthSplitFrom: body.monthSplitFrom !== undefined ? (body.monthSplitFrom || null) : income.monthSplitFrom,
      monthSplitAmount: body.monthSplitAmount !== undefined ? (body.monthSplitAmount || null) : income.monthSplitAmount,
      monthSplitFactor: body.monthSplitFactor !== undefined ? (body.monthSplitFactor || null) : income.monthSplitFactor,
      monthSplitEmploymentPct: body.monthSplitEmploymentPct !== undefined ? (body.monthSplitEmploymentPct || null) : income.monthSplitEmploymentPct,
    },
  })

  return NextResponse.json({
    ...updated,
    amount100Pct: Number(updated.amount100Pct),
    factor: Number(updated.factor),
    monthSplitAmount: updated.monthSplitAmount ? Number(updated.monthSplitAmount) : undefined,
    monthSplitFactor: updated.monthSplitFactor ? Number(updated.monthSplitFactor) : undefined,
    monthSplitEmploymentPct: updated.monthSplitEmploymentPct ?? undefined,
    createdAt: updated.createdAt.toISOString(),
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const income = await prisma.income.findFirst({ where: { id: params.id, year: { userId: user.id } } })
  if (!income) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.income.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
