import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const yearId = formData.get('yearId') as string

  if (!file || !yearId) return NextResponse.json({ error: 'file and yearId required' }, { status: 400 })

  const year = await prisma.budgetYear.findFirst({ where: { id: yearId, userId: user.id } })
  if (!year) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const text = await file.text()
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return NextResponse.json({ error: 'Leere Datei' }, { status: 400 })

  const headers = lines[0].split(';').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const values = line.split(';').map((v) => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })

  let updated = 0
  let created = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      const betrag = parseFloat(row.betrag?.replace(',', '.') ?? '0')
      const rabattPct = parseInt(row.rabatt_pct ?? '0') || 0
      const id = row.id?.trim()

      if (row.typ === 'Ausgabe') {
        const frequency = ['monthly', 'yearly', 'once'].includes(row.haeufigkeit) ? row.haeufigkeit as 'monthly' | 'yearly' | 'once' : 'monthly'
        const type = ['fixed', 'estimate', 'savings'].includes(row.ausgabe_typ) ? row.ausgabe_typ as 'fixed' | 'estimate' | 'savings' : 'fixed'

        if (id) {
          const existing = await prisma.expense.findFirst({ where: { id, yearId } })
          if (existing) {
            await prisma.expense.update({
              where: { id },
              data: { name: row.name, amount: betrag, discountPct: rabattPct, frequency, type, notes: row.notizen || null },
            })
            updated++
            continue
          }
        }
        await prisma.expense.create({
          data: { yearId, name: row.name, amount: betrag, discountPct: rabattPct, frequency, type, notes: row.notizen || null },
        })
        created++

      } else if (row.typ === 'Einnahme') {
        const frequency = ['monthly', 'yearly', 'once'].includes(row.haeufigkeit) ? row.haeufigkeit as 'monthly' | 'yearly' | 'once' : 'monthly'
        const employmentPct = parseInt(row.kategorie?.replace('% Anstellung', '')) || 100

        if (id) {
          const existing = await prisma.income.findFirst({ where: { id, yearId } })
          if (existing) {
            await prisma.income.update({
              where: { id },
              data: { name: row.name, amount100Pct: betrag, employmentPct, frequency, notes: row.notizen || null },
            })
            updated++
            continue
          }
        }
        await prisma.income.create({
          data: { yearId, name: row.name, amount100Pct: betrag, employmentPct, frequency, type: 'other', notes: row.notizen || null },
        })
        created++
      }
    } catch (e) {
      errors.push(`Zeile ${row.name}: ${e}`)
    }
  }

  return NextResponse.json({ updated, created, errors })
}
