import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  yearId: z.string().uuid(),
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(['monthly', 'yearly', 'once']),
  type: z.enum(['fixed', 'estimate', 'savings']),
  categoryId: z.string().uuid().optional(),
  notes: z.string().optional(),
  discountPct: z.number().min(0).max(100).default(0),
  factor: z.number().min(0).default(1),
  monthSplitFrom: z.number().min(1).max(11).optional(),
  monthSplitAmount: z.number().optional(),
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

  const lastExpense = await prisma.expense.findFirst({ where: { yearId: data.yearId }, orderBy: { sortOrder: 'desc' } })

  const expense = await prisma.expense.create({
    data: {
      yearId: data.yearId,
      name: data.name,
      amount: data.amount,
      frequency: data.frequency,
      type: data.type,
      categoryId: data.categoryId,
      notes: data.notes,
      discountPct: data.discountPct,
      factor: data.factor,
      monthSplitFrom: data.monthSplitFrom,
      monthSplitAmount: data.monthSplitAmount,
      sortOrder: (lastExpense?.sortOrder ?? 0) + 1,
    },
    include: { category: true },
  })

  return NextResponse.json({
    ...expense,
    amount: Number(expense.amount),
    factor: Number(expense.factor),
    monthSplitAmount: expense.monthSplitAmount ? Number(expense.monthSplitAmount) : undefined,
    createdAt: expense.createdAt.toISOString(),
    category: expense.category ? { ...expense.category, children: [] } : undefined,
  })
}
