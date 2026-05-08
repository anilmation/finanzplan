import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SWISS_TEMPLATE_CATEGORIES, SWISS_TEMPLATE_EXPENSES, SWISS_TEMPLATE_INCOMES } from '@/lib/swissTemplate'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { year, copyFromId, useTemplate } = await req.json()
  if (!year || typeof year !== 'number') {
    return NextResponse.json({ error: 'year required' }, { status: 400 })
  }

  const existing = await prisma.budgetYear.findFirst({ where: { userId: user.id, year } })
  if (existing) return NextResponse.json({ error: 'Year already exists' }, { status: 409 })

  const newYear = await prisma.budgetYear.create({
    data: { userId: user.id, year, copiedFromYearId: copyFromId },
  })

  let expenses: unknown[] = []
  let incomes: unknown[] = []

  if (useTemplate) {
    // Create template categories
    const categoryMap = new Map<string, string>()
    for (const cat of SWISS_TEMPLATE_CATEGORIES) {
      const existing = await prisma.category.findFirst({ where: { userId: user.id, name: cat.name } })
      let catId: string
      if (existing) {
        catId = existing.id
      } else {
        const created = await prisma.category.create({
          data: { userId: user.id, name: cat.name, color: cat.color, icon: cat.icon },
        })
        catId = created.id
      }
      categoryMap.set(cat.name, catId)
    }

    // Create template expenses
    const createdExpenses = await Promise.all(
      SWISS_TEMPLATE_EXPENSES.map((e, i) =>
        prisma.expense.create({
          data: {
            yearId: newYear.id,
            name: e.name,
            amount: e.amount,
            frequency: e.frequency,
            type: e.type,
            categoryId: categoryMap.get(e.categoryName),
            sortOrder: i,
          },
          include: { category: true },
        })
      )
    )

    // Create template incomes
    const createdIncomes = await Promise.all(
      SWISS_TEMPLATE_INCOMES.map((i, idx) =>
        prisma.income.create({
          data: {
            yearId: newYear.id,
            name: i.name,
            amount100Pct: i.amount100Pct,
            employmentPct: i.employmentPct,
            frequency: i.frequency,
            type: i.type,
            sortOrder: idx,
          },
        })
      )
    )

    expenses = createdExpenses.map((e) => ({
      ...e, amount: Number(e.amount), factor: Number(e.factor ?? 1),
      monthSplitAmount: e.monthSplitAmount ? Number(e.monthSplitAmount) : undefined,
      monthSplitFactor: e.monthSplitFactor ? Number(e.monthSplitFactor) : undefined,
      monthSplitFrom: e.monthSplitFrom ?? undefined,
      categoryId: e.categoryId ?? undefined,
      notes: e.notes ?? undefined,
      createdAt: e.createdAt.toISOString(),
      category: e.category ? { ...e.category, icon: e.category.icon ?? 'tag', parentId: e.category.parentId ?? undefined, children: [] } : undefined,
    }))
    incomes = createdIncomes.map((i) => ({
      ...i, amount100Pct: Number(i.amount100Pct), factor: Number(i.factor ?? 1),
      monthSplitAmount: i.monthSplitAmount ? Number(i.monthSplitAmount) : undefined,
      monthSplitFactor: i.monthSplitFactor ? Number(i.monthSplitFactor) : undefined,
      monthSplitFrom: i.monthSplitFrom ?? undefined,
      monthSplitEmploymentPct: i.monthSplitEmploymentPct ?? undefined,
      notes: i.notes ?? undefined,
      createdAt: i.createdAt.toISOString(),
    }))

  } else if (copyFromId) {
    const sourceYear = await prisma.budgetYear.findFirst({ where: { id: copyFromId, userId: user.id } })
    if (sourceYear) {
      const [srcExpenses, srcIncomes] = await Promise.all([
        prisma.expense.findMany({ where: { yearId: copyFromId } }),
        prisma.income.findMany({ where: { yearId: copyFromId } }),
      ])

      const createdExpenses = await Promise.all(
        srcExpenses.map((e) =>
          prisma.expense.create({
            data: {
              yearId: newYear.id, name: e.name, amount: e.amount, frequency: e.frequency,
              type: e.type, categoryId: e.categoryId, notes: e.notes, sortOrder: e.sortOrder,
              discountPct: e.discountPct, factor: e.factor,
              monthSplitFrom: e.monthSplitFrom, monthSplitAmount: e.monthSplitAmount, monthSplitFactor: e.monthSplitFactor,
            },
            include: { category: true },
          })
        )
      )
      const createdIncomes = await Promise.all(
        srcIncomes.map((i) =>
          prisma.income.create({
            data: {
              yearId: newYear.id, name: i.name, amount100Pct: i.amount100Pct,
              employmentPct: i.employmentPct, factor: i.factor, frequency: i.frequency,
              type: i.type, notes: i.notes, sortOrder: i.sortOrder,
              monthSplitFrom: i.monthSplitFrom, monthSplitAmount: i.monthSplitAmount,
              monthSplitFactor: i.monthSplitFactor, monthSplitEmploymentPct: i.monthSplitEmploymentPct,
            },
          })
        )
      )

      expenses = createdExpenses.map((e) => ({
        ...e, amount: Number(e.amount), factor: Number(e.factor ?? 1),
        monthSplitAmount: e.monthSplitAmount ? Number(e.monthSplitAmount) : undefined,
        monthSplitFactor: e.monthSplitFactor ? Number(e.monthSplitFactor) : undefined,
        monthSplitFrom: e.monthSplitFrom ?? undefined,
        categoryId: e.categoryId ?? undefined,
        notes: e.notes ?? undefined,
        createdAt: e.createdAt.toISOString(),
        category: e.category ? { ...e.category, icon: e.category.icon ?? 'tag', parentId: e.category.parentId ?? undefined, children: [] } : undefined,
      }))
      incomes = createdIncomes.map((i) => ({
        ...i, amount100Pct: Number(i.amount100Pct), factor: Number(i.factor ?? 1),
        monthSplitAmount: i.monthSplitAmount ? Number(i.monthSplitAmount) : undefined,
        monthSplitFactor: i.monthSplitFactor ? Number(i.monthSplitFactor) : undefined,
        monthSplitFrom: i.monthSplitFrom ?? undefined,
        monthSplitEmploymentPct: i.monthSplitEmploymentPct ?? undefined,
        notes: i.notes ?? undefined,
        createdAt: i.createdAt.toISOString(),
      }))
    }
  }

  return NextResponse.json({
    year: { ...newYear, createdAt: newYear.createdAt.toISOString(), copiedFromYearId: newYear.copiedFromYearId ?? undefined },
    expenses,
    incomes,
  })
}
