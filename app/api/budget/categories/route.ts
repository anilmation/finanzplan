import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    include: { children: true },
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
  })

  return NextResponse.json(categories.map((c) => ({ ...c, children: c.children ?? [] })))
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, color, parentId } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const category = await prisma.category.create({
    data: { userId: user.id, name, color: color ?? '#6366f1', parentId: parentId ?? null },
  })

  return NextResponse.json({ ...category, children: [] })
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const cat = await prisma.category.findFirst({ where: { id, userId: user.id } })
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
