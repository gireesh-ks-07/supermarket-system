
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const SECRET_KEY = JWT_SECRET || 'super-secret-key-v2'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const flatNumber = searchParams.get('flatNumber')?.trim() || null
        const filterType = searchParams.get('filter') // 'date', 'month', 'year', 'all'
        const dateValue = searchParams.get('value') // '2023-10-25' or '2023-10' or '2023'

        if (!flatNumber) return NextResponse.json({ error: 'Flat Number required' }, { status: 400 })

        // Auth check
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let user
        try {
            user = jwt.verify(token, SECRET_KEY) as any
        } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

        // Find customer
        const customer = await prisma.customer.findFirst({
            where: {
                supermarketId: user.supermarketId,
                flatNumber: flatNumber
            }
        })

        if (!customer) {
            return NextResponse.json({ sales: [], total: 0, customer: null })
        }

        let dateFilter = {}
        console.log(`Debug Report: Flat=${flatNumber}, Filter=${filterType}, Value=${dateValue}`)

        if (dateValue && filterType) {
            if (filterType === 'date') {
                // dateValue is YYYY-MM-DD
                const start = new Date(dateValue + 'T00:00:00') // Force local start of day
                const end = new Date(dateValue + 'T23:59:59.999')
                dateFilter = { date: { gte: start, lte: end } }
            } else if (filterType === 'month') {
                // dateValue is YYYY-MM
                // Split manually to avoid timezone issues with `new Date('YYYY-MM')` which defaults to UTC
                const [year, month] = dateValue.split('-').map(Number)
                const start = new Date(year, month - 1, 1) // month is 0-indexed
                const end = new Date(year, month, 0, 23, 59, 59, 999) // Last day of month
                dateFilter = { date: { gte: start, lte: end } }
            } else if (filterType === 'year') {
                const year = Number(dateValue)
                const start = new Date(year, 0, 1)
                const end = new Date(year, 11, 31, 23, 59, 59)
                dateFilter = { date: { gte: start, lte: end } }
            }
        }

        const sales = await prisma.sale.findMany({
            where: {
                supermarketId: user.supermarketId,
                customerId: customer.id,
                ...dateFilter
            },
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: { date: 'desc' }
        })

        const payments = await prisma.payment.findMany({
            where: {
                supermarketId: user.supermarketId,
                customerId: customer.id,
                ...dateFilter
            },
            orderBy: { date: 'desc' }
        })

        console.log(`[Report] Found ${sales.length} sales`)
        const totalSales = sales.reduce((acc, sale) => acc + Number(sale.totalAmount), 0)

        // Calculate All-time Balance for this customer
        const allCreditSales = await prisma.sale.aggregate({
            where: {
                supermarketId: user.supermarketId,
                customerId: customer.id,
                paymentMode: 'CREDIT'
            },
            _sum: { totalAmount: true }
        })

        const allPayments = await prisma.payment.aggregate({
            where: {
                supermarketId: user.supermarketId,
                customerId: customer.id
            },
            _sum: { amount: true }
        })

        const totalCredit = Number(allCreditSales._sum.totalAmount || 0)
        const totalPaid = Number(allPayments._sum.amount || 0)
        const balance = totalCredit - totalPaid

        // For the filtered period (optional, but let's return all-time balance as primary "Due")

        return NextResponse.json({
            sales,
            total: totalSales,
            totalCredit, // All-time Credit
            totalPaid,   // All-time Paid
            balance,     // Outstanding
            payments,
            customer
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
