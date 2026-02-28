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

        const { items, paymentMode, flatNumber, phoneNumber } = await request.json()

        if (!items || items.length === 0) return NextResponse.json({ error: 'Empty cart' }, { status: 400 })

        const totalAmount = items.reduce((acc: number, item: any) => acc + item.total, 0)

        const result = await prisma.$transaction(async (tx) => {
            let customerId = null

            if (flatNumber) {
                // Find or create customer with this flat number OR name (since POS uses same field)
                const existingCustomer = await tx.customer.findFirst({
                    where: {
                        supermarketId: user.supermarketId,
                        OR: [
                            { flatNumber },
                            { name: flatNumber }
                        ]
                    }
                })

                if (existingCustomer) {
                    customerId = existingCustomer.id
                    // Update phone if provided and changed
                    if (phoneNumber && existingCustomer.phone !== phoneNumber) {
                        await tx.customer.update({
                            where: { id: customerId },
                            data: { phone: phoneNumber }
                        })
                    }
                } else {
                    const newCustomer = await tx.customer.create({
                        data: {
                            supermarketId: user.supermarketId,
                            flatNumber: flatNumber.includes(' ') ? null : flatNumber,
                            name: flatNumber.includes(' ') ? flatNumber : `Flat ${flatNumber}`,
                            phone: phoneNumber || null
                        }
                    })
                    customerId = newCustomer.id
                }
            } else if (phoneNumber) {
                // Customer only provided phone
                const existingByPhone = await tx.customer.findFirst({
                    where: { supermarketId: user.supermarketId, phone: phoneNumber }
                })
                if (existingByPhone) {
                    customerId = existingByPhone.id
                } else {
                    const newCustomer = await tx.customer.create({
                        data: { supermarketId: user.supermarketId, phone: phoneNumber, name: 'Guest Customer' }
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
                }
            })

            // Stock Deduction & SaleItem Creation
            for (const item of items) {
                let remainingQty = item.quantity

                // Get batches: if specific batchId provided, use it. Otherwise FIFO.
                const batches = await tx.productBatch.findMany({
                    where: {
                        productId: item.id,
                        id: item.batchId || undefined, // Filter by batchId if present
                        quantity: { gt: 0 }
                    },
                    include: { product: true },
                    orderBy: { expiryDate: 'asc' }
                })

                let totalAvailable = batches.reduce((acc: number, b: any) => acc + b.quantity, 0)
                if (totalAvailable < remainingQty) {
                    throw new Error(`Insufficient stock for product: ${item.name} (Available: ${totalAvailable})`)
                }

                for (const batch of batches) {
                    if (remainingQty <= 0.0001) break

                    const deduct = Math.min(batch.quantity, remainingQty)
                    if (deduct <= 0) continue

                    // Get the price from batch or fallback to product
                    const sellingPrice = (batch as any).sellingPrice !== null && (batch as any).sellingPrice !== undefined
                        ? Number((batch as any).sellingPrice)
                        : Number(batch.product.sellingPrice)
                    const costPrice = (batch as any).costPrice !== null && (batch as any).costPrice !== undefined
                        ? Number((batch as any).costPrice)
                        : Number(batch.product.costPrice)

                    // Create SaleItem for this specific batch using raw SQL to bypass Prisma Client sync issues
                    const itemId = Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
                    await tx.$executeRawUnsafe(
                        `INSERT INTO "SaleItem" (id, "saleId", "productId", "batchId", quantity, "unitPrice", "costPrice", "taxAmount", total) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        itemId,
                        sale.id,
                        item.id,
                        batch.id,
                        deduct,
                        sellingPrice,
                        costPrice,
                        0,
                        deduct * sellingPrice
                    )

                    const newBatchQty = (batch as any).quantity - deduct
                    await tx.productBatch.update({
                        where: { id: batch.id },
                        data: { quantity: Math.max(0, newBatchQty) }
                    })

                    remainingQty -= deduct
                }
            }

            // Recalculate Sale total if batch prices caused a change (Optional, but safer)
            const finalItems = await tx.saleItem.findMany({ where: { saleId: sale.id } })
            const finalTotal = finalItems.reduce((acc: number, i: any) => acc + Number(i.total), 0)

            if (finalTotal !== totalAmount) {
                await tx.sale.update({
                    where: { id: sale.id },
                    data: {
                        subTotal: finalTotal,
                        totalAmount: finalTotal
                    }
                })
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
        // 1. Fetch SALES
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

        // 2. Fetch PAYMENTS (Credit Settlements)
        // Adjust filter for Payments (Payment model has 'paymentMode', 'date', 'supermarketId')
        const paymentWhere = {
            supermarketId,
            date: where.date
        } as any

        if (paymentMode && paymentMode !== 'ALL') {
            paymentWhere.paymentMode = paymentMode
        }

        const payments = await prisma.payment.findMany({
            where: paymentWhere,
            include: {
                customer: {
                    select: { name: true, flatNumber: true }
                }
            },
            orderBy: { date: 'desc' }
        })

        // 3. Merge and formatting
        const formattedSales = sales.map(s => ({
            type: 'SALE',
            id: s.id,
            invoiceNumber: s.invoiceNumber,
            date: s.date,
            totalAmount: Number(s.totalAmount),
            paymentMode: s.paymentMode,
            items: s.items.map(i => ({
                id: i.id,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
                total: Number(i.total),
                product: {
                    id: i.product.id,
                    name: i.product.name,
                    barcode: i.product.barcode,
                    unit: i.product.unit
                }
            })),
            cashier: s.cashier,
            customer: s.customer
        }))

        const formattedPayments = payments.map(p => ({
            type: 'PAYMENT', // Distinguished type
            id: p.id,
            invoiceNumber: 'PAYMENT', // Placeholder
            date: p.date,
            totalAmount: Number(p.amount),
            paymentMode: p.paymentMode,
            items: [], // No items
            cashier: { name: 'System' }, // Or generally 'Admin'
            customer: p.customer,
            note: p.note
        }))

        // Combine and Sort
        const allTransactions = [...formattedSales, ...formattedPayments].sort((a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        return NextResponse.json(allTransactions)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
