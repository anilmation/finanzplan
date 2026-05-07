import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cat = await prisma.category.findFirst({ where: { id: params.id, userId: user.id } })
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, color, icon } = await req.json()
  const updated = await prisma.category.update({
    where: { id: params.id },
    data: { name: name ?? cat.name, color: color ?? cat.color, icon: icon ?? cat.icon },
  })
  return NextResponse.json({ ...updated, children: [] })
}
