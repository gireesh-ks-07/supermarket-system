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

    // 3. Low Stock 
    // Fetch all products with their batches to calculate current stock
    const products = await prisma.product.findMany({
        where: { supermarketId, isActive: true },
        select: {
            id: true,
            minStockLevel: true,
            batches: { select: { quantity: true, expiryDate: true } }
        }
    })

    const lowStockCount = products.filter(p => {
        const totalStock = p.batches.reduce((sum, b) => sum + b.quantity, 0)
        return totalStock <= p.minStockLevel
    }).length

    // 4. Sales Monthly
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const monthlySales = await prisma.sale.aggregate({
        where: { supermarketId, date: { gte: startOfMonth } },
        _sum: { totalAmount: true }
    })

    // 5. Weekly Chart Data (Last 7 Days)
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    startOfWeek.setHours(0, 0, 0, 0)

    // Using group by raw or just JS processing. JS is safer for cross-db compatibility in MVP.
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

    const chartData = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek)
        d.setDate(d.getDate() + i)
        // Format: Mon, Tue
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
        const dayKey = d.toDateString()

        const total = weeklySales
            .filter(s => {
                const sDate = new Date(s.date).toDateString()
                return sDate === dayKey
            })
            .reduce((acc, curr) => acc + Number(curr.totalAmount), 0)

        chartData.push({ name: dayName, total })
    }

    // 6. Top Products
    // Get top 5 selling products by total revenue
    const topSellingItems = await prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
            sale: { supermarketId } // Ensure we only count this supermarket's sales
        },
        _sum: {
            total: true,
            quantity: true
        },
        orderBy: {
            _sum: {
                total: 'desc'
            }
        },
        take: 5
    })

    // Enrich with Product Name
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

    return NextResponse.json({
        products: productsCount,
        salesToday: Number(salesToday._sum.totalAmount || 0),
        monthlySales: Number(monthlySales._sum.totalAmount || 0),
        lowStock: lowStockCount,
        chartData,
        topProducts
    })
}
