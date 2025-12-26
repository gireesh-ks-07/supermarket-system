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

        const { items, paymentMode } = await request.json()

        if (!items || items.length === 0) return NextResponse.json({ error: 'Empty cart' }, { status: 400 })

        const totalAmount = items.reduce((acc: number, item: any) => acc + item.total, 0)

        const result = await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.create({
                data: {
                    supermarketId: user.supermarketId,
                    cashierId: user.userId,
                    invoiceNumber: `INV-${Date.now()}`,
                    paymentMode,
                    subTotal: totalAmount,
                    taxTotal: totalAmount * 0.1, // Dummy tax logic
                    totalAmount: totalAmount * 1.1,
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
                    if (remainingQty <= 0) break

                    const deduct = Math.min(batch.quantity, remainingQty)

                    await tx.productBatch.update({
                        where: { id: batch.id },
                        data: { quantity: { decrement: deduct } }
                    })

                    remainingQty -= deduct
                }
            }

            return sale
        })

        return NextResponse.json({ success: true, invoice: result })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 })
    }
}
