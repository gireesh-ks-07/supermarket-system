
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

        let user
        try {
            user = jwt.verify(token, JWT_SECRET) as any
        } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

        const customers = await prisma.customer.findMany({
            where: {
                supermarketId: user.supermarketId,
                flatNumber: { not: null }
            },
            select: {
                id: true,
                name: true,
                flatNumber: true
            },
            orderBy: { flatNumber: 'asc' }
        })

        if (!customers.length) {
            return NextResponse.json([])
        }

        const customerIds = customers.map(c => c.id)

        const creditSalesGroup = await prisma.sale.groupBy({
            by: ['customerId'],
            where: {
                supermarketId: user.supermarketId,
                customerId: { in: customerIds },
                paymentMode: 'CREDIT'
            },
            _sum: { totalAmount: true }
        })

        const paymentsGroup = await prisma.payment.groupBy({
            by: ['customerId'],
            where: {
                supermarketId: user.supermarketId,
                customerId: { in: customerIds }
            },
            _sum: { amount: true }
        })

        const creditMap = new Map<string, number>()
        creditSalesGroup.forEach(item => {
            if (item.customerId) creditMap.set(item.customerId, Number(item._sum.totalAmount || 0))
        })

        const paymentMap = new Map<string, number>()
        paymentsGroup.forEach(item => {
            if (item.customerId) paymentMap.set(item.customerId, Number(item._sum.amount || 0))
        })

        const summary = customers.map(customer => {
            const totalCredit = creditMap.get(customer.id) || 0
            const totalPaid = paymentMap.get(customer.id) || 0
            const balance = totalCredit - totalPaid
            return {
                id: customer.id,
                name: customer.name,
                flatNumber: customer.flatNumber,
                totalCredit,
                totalPaid,
                balance
            }
        }).filter(item => item.totalCredit > 0 || item.totalPaid > 0) // Only those with activity

        return NextResponse.json(summary)

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
