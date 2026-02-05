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
    const period = searchParams.get('period') || 'weekly' // daily, weekly, monthly, custom
    const dateParam = searchParams.get('date')

    const now = new Date()
    let startDate = new Date()
    let endDate: Date | undefined = undefined // Optional upper bound used for 'custom' range
    let dateFormat: 'day' | 'date' | 'month' | 'hour' = 'day'

    // Default logic
    if (period === 'custom' && dateParam) {
        // Specific Day (from 00:00 to 23:59)
        startDate = new Date(dateParam)

        // Ensure valid date
        if (isNaN(startDate.getTime())) {
            startDate = new Date()
        }

        // Set to requested day boundaries (assuming input is YYYY-MM-DD which parses to UTC 00:00)
        // We will treat this 24h block as the target.
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
        dateFormat = 'hour'

    } else if (period === 'daily') {
        // Last 7 Days
        startDate.setDate(now.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        dateFormat = 'day'
    } else if (period === 'weekly') {
        // Last 4 Weeks
        startDate.setDate(now.getDate() - 28)
        startDate.setHours(0, 0, 0, 0)
        dateFormat = 'date'
    } else if (period === 'monthly') {
        // Last 12 Months
        startDate.setMonth(now.getMonth() - 11)
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        dateFormat = 'month'
    } else if (period === 'yearly') {
        // Current Year (Jan 1 to Now)
        startDate = new Date(now.getFullYear(), 0, 1)
        startDate.setHours(0, 0, 0, 0)
        dateFormat = 'month'
    }

    // Common WHERE clause
    const whereClause: any = {
        supermarketId,
        date: { gte: startDate }
    }
    if (endDate) {
        whereClause.date.lt = endDate
    }

    // Fetch Sales
    const sales = await prisma.sale.findMany({
        where: whereClause,
        select: {
            date: true,
            totalAmount: true
        }
    })

    // Process Chart Data
    let chartData = []

    if (period === 'custom') {
        // Hourly Breakdown (00 to 23)
        // ... (existing code)
        for (let i = 0; i < 24; i++) {
            const label = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`

            const total = sales
                .filter(s => new Date(s.date).getHours() === i)
                .reduce((acc, curr) => acc + Number(curr.totalAmount), 0)

            chartData.push({ label, value: total })
        }
    } else if (period === 'daily') {
        // ... (existing code)
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate)
            d.setDate(d.getDate() + i)
            const label = d.toLocaleDateString('en-US', { weekday: 'short' }) // Mon
            const key = d.toDateString()

            const total = sales
                .filter(s => new Date(s.date).toDateString() === key)
                .reduce((acc, curr) => acc + Number(curr.totalAmount), 0)

            chartData.push({ label, value: total })
        }
    } else if (period === 'weekly') {
        // ... (existing code)
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(startDate)
            weekStart.setDate(weekStart.getDate() + (i * 7))
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)

            const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`

            const total = sales
                .filter(s => {
                    const d = new Date(s.date)
                    return d >= weekStart && d <= weekEnd
                })
                .reduce((acc, curr) => acc + Number(curr.totalAmount), 0)

            chartData.push({ label, value: total })
        }
    } else if (period === 'monthly' || period === 'yearly') {
        // Monthly Breakdown
        const months = period === 'monthly' ? 12 : 12 // For yearly, we might want just Jan-Dec of current year, or up to now. 
        // Logic for 'yearly' (Jan to Dec):
        const limit = period === 'monthly' ? 12 : 12

        for (let i = 0; i < limit; i++) {
            const d = new Date(startDate)
            d.setMonth(d.getMonth() + i)

            // For yearly, avoid going into future if startDate is Jan 1st
            if (period === 'yearly' && d.getFullYear() > now.getFullYear()) break

            const label = d.toLocaleDateString('en-US', { month: 'short' }) // Jan
            const monthKey = `${d.getFullYear()}-${d.getMonth()}`

            const total = sales
                .filter(s => {
                    const sDate = new Date(s.date)
                    return `${sDate.getFullYear()}-${sDate.getMonth()}` === monthKey
                })
                .reduce((acc, curr) => acc + Number(curr.totalAmount), 0)

            chartData.push({ label, value: total })
        }
    }

    // Calculate totals
    const revenue = sales.reduce((acc, curr) => acc + Number(curr.totalAmount), 0)
    const salesCount = sales.length

    // Top Products for Period
    const topSellingItems = await prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
            sale: whereClause
        },
        _sum: {
            total: true,
            quantity: true
        },
        orderBy: {
            _sum: { total: 'desc' }
        },
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

    // Payment Method Stats
    const paymentStatsRaw = await prisma.sale.groupBy({
        by: ['paymentMode'],
        where: whereClause,
        _sum: {
            totalAmount: true
        }
    })

    const paymentStats = paymentStatsRaw.map(p => ({
        mode: p.paymentMode,
        amount: Number(p._sum.totalAmount || 0)
    }))

    return NextResponse.json({
        revenue,
        salesCount,
        chartData,
        topProducts,
        paymentStats
    })
}
