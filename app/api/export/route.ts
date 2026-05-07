import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const yearId = req.nextUrl.searchParams.get('yearId')
  if (!yearId) return NextResponse.json({ error: 'yearId required' }, { status: 400 })

  const year = await prisma.budgetYear.findFirst({ where: { id: yearId, userId: user.id } })
  if (!year) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      where: { yearId },
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.income.findMany({
      where: { yearId },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  // Build CSV-compatible data that Excel can open
  const expenseRows = expenses.map((e) => ({
    typ: 'Ausgabe',
    name: e.name,
    betrag: Number(e.amount),
    rabatt_pct: e.discountPct ?? 0,
    effektiver_betrag: Number(e.amount) * (1 - (e.discountPct ?? 0) / 100),
    haeufigkeit: e.frequency,
    ausgabe_typ: e.type,
    kategorie: e.category?.name ?? '',
    notizen: e.notes ?? '',
    id: e.id,
  }))

  const incomeRows = incomes.map((i) => ({
    typ: 'Einnahme',
    name: i.name,
    betrag: Number(i.amount100Pct),
    rabatt_pct: 0,
    effektiver_betrag: Number(i.amount100Pct) * i.employmentPct / 100,
    haeufigkeit: i.frequency,
    ausgabe_typ: i.type,
    kategorie: `${i.employmentPct}% Anstellung`,
    notizen: i.notes ?? '',
    id: i.id,
  }))

  const allRows = [...incomeRows, ...expenseRows]

  // Build CSV
  const headers = ['typ', 'name', 'betrag', 'rabatt_pct', 'effektiver_betrag', 'haeufigkeit', 'ausgabe_typ', 'kategorie', 'notizen', 'id']
  const csv = [
    headers.join(';'),
    ...allRows.map((row) =>
      headers.map((h) => {
        const val = row[h as keyof typeof row]
        const str = String(val ?? '')
        return str.includes(';') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(';')
    ),
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="finanzplan_${year.year}.csv"`,
    },
  })
}
