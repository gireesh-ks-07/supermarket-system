import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

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

    const purchases = await prisma.purchase.findMany({
        where: { supermarketId },
        include: {
            supplier: { select: { name: true } },
            items: { include: { product: { select: { name: true, unit: true } } } },
            _count: { select: { items: true } } // Quick count
        },
        orderBy: { date: 'desc' }
    })

    return NextResponse.json(purchases)
}

const purchaseSchema = z.object({
    supplierId: z.string().min(1, 'Supplier is required'),
    invoiceNumber: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().min(1),
        quantity: z.number().min(1),
        costPrice: z.number().min(0),
        taxAmount: z.number().optional().default(0),
        total: z.number()
    })).min(1, 'At least one item required'),
    status: z.enum(['PENDING', 'RECEIVED']).optional().default('PENDING')
})

export async function POST(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const validation = purchaseSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Validation Error', details: validation.error.flatten() }, { status: 400 })
        }

        const { supplierId, invoiceNumber, items, status } = validation.data
        const totalAmount = items.reduce((acc, item) => acc + item.total, 0)

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase Record
            const purchase = await tx.purchase.create({
                data: {
                    supermarketId,
                    supplierId,
                    invoiceNumber,
                    totalAmount,
                    status,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                            taxAmount: item.taxAmount,
                            total: item.total
                        }))
                    }
                }
            })

            // 2. If status is RECEIVED, create batches immediately
            if (status === 'RECEIVED') {
                for (const item of items) {
                    const batchNum = `PO-${purchase.id.slice(0, 8)}-${Date.now().toString().slice(-4)}`
                    await tx.productBatch.create({
                        data: {
                            productId: item.productId,
                            purchaseId: purchase.id,
                            batchNumber: batchNum,
                            quantity: item.quantity,
                            expiryDate: null
                        }
                    })
                }
            }

            return purchase
        })

        return NextResponse.json(result)
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id, action } = body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        if (action === 'receive') {
            const purchase = await prisma.purchase.findUnique({
                where: { id, supermarketId },
                include: { items: true }
            })

            if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
            if (purchase.status === 'RECEIVED') return NextResponse.json({ error: 'Already received' }, { status: 400 })

            // Transaction: Update status -> Create batches
            await prisma.$transaction(async (tx) => {
                await tx.purchase.update({
                    where: { id },
                    data: { status: 'RECEIVED' }
                })

                for (const item of purchase.items) {
                    const batchNum = `PO-${purchase.id.slice(0, 8)}-${Date.now().toString().slice(-4)}`
                    await tx.productBatch.create({
                        data: {
                            productId: item.productId,
                            purchaseId: purchase.id,
                            batchNumber: batchNum,
                            quantity: item.quantity,
                            expiryDate: null
                        }
                    })
                }
            })

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
    }
}
