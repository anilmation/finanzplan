import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const COLORS = [
  '#ef4444','#f97316','#f59e0b','#eab308','#84cc16',
  '#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9',
  '#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef',
  '#ec4899','#f43f5e','#fb7185','#fbbf24','#34d399',
  '#2dd4bf','#38bdf8','#818cf8','#c084fc','#f472b6',
  '#64748b','#78716c','#6b7280','#059669','#0284c7',
  '#7c3aed','#db2777','#dc2626','#d97706','#65a30d',
  '#0891b2','#4f46e5','#c026d3','#e11d48','#0d9488',
]

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: 'asc' },
  })

  // Assign unique colors
  const usedColors = new Set<string>()
  let colorIndex = 0

  for (const cat of categories) {
    let color = cat.color
    if (usedColors.has(color)) {
      // Find next unused color
      while (colorIndex < COLORS.length && usedColors.has(COLORS[colorIndex])) {
        colorIndex++
      }
      color = COLORS[colorIndex % COLORS.length]
      colorIndex++
    }
    usedColors.add(color)
    await prisma.category.update({ where: { id: cat.id }, data: { color } })
  }

  const updated = await prisma.category.findMany({
    where: { userId: user.id },
    include: { children: true },
  })

  return NextResponse.json(updated.map((c) => ({ ...c, children: c.children ?? [] })))
}
