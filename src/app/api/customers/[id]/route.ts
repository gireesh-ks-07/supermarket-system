import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

async function getUser(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return null
        return jwt.verify(token, JWT_SECRET) as any
    } catch (e) {
        return null
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: customerId } = await params
        const body = await request.json()
        const { name, phone, flatNumber } = body

        const updated = await prisma.customer.update({
            where: { id: customerId, supermarketId: user.supermarketId },
            data: {
                name: name !== undefined ? name : undefined,
                phone: phone !== undefined ? phone : undefined,
                flatNumber: flatNumber !== undefined ? flatNumber : undefined
            }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        console.error('Update customer error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 400 })
    }
}
