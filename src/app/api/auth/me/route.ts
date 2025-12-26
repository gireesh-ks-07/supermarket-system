import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

export async function GET() {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any

        // Fetch fresh user data just in case
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                supermarketId: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)

    } catch (e) {
        return NextResponse.json({ error: 'Invalid Token' }, { status: 401 })
    }
}
