
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

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
        const { saleId, mode } = body

        if (!saleId || !mode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const allowedModes = ['CASH', 'UPI', 'CREDIT']
        if (!allowedModes.includes(mode)) {
            return NextResponse.json({ error: 'Invalid payment mode' }, { status: 400 })
        }

        const sale = await prisma.sale.update({
            where: {
                id: saleId,
                supermarketId: user.supermarketId
            },
            data: {
                paymentMode: mode,
                // If we are switching back to CREDIT, we might want to ensure 'originalPaymentMode' is set handles correctly, 
                // but for now, simple switch is enough for the calculation to work.
                originalPaymentMode: mode === 'CREDIT' ? 'CREDIT' : undefined
            }
        })

        return NextResponse.json({ success: true, sale })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
