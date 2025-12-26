import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

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

    const users = await prisma.user.findMany({
        where: { supermarketId },
        select: {
            id: true,
            name: true,
            username: true,
            role: true,
            pin: true,
            createdAt: true
        }
    })
    return NextResponse.json(users)
}

export async function POST(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { name, username, password, role, pin } = body

        if (!name || !username || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                supermarketId,
                name,
                username,
                password: hashedPassword,
                role,
                pin: pin || null
            },
            select: { id: true, name: true, username: true, role: true }
        })
        return NextResponse.json({ success: true, user })
    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
