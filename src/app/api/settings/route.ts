import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

async function getSupermarketId() {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        return decoded.supermarketId
    } catch { return null }
}

export async function GET() {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supermarket = await prisma.supermarket.findUnique({
        where: { id: supermarketId }
    })

    return NextResponse.json(supermarket)
}

export async function PUT(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { name, address, phone } = body

        const updated = await prisma.supermarket.update({
            where: { id: supermarketId },
            data: {
                name,
                address,
                phone
            }
        })

        return NextResponse.json(updated)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
