import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const expense = await prisma.expense.findFirst({ where: { id: params.id, year: { userId: user.id } }, include: { category: true } })
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      name: body.name ?? expense.name,
      amount: body.amount ?? expense.amount,
      frequency: body.frequency ?? expense.frequency,
      type: body.type ?? expense.type,
      categoryId: body.categoryId !== undefined ? (body.categoryId || null) : expense.categoryId,
      notes: body.notes ?? expense.notes,
      discountPct: body.discountPct ?? expense.discountPct,
      factor: body.factor ?? expense.factor,
      monthSplitFrom: body.monthSplitFrom !== undefined ? (body.monthSplitFrom || null) : expense.monthSplitFrom,
      monthSplitAmount: body.monthSplitAmount !== undefined ? (body.monthSplitAmount || null) : expense.monthSplitAmount,
      monthSplitFactor: body.monthSplitFactor !== undefined ? (body.monthSplitFactor || null) : expense.monthSplitFactor,
    },
    include: { category: true },
  })

  return NextResponse.json({
    ...updated,
    amount: Number(updated.amount),
    factor: Number(updated.factor),
    monthSplitAmount: updated.monthSplitAmount ? Number(updated.monthSplitAmount) : undefined,
    monthSplitFactor: updated.monthSplitFactor ? Number(updated.monthSplitFactor) : undefined,
    createdAt: updated.createdAt.toISOString(),
    category: updated.category ? { ...updated.category, children: [] } : undefined,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const expense = await prisma.expense.findFirst({ where: { id: params.id, year: { userId: user.id } } })
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.expense.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
