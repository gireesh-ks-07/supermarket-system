
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let supermarketId
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any
            supermarketId = decoded.supermarketId
        } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

        // Fetch distinct flat numbers from Customers who have credit sales or payments
        // Ideally we just list all customers with flat numbers
        const customers = await prisma.customer.findMany({
            where: {
                supermarketId,
                flatNumber: { not: null },
            },
            select: {
                flatNumber: true
            },
            distinct: ['flatNumber'],
            orderBy: { flatNumber: 'asc' }
        })

        const flats = customers.map(c => c.flatNumber).filter(Boolean)

        return NextResponse.json(flats)

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
