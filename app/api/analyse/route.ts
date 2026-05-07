import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const yearId = formData.get('yearId') as string

  if (!file || !yearId) {
    return NextResponse.json({ error: 'file and yearId required' }, { status: 400 })
  }

  // Verify year ownership
  const year = await prisma.budgetYear.findFirst({
    where: { id: yearId, userId: user.id },
  })
  if (!year) return NextResponse.json({ error: 'Year not found' }, { status: 404 })

  // Get planned expenses for context
  const expenses = await prisma.expense.findMany({
    where: { yearId },
    include: { category: true },
  })

  // Convert PDF to base64
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  // Analyse with Claude
  const systemPrompt = `Du bist ein Finanzanalyse-Assistent. Du analysierst Kontoauszüge von Postfinance und extrahierst alle Transaktionen.

Geplante Ausgaben des Benutzers:
${expenses.map((e) => `- ${e.name}: CHF ${e.amount} (${e.frequency}, ${e.category?.name ?? 'keine Kategorie'})`).join('\n')}

Extrahiere ALLE Transaktionen aus dem PDF. Antworte NUR mit einem JSON-Array (keine anderen Texte, kein Markdown).

Format:
[
  {
    "date": "YYYY-MM-DD",
    "description": "Beschreibung der Transaktion",
    "amount": -50.00,
    "isIncome": false,
    "aiCategory": "Supermärkte",
    "matchedExpenseName": "Migros" (optional, wenn passend zu geplanter Ausgabe),
    "confidence": 0.9
  }
]

Regeln:
- amount: negativ für Ausgaben, positiv für Einnahmen
- aiCategory: sinnvolle Kategorie auf Deutsch
- matchedExpenseName: Name der passenden geplanten Ausgabe (wenn vorhanden)
- confidence: 0-1, wie sicher du bei der Kategorisierung bist`

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'PDF-Analyse ist noch nicht aktiviert. ANTHROPIC_API_KEY in .env.local setzen.' },
      { status: 503 }
    )
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Bitte extrahiere alle Transaktionen aus diesem Kontoauszug.',
            },
          ],
        },
      ],
      system: systemPrompt,
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '[]'

    let transactions: Array<{
      date: string
      description: string
      amount: number
      isIncome: boolean
      aiCategory: string
      matchedExpenseName?: string
      confidence: number
    }>

    try {
      const clean = rawText.replace(/```json\n?|```\n?/g, '').trim()
      transactions = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'KI konnte Transaktionen nicht parsen' }, { status: 422 })
    }

    // Match transactions to expenses
    const expenseByName = new Map(expenses.map((e) => [e.name.toLowerCase(), e]))

    // Save transactions to DB
    const saved = await Promise.all(
      transactions.map(async (t) => {
        const matchedExpense = t.matchedExpenseName
          ? expenseByName.get(t.matchedExpenseName.toLowerCase())
          : undefined

        return prisma.transaction.create({
          data: {
            yearId,
            date: new Date(t.date),
            description: t.description,
            amount: t.amount,
            isIncome: t.isIncome,
            aiCategory: t.aiCategory,
            aiConfidence: t.confidence,
            matchedExpenseId: matchedExpense?.id,
          },
        })
      })
    )

    return NextResponse.json({
      count: saved.length,
      transactions: saved.map((t) => ({
        ...t,
        amount: Number(t.amount),
        date: t.date.toISOString().split('T')[0],
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('AI analysis error:', err)
    return NextResponse.json({ error: 'Analyse fehlgeschlagen' }, { status: 500 })
  }
}
