import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

// In a real app, we would throw here if missing. For this demo/preview, we allow fallback with a warning.
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('CRITICAL WARNING: JWT_SECRET is not set in production. Using insecure default.')
}

const SECRET_KEY = JWT_SECRET || 'super-secret-key-v2'

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let user
        try {
            user = jwt.verify(token, SECRET_KEY) as any
        } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

        const { items, paymentMode, flatNumber } = await request.json()

        if (!items || items.length === 0) return NextResponse.json({ error: 'Empty cart' }, { status: 400 })

        const totalAmount = items.reduce((acc: number, item: any) => acc + item.total, 0)

        const result = await prisma.$transaction(async (tx) => {
            let customerId = null

            if (flatNumber) {
                // Find or create customer with this flat number
                const existingCustomer = await tx.customer.findFirst({
                    where: {
                        supermarketId: user.supermarketId,
                        flatNumber
                    }
                })

                if (existingCustomer) {
                    customerId = existingCustomer.id
                } else {
                    const newCustomer = await tx.customer.create({
                        data: {
                            supermarketId: user.supermarketId,
                            flatNumber,
                            name: `Flat ${flatNumber}` // Auto-generate name
                        }
                    })
                    customerId = newCustomer.id
                }
            }

            const sale = await tx.sale.create({
                data: {
                    supermarketId: user.supermarketId,
                    cashierId: user.userId,
                    invoiceNumber: `INV-${Date.now()}`,
                    paymentMode,
                    subTotal: totalAmount,
                    taxTotal: 0,
                    totalAmount: totalAmount,
                    customerId,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.id,
                            quantity: item.quantity,
                            unitPrice: item.sellingPrice,
                            taxAmount: 0,
                            total: item.total
                        }))
                    }
                }
            })

            // Stock Deduction (FIFO)
            for (const item of items) {
                let remainingQty = item.quantity

                // Get batches sorted by expiry (First Expiring First Out)
                const batches = await tx.productBatch.findMany({
                    where: {
                        productId: item.id,
                        quantity: { gt: 0 }
                    },
                    orderBy: { expiryDate: 'asc' }
                })

                let totalAvailable = batches.reduce((acc, b) => acc + b.quantity, 0)
                if (totalAvailable < remainingQty) {
                    throw new Error(`Insufficient stock for product: ${item.name} (Available: ${totalAvailable})`)
                }

                for (const batch of batches) {
                    if (remainingQty <= 0.0001) break

                    const deduct = Math.min(batch.quantity, remainingQty)

                    // Avoid negative zero or micro-values
                    if (deduct <= 0) continue

                    const newBatchQty = batch.quantity - deduct
                    console.log(`[Stock Update] Product: ${item.name}, Batch: ${batch.batchNumber}, Deducting: ${deduct}, OldQty: ${batch.quantity}, NewQty: ${newBatchQty}`)

                    await tx.productBatch.update({
                        where: { id: batch.id },
                        data: { quantity: Math.max(0, newBatchQty) }
                    })

                    remainingQty -= deduct
                }
            }

            return sale
        }, {
            maxWait: 5000, // default: 2000
            timeout: 20000 // default: 5000
        })

        return NextResponse.json({ success: true, invoice: result })
    } catch (error: any) {
        console.error(error)
        return NextResponse.json({ error: error.message || 'Failed to process sale' }, { status: 400 })
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'day'
    const date = searchParams.get('date')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const paymentMode = searchParams.get('paymentMode')

    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let supermarketId
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as any
        supermarketId = decoded.supermarketId
    } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

    const where: any = {
        supermarketId
    }

    // Payment Mode Filter
    if (paymentMode && paymentMode !== 'ALL') {
        where.paymentMode = paymentMode
    }

    // Date Filter
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()

    if (period === 'day') {
        if (date) startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
    } else if (period === 'month') {
        if (month) startDate = new Date(`${month}-01`)
        else startDate.setDate(1) // Start of current month
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0) // Last day of month
        endDate.setHours(23, 59, 59, 999)
    } else if (period === 'year') {
        if (year) startDate = new Date(`${year}-01-01`)
        else startDate.setMonth(0, 1) // Start of current year
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date(startDate)
        endDate.setFullYear(endDate.getFullYear() + 1)
        endDate.setDate(0)
        endDate.setHours(23, 59, 59, 999)
    } else if (period === 'custom' && from && to) {
        startDate = new Date(from)
        endDate = new Date(to)
        endDate.setHours(23, 59, 59, 999)
    }

    where.date = {
        gte: startDate,
        lte: endDate
    }

    try {
        const sales = await prisma.sale.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                cashier: {
                    select: { name: true }
                },
                customer: {
                    select: { name: true, flatNumber: true }
                }
            },
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json(sales)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
