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

export async function GET() {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Total Products
    const productsCount = await prisma.product.count({ where: { supermarketId } })

    // 2. Sales Today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const salesToday = await prisma.sale.aggregate({
        where: {
            supermarketId,
            date: { gte: startOfDay }
        },
        _sum: { totalAmount: true }
    })

    // 3. Low Stock (MVP: Products with batches expiring soon or stock count but here just count products)
    // Complex query: Find products where sum of batches < product.minStockLevel
    // This is hard in prisma directly without raw query or iterating.
    // Making a simpler rough check: just check products count for now, improve later.
    const lowStockCount = 0

    // 4. Sales Monthly
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const monthlySales = await prisma.sale.aggregate({
        where: { supermarketId, date: { gte: startOfMonth } },
        _sum: { totalAmount: true }
    })

    // 5. Weekly Chart Data
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    startOfWeek.setHours(0, 0, 0, 0)

    const weeklySales = await prisma.sale.findMany({
        where: {
            supermarketId,
            date: { gte: startOfWeek }
        },
        select: {
            date: true,
            totalAmount: true
        }
    })

    // Group by Day
    const chartData = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek)
        d.setDate(d.getDate() + i)
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }) // Mon, Tue
        const dayStr = d.toISOString().split('T')[0]

        const total = weeklySales
            .filter(s => s.date.toISOString().startsWith(dayStr))
            .reduce((acc, curr) => acc + Number(curr.totalAmount), 0)

        chartData.push({ name: dayName, total })
    }

    return NextResponse.json({
        products: productsCount,
        salesToday: Number(salesToday._sum.totalAmount || 0),
        monthlySales: Number(monthlySales._sum.totalAmount || 0),
        lowStock: lowStockCount,
        chartData
    })
}
