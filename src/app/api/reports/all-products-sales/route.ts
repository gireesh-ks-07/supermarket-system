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

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'daily'
        const dateParam = searchParams.get('date')

        const now = new Date()
        let startDate = new Date()
        let endDate: Date | undefined

        const localDateStr = dateParam ? (dateParam.includes('T') ? dateParam : `${dateParam}T00:00:00`) : null
        const baseDate = localDateStr ? new Date(localDateStr) : new Date()
        if (isNaN(baseDate.getTime())) baseDate.setTime(Date.now())

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

        const dateRange: any = { gte: startDate }
        if (endDate) dateRange.lt = endDate

        // Since Prisma types might be out of date, we'll fetch SaleItems and Products separately
        const items = await prisma.saleItem.findMany({
            where: {
                sale: {
                    supermarketId: user.supermarketId,
                    date: dateRange
                }
            } as any
        })

        const productIds = Array.from(new Set(items.map(i => i.productId)))

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, category: true, unit: true, barcode: true, costPrice: true, pricingType: true }
        })

        const productMap = new Map(products.map(p => [p.id, p]))
        const map = new Map<string, any>()

        for (const item of items) {
            const product = productMap.get(item.productId)
            if (!product) continue;

            if (!map.has(item.productId)) {
                map.set(item.productId, {
                    id: item.productId,
                    name: product.name,
                    barcode: product.barcode,
                    category: product.category,
                    unit: product.unit,
                    qty: 0,
                    revenue: 0,
                    profit: 0
                })
            }

            const stat = map.get(item.productId)
            stat.qty += Number(item.quantity)
            stat.revenue += Number(item.total)

            // Dynamic logic: use batch cost for variable, product cost for MRP
            const isVariable = (product as any).pricingType === 'DYNAMIC'
            const costParam = (item as any).costPrice;

            let itemCost = 0
            if (isVariable) {
                itemCost = costParam !== null && costParam !== undefined
                    ? Number(costParam)
                    : (product.costPrice ? Number(product.costPrice) : 0)
            } else {
                itemCost = (product.costPrice ? Number(product.costPrice) : 0)
            }

            const profitObj = Number(item.total) - (itemCost * Number(item.quantity))
            stat.profit += profitObj
        }

        const result = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)

        return NextResponse.json(result)

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
