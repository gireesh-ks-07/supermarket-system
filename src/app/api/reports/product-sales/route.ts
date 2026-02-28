import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const period = searchParams.get('period') || 'daily' // daily, monthly, yearly
        const dateValue = searchParams.get('date') // YYYY-MM-DD or YYYY-MM

        if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let user
        try {
            user = jwt.verify(token, JWT_SECRET) as any
        } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

        // Date Filtering Logic
        let dateRange: any = {}
        if (period === 'daily' && dateValue) {
            const start = new Date(dateValue)
            start.setHours(0, 0, 0, 0)
            const end = new Date(dateValue)
            end.setHours(23, 59, 59, 999)
            dateRange = { gte: start, lte: end }
        } else if (period === 'monthly' && dateValue) {
            const [year, month] = dateValue.split('-').map(Number)
            const start = new Date(year, month - 1, 1)
            const end = new Date(year, month, 0, 23, 59, 59, 999)
            dateRange = { gte: start, lte: end }
        } else if (period === 'yearly' && dateValue) {
            const year = parseInt(dateValue)
            const start = new Date(year, 0, 1)
            const end = new Date(year, 11, 31, 23, 59, 59, 999)
            dateRange = { gte: start, lte: end }
        }

        const product = await prisma.product.findUnique({
            where: { id: productId, supermarketId: user.supermarketId },
            select: { name: true, barcode: true, unit: true, sellingPrice: true }
        })

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

        const saleItems = await prisma.saleItem.findMany({
            where: {
                productId,
                sale: {
                    supermarketId: user.supermarketId,
                    date: dateRange.gte ? dateRange : undefined
                }
            },
            include: {
                sale: {
                    select: {
                        invoiceNumber: true,
                        date: true,
                        paymentMode: true,
                        customer: {
                            select: { name: true, flatNumber: true }
                        }
                    }
                }
            },
            orderBy: { sale: { date: 'desc' } }
        })

        const totalQuantity = saleItems.reduce((acc, item) => acc + item.quantity, 0)
        const totalRevenue = saleItems.reduce((acc, item) => acc + Number(item.total), 0)

        return NextResponse.json({
            product,
            totalQuantity,
            totalRevenue,
            sales: saleItems.map(item => ({
                id: item.id,
                invoiceNumber: item.sale.invoiceNumber,
                date: item.sale.date,
                paymentMode: item.sale.paymentMode,
                quantity: item.quantity,
                total: Number(item.total),
                customer: item.sale.customer ? `${item.sale.customer.name} (Flat ${item.sale.customer.flatNumber})` : 'Walk-in'
            }))
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
