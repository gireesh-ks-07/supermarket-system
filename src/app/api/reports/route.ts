import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { startOfDay, endOfDay, subDays, startOfMonth, format, eachDayOfInterval } from 'date-fns'

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
    const period = searchParams.get('period') || 'weekly' // daily, weekly, monthly

    let startDate: Date
    let days: number

    switch (period) {
        case 'daily':
            startDate = startOfDay(new Date())
            days = 1
            break
        case 'monthly':
            startDate = subDays(new Date(), 29)
            days = 30
            break
        case 'weekly':
        default:
            startDate = subDays(new Date(), 6)
            days = 7
            break
    }

    // 1. Fetch Sales in range
    const sales = await prisma.sale.findMany({
        where: {
            supermarketId,
            date: { gte: startDate }
        },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    })

    // Compare with previous period for growth %
    const prevStartDate = subDays(startDate, days)
    const prevSales = await prisma.sale.aggregate({
        where: {
            supermarketId,
            date: {
                gte: prevStartDate,
                lt: startDate
            }
        },
        _sum: { totalAmount: true },
        _count: true
    })

    const totalRevenue = sales.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0)
    const totalSalesCount = sales.length
    const avgOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0

    const prevRevenue = Number(prevSales._sum.totalAmount || 0)
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    // 2. Chart Data
    const dateInterval = eachDayOfInterval({
        start: startDate,
        end: new Date()
    })

    const chartData = dateInterval.map(date => {
        const dayStr = format(date, 'yyyy-MM-dd')
        const daySales = sales.filter((s: any) => format(s.date, 'yyyy-MM-dd') === dayStr)
        return {
            day: format(date, 'EEE'),
            date: dayStr,
            sales: daySales.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0)
        }
    })

    // 3. Payment Mode Breakdown
    const paymentBreakdown = sales.reduce((acc: any, curr) => {
        acc[curr.paymentMode] = (acc[curr.paymentMode] || 0) + 1
        return acc
    }, {})

    const digitalCount = (paymentBreakdown['UPI'] || 0) + (paymentBreakdown['CARD'] || 0)
    const digitalPercent = totalSalesCount > 0 ? (digitalCount / totalSalesCount) * 100 : 0

    // 4. Top Selling Products
    const productStats: any = {}
    sales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
            if (!productStats[item.productId]) {
                productStats[item.productId] = {
                    name: item.product.name,
                    sold: 0,
                    rev: 0
                }
            }
            productStats[item.productId].sold += item.quantity
            productStats[item.productId].rev += Number(item.total)
        })
    })

    const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.rev - a.rev)
        .slice(0, 5)

    return NextResponse.json({
        kpis: {
            totalRevenue,
            totalSales: totalSalesCount,
            avgOrderValue,
            digitalPercent,
            revenueGrowth
        },
        chartData,
        topProducts
    })
}
