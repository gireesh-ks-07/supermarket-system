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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, role, pin, password } = body

    try {
        const data: any = { name, role, pin }
        if (password) {
            data.password = await bcrypt.hash(password, 10)
        }

        const user = await prisma.user.update({
            where: { id, supermarketId },
            data,
            select: { id: true, name: true, role: true }
        })
        return NextResponse.json({ success: true, user })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 400 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    try {
        await prisma.user.delete({
            where: { id, supermarketId: supermarketId } // Ensure we only delete our own users
        })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Cannot delete user' }, { status: 400 })
    }
}
