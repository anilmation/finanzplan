import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { createClient: createSupabase } = await import('@supabase/supabase-js').then(m => ({ createClient: m.createClient }))
  const sb = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await sb.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const yearParam = req.nextUrl.searchParams.get('year')
  if (!yearParam) return NextResponse.json({ error: 'year required' }, { status: 400 })

  const year = await prisma.budgetYear.findFirst({
    where: { userId: user.id, year: parseInt(yearParam) },
  })
  if (!year) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      where: { yearId: year.id },
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    }),
    prisma.income.findMany({
      where: { yearId: year.id },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return NextResponse.json({
    year: { ...year, createdAt: year.createdAt.toISOString() },
    expenses: expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
      createdAt: e.createdAt.toISOString(),
      category: e.category ? { ...e.category, children: [] } : undefined,
    })),
    incomes: incomes.map((i) => ({
      ...i,
      amount100Pct: Number(i.amount100Pct),
      createdAt: i.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { year, copyFromId } = await req.json()
  if (!year || typeof year !== 'number') {
    return NextResponse.json({ error: 'year required' }, { status: 400 })
  }

  // Check year doesn't exist
  const existing = await prisma.budgetYear.findFirst({
    where: { userId: user.id, year },
  })
  if (existing) return NextResponse.json({ error: 'Year already exists' }, { status: 409 })

  // Create year
  const newYear = await prisma.budgetYear.create({
    data: { userId: user.id, year, copiedFromYearId: copyFromId },
  })

  let expenses: unknown[] = []
  let incomes: unknown[] = []

  // Copy from previous year if requested
  if (copyFromId) {
    const sourceYear = await prisma.budgetYear.findFirst({
      where: { id: copyFromId, userId: user.id },
    })
    if (sourceYear) {
      const [srcExpenses, srcIncomes] = await Promise.all([
        prisma.expense.findMany({ where: { yearId: copyFromId } }),
        prisma.income.findMany({ where: { yearId: copyFromId } }),
      ])

      const createdExpenses = await Promise.all(
        srcExpenses.map((e) =>
          prisma.expense.create({
            data: {
              yearId: newYear.id,
              name: e.name,
              amount: e.amount,
              frequency: e.frequency,
              type: e.type,
              categoryId: e.categoryId,
              notes: e.notes,
              sortOrder: e.sortOrder,
            },
            include: { category: true },
          })
        )
      )

      const createdIncomes = await Promise.all(
        srcIncomes.map((i) =>
          prisma.income.create({
            data: {
              yearId: newYear.id,
              name: i.name,
              amount100Pct: i.amount100Pct,
              employmentPct: i.employmentPct,
              frequency: i.frequency,
              type: i.type,
              notes: i.notes,
              sortOrder: i.sortOrder,
            },
          })
        )
      )

      expenses = createdExpenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
        createdAt: e.createdAt.toISOString(),
        category: e.category ? { ...e.category, children: [] } : undefined,
      }))
      incomes = createdIncomes.map((i) => ({
        ...i,
        amount100Pct: Number(i.amount100Pct),
        createdAt: i.createdAt.toISOString(),
      }))
    }
  }

  return NextResponse.json({
    year: { ...newYear, createdAt: newYear.createdAt.toISOString() },
    expenses,
    incomes,
  })
}
