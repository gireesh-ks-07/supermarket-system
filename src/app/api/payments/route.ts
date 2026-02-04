
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

const paymentSchema = z.object({
    customerId: z.string().min(1),
    amount: z.number().positive(),
    note: z.string().optional()
})

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let user
        try {
            user = jwt.verify(token, JWT_SECRET) as any
        } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

        const body = await request.json()
        const result = paymentSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const { customerId, amount, note } = result.data

        const payment = await prisma.payment.create({
            data: {
                supermarketId: user.supermarketId,
                customerId,
                amount,
                note
            }
        })

        return NextResponse.json({ success: true, payment })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
