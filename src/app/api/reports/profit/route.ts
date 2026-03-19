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

    let startDate = new Date()
    let endDate: Date | undefined = undefined

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    // Logic: Calculate Start/End dates based on Period using pseudo-local IST constraints
    // --------------------------------------------------------------------------------
    const baseDate = dateParam 
        ? new Date(`${dateParam.split('T')[0]}T00:00:00`) 
        : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))

    if (isNaN(baseDate.getTime())) baseDate.setTime(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getTime())

    if (period === 'custom' && dateParam) {
        startDate = new Date(baseDate)
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1) // 1 day window for custom date
    } else if (period === 'daily') {
        // Current day
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

    // Convert pseudo-local boundary to true UTC boundary 
    const realStartDate = new Date(startDate.getTime() - (5.5 * 60 * 60 * 1000))
    const realEndDate = endDate ? new Date(endDate.getTime() - (5.5 * 60 * 60 * 1000)) : undefined

    const whereClause: any = {
        supermarketId,
        date: { gte: realStartDate }
    }
    if (realEndDate) {
        whereClause.date.lt = realEndDate
    }

    try {
        // Fetch Sales with Items and Product Cost
        const sales = await prisma.sale.findMany({
            where: whereClause,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                costPrice: true,
                                pricingType: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'asc' }
        })

        let totalRevenue = 0
        let totalCost = 0
        let totalProfit = 0

        // Initialize Chart Data Buckets
        const groupedData: Record<string, { revenue: number, profit: number, sortIndex: number }> = {}

        if (period === 'daily' || period === 'custom') {
            for (let i = 0; i < 24; i++) {
                const label = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
                groupedData[label] = { revenue: 0, profit: 0, sortIndex: i }
            }
        } else if (period === 'weekly') {
            // Mon - Sun
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate)
                d.setDate(d.getDate() + i)
                const label = d.toLocaleDateString('en-US', { weekday: 'short' })
                groupedData[label] = { revenue: 0, profit: 0, sortIndex: i }
            }
        } else if (period === 'monthly') {
            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
            for (let i = 1; i <= daysInMonth; i++) {
                const label = i.toString()
                groupedData[label] = { revenue: 0, profit: 0, sortIndex: i }
            }
        } else if (period === 'yearly') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            months.forEach((m, i) => {
                groupedData[m] = { revenue: 0, profit: 0, sortIndex: i }
            })
        }

        for (const sale of sales) {
            let saleCost = 0
            for (const item of (sale as any).items) {
                const isVariable = item.product?.pricingType === 'DYNAMIC'

                let itemCost = 0
                if (isVariable) {
                    itemCost = (item.costPrice !== null && item.costPrice !== undefined)
                        ? Number(item.costPrice)
                        : (item.product?.costPrice ? Number(item.product.costPrice) : 0)
                } else {
                    itemCost = (item.product?.costPrice ? Number(item.product.costPrice) : 0)
                }

                const cost = itemCost * Number(item.quantity)
                saleCost += cost
            }
            const profit = Number(sale.totalAmount) - saleCost

            totalRevenue += Number(sale.totalAmount)
            totalCost += saleCost
            totalProfit += profit

            // Grouping logic - Convert sale.date into IST representations
            let key = ''
            const istDateStr = new Date(sale.date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
            const d = new Date(istDateStr)

            if (period === 'daily' || period === 'custom') {
                const h = d.getHours()
                key = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
            } else if (period === 'weekly') {
                key = d.toLocaleDateString('en-US', { weekday: 'short' })
            } else if (period === 'monthly') {
                key = d.getDate().toString()
            } else if (period === 'yearly') {
                key = d.toLocaleString('en-US', { month: 'short' })
            }

            if (groupedData[key]) {
                groupedData[key].revenue += Number(sale.totalAmount)
                groupedData[key].profit += profit
            }
        }

        // Format and Sort Chart Data
        const chartData = Object.entries(groupedData)
            .sort(([, a], [, b]) => a.sortIndex - b.sortIndex)
            .map(([label, data]) => ({ label, revenue: data.revenue, profit: data.profit }))

        return NextResponse.json({
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
            chartData,
            salesCount: sales.length
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
