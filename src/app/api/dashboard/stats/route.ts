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

    // 3. Low Stock Calculation
    const productsWithBatches = await prisma.product.findMany({
        where: { supermarketId },
        include: { batches: true }
    })

    const lowStockCount = productsWithBatches.filter((p: any) => {
        const totalStock = p.batches.reduce((sum: number, b: any) => sum + b.quantity, 0)
        return totalStock < p.minStockLevel
    }).length

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

    const recentSales = await prisma.sale.findMany({
        where: {
            supermarketId,
            date: { gte: startOfWeek }
        },
        include: { items: { include: { product: true } } }
    })

    // Group by Day for chart
    const chartData = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek)
        d.setDate(d.getDate() + i)
        const dayStr = d.toISOString().split('T')[0]
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })

        const total = recentSales
            .filter(s => s.date.toISOString().startsWith(dayStr))
            .reduce((acc, curr) => acc + Number(curr.totalAmount), 0)

        chartData.push({ name: dayName, total })
    }

    // 6. Top Products
    const productStats: any = {}
    recentSales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
            if (!productStats[item.productId]) {
                productStats[item.productId] = { name: item.product.name, sold: 0, rev: 0 }
            }
            productStats[item.productId].sold += item.quantity
            productStats[item.productId].rev += Number(item.total)
        })
    })

    const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.rev - a.rev)
        .slice(0, 5)

    return NextResponse.json({
        products: productsCount,
        salesToday: Number(salesToday._sum.totalAmount || 0),
        monthlySales: Number(monthlySales._sum.totalAmount || 0),
        lowStock: lowStockCount,
        chartData,
        topProducts
    })
}
