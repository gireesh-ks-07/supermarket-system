import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { username, password, supermarketId } = body

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
        }

        // MVP: If no supermarketId, try to find the default one from Seed
        let targetStoreId = supermarketId
        if (!targetStoreId) {
            const firstStore = await prisma.supermarket.findFirst()
            if (!firstStore) {
                return NextResponse.json({ error: 'No supermarket configured' }, { status: 500 })
            }
            targetStoreId = firstStore.id
        }

        const user = await prisma.user.findUnique({
            where: {
                supermarketId_username: {
                    supermarketId: targetStoreId,
                    username
                }
            },
            include: {
                supermarket: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isPinLogin = /^\d{4}$/.test(password)
        let isValid = false

        if (isPinLogin && user.pin === password) {
            isValid = true
        } else {
            isValid = await bcrypt.compare(password, user.password)
        }

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Sign Token
        const token = jwt.sign(
            { userId: user.id, role: user.role, supermarketId: user.supermarketId },
            JWT_SECRET,
            { expiresIn: '8h' }
        )

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                store: user.supermarket.name
            }
        })

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 8 // 8 hours
        })

        return response

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
