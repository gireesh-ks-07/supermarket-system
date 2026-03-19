import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

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

export async function GET(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily' // daily, weekly, monthly, yearly, custom
    const dateParam = searchParams.get('date')

    const now = new Date()
    let startDate = new Date()
    let endDate: Date | undefined

    // --------------------------------------------------------------------------------
    // Logic: Calculate Start/End dates based on Period using Pseudo-Local IST dates
    // --------------------------------------------------------------------------------
    // 1. Calculate pseudo-local basedate (where its internal node UTC fields align with IST wall clock)
    const baseDate = dateParam 
        ? new Date(`${dateParam.split('T')[0]}T00:00:00`) 
        : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))

    if (isNaN(baseDate.getTime())) baseDate.setTime(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getTime())

    if (period === 'custom' && dateParam) {
        startDate = new Date(baseDate)
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
    } else if (period === 'daily') {
        startDate = new Date(baseDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
    } else if (period === 'weekly') {
        startDate = new Date(baseDate)
        const day = startDate.getDay()
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
        startDate.setDate(diff)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 7)
    } else if (period === 'monthly') {
        startDate = new Date(baseDate)
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
    } else if (period === 'yearly') {
        startDate = new Date(baseDate)
        startDate.setMonth(0, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // Convert pseudo-local boundary to true UTC boundary for exact database fetching
    const realStartDate = new Date(startDate.getTime() - (5.5 * 60 * 60 * 1000))
    const realEndDate = endDate ? new Date(endDate.getTime() - (5.5 * 60 * 60 * 1000)) : undefined

    // Common WHERE clause
    const whereClause: any = {
        supermarketId,
        date: { gte: realStartDate }
    }
    if (realEndDate) {
        whereClause.date.lt = realEndDate
    }

    // --------------------------------------------------------------------------------
    // 1. Fetch SALES (excluding CREDIT, as those are not yet "money in bank")
    // --------------------------------------------------------------------------------
    const paidSales = await prisma.sale.findMany({
        where: {
            ...whereClause,
            paymentMode: { not: 'CREDIT' } 
        },
        select: {
            date: true,
            totalAmount: true,
            paymentMode: true
        }
    })

    // --------------------------------------------------------------------------------
    // 2. Fetch CREDIT SETTLEMENTS
    // --------------------------------------------------------------------------------
    const creditSettlements = await prisma.payment.findMany({
        where: {
            customer: { supermarketId },
            date: { gte: realStartDate, ...(realEndDate ? { lt: realEndDate } : {}) }
        },
        select: {
            date: true,
            amount: true,
            paymentMode: true
        }
    })

    // Combine for Total Money Received
    const allTransactions = [
        ...paidSales.map(s => ({ date: s.date, amount: Number(s.totalAmount), mode: s.paymentMode })),
        ...creditSettlements.map(p => ({ date: p.date, amount: Number(p.amount), mode: p.paymentMode }))
    ]

    // --------------------------------------------------------------------------------
    // 3. Process Chart Data (Based on buckets suitable for the period)
    // --------------------------------------------------------------------------------
    let chartData = []

    if (period === 'daily' || period === 'custom') {
        // Hourly breakdown (0-23)
        for (let i = 0; i < 24; i++) {
            const label = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
            const total = allTransactions
                .filter(t => {
                    const istDateStr = new Date(t.date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
                    return new Date(istDateStr).getHours() === i
                })
                .reduce((acc, curr) => acc + curr.amount, 0)
            chartData.push({ label, value: total })
        }
    } else if (period === 'weekly') {
        // Daily breakdown (Mon-Sun)
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate)
            d.setDate(d.getDate() + i)
            const label = d.toLocaleDateString('en-US', { weekday: 'short' })

            const total = allTransactions
                .filter(t => {
                    const istDateStr = new Date(t.date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' })
                    return istDateStr === label
                })
                .reduce((acc, curr) => acc + curr.amount, 0)
            chartData.push({ label, value: total })
        }
    } else if (period === 'monthly') {
        // Daily breakdown (1-31)
        const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()

        for (let i = 1; i <= daysInMonth; i++) {
            const label = i.toString()
            const total = allTransactions
                .filter(t => {
                    const istDateStr = new Date(t.date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
                    return new Date(istDateStr).getDate() === i
                })
                .reduce((acc, curr) => acc + curr.amount, 0)
            chartData.push({ label, value: total })
        }
    } else if (period === 'yearly') {
        // Monthly breakdown (Jan-Dec)
        for (let i = 0; i < 12; i++) {
            const d = new Date(startDate)
            d.setMonth(d.getMonth() + i)
            const label = d.toLocaleDateString('en-US', { month: 'short' })
            const total = allTransactions
                .filter(t => {
                    const istDateStr = new Date(t.date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
                    return new Date(istDateStr).getMonth() === i
                })
                .reduce((acc, curr) => acc + curr.amount, 0)
            chartData.push({ label, value: total })
        }
    }

    // --------------------------------------------------------------------------------
    // 4. Calculate Totals
    // --------------------------------------------------------------------------------
    const revenue = allTransactions.reduce((acc, curr) => acc + curr.amount, 0)

    // Note: Sales Count reflects total INVOICES generated
    const totalSalesCount = await prisma.sale.count({ where: whereClause })

    // --------------------------------------------------------------------------------
    // 5. Top Products (Unchanged - based on Sales Items)
    // --------------------------------------------------------------------------------
    const topSellingItems = await prisma.saleItem.groupBy({
        by: ['productId'],
        where: { sale: whereClause },
        _sum: { total: true, quantity: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5
    })

    const topProducts = await Promise.all(topSellingItems.map(async (item) => {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true, unit: true }
        })
        return {
            name: product?.name || 'Unknown',
            value: Number(item._sum.total || 0),
            quantity: item._sum.quantity,
            unit: product?.unit
        }
    }))

    // --------------------------------------------------------------------------------
    // 6. Payment Method Stats (Money In Hand)
    // --------------------------------------------------------------------------------
    const modeMap = new Map<string, number>()

    for (const t of allTransactions) {
        const mode = t.mode || 'UNKNOWN'
        modeMap.set(mode, (modeMap.get(mode) || 0) + t.amount)
    }

    const paymentStats = Array.from(modeMap.entries()).map(([mode, amount]) => ({
        mode,
        amount
    }))

    return NextResponse.json({
        revenue,
        salesCount: totalSalesCount,
        chartData,
        topProducts,
        paymentStats
    })
}
