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

export async function GET(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    try {
        if (id) {
            const purchases = await prisma.$queryRawUnsafe(
                `SELECT p.*, s.name as "supplierName"
                 FROM "Purchase" p
                 JOIN "Supplier" s ON p."supplierId" = s.id
                 WHERE p.id = $1 AND p."supermarketId" = $2`,
                id, supermarketId
            ) as any[]

            if (!purchases.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
            const purchase = purchases[0]

            const items = await prisma.$queryRawUnsafe(
                `SELECT pi.*, pr.name as "productName", pr.barcode
                 FROM "PurchaseItem" pi
                 JOIN "Product" pr ON pi."productId" = pr.id
                 WHERE pi."purchaseId" = $1`,
                id
            ) as any[]

            return NextResponse.json({
                ...purchase,
                supplier: { name: purchase.supplierName },
                items: items.map(it => ({
                    ...it,
                    quantity: Number(it.quantity),
                    costPrice: Number(it.costPrice),
                    sellingPrice: it.sellingPrice ? Number(it.sellingPrice) : null,
                    total: Number(it.total)
                }))
            })
        }

        const purchases = await prisma.$queryRawUnsafe(
            `SELECT p.*, s.name as "supplierName",
             (SELECT COUNT(*)::INT FROM "PurchaseItem" pi WHERE pi."purchaseId" = p.id) as "itemsCount"
             FROM "Purchase" p
             JOIN "Supplier" s ON p."supplierId" = s.id
             WHERE p."supermarketId" = $1
             ORDER BY p.date DESC`,
            supermarketId
        ) as any[]

        const mappedPurchases = purchases.map(p => ({
            ...p,
            supplier: { name: p.supplierName || 'Unknown Vendor' },
            _count: { items: Number(p.itemsCount || 0) }
        }))

        return NextResponse.json(mappedPurchases)
    } catch (e: any) {
        console.error("PURCHASES_GET_ERROR:", e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

const purchaseSchema = z.object({
    supplierId: z.string().min(1, 'Supplier is required'),
    invoiceNumber: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().min(0.001),
        costPrice: z.coerce.number().min(0),
        sellingPrice: z.coerce.number().optional().nullable(),
        expiryDate: z.string().optional().nullable(),
        taxAmount: z.coerce.number().optional().default(0),
        total: z.coerce.number()
    })).min(1, 'At least one item required'),
    paidAmount: z.coerce.number().optional().default(0),
    paymentMode: z.enum(['CASH', 'UPI', 'CREDIT']).optional().default('CASH'),
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

        const { supplierId, invoiceNumber, items, status, paidAmount, paymentMode } = validation.data
        const totalAmount = items.reduce((acc, item) => acc + item.total, 0)

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase Record using RAW SQL to bypass the "Unknown Argument" Prisma error
            const id = (await import('node:crypto')).randomUUID()

            await tx.$executeRawUnsafe(
                `INSERT INTO "Purchase" ("id", "supermarketId", "supplierId", "invoiceNumber", "totalAmount", "paidAmount", "paymentMode", "status", "date")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                id, supermarketId, supplierId, invoiceNumber || '', totalAmount, paidAmount, paymentMode, status
            )

            // Correct mapping for subsequent logic
            const purchase = { id, status } as any

            // 2. Insert items using RAW SQL
            for (const item of items) {
                const itemId = (await import('node:crypto')).randomUUID()
                await tx.$executeRawUnsafe(
                    `INSERT INTO "PurchaseItem" ("id", "purchaseId", "productId", "quantity", "costPrice", "sellingPrice", "expiryDate", "taxAmount", "total")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    itemId, id, item.productId, item.quantity, item.costPrice, (item as any).sellingPrice || null,
                    item.expiryDate ? new Date(item.expiryDate) : null, (item as any).taxAmount || 0, item.total
                )
            }

            // 2. If status is RECEIVED, create batches immediately
            if (status === 'RECEIVED') {
                for (const item of items) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } })
                    const batchNum = `PO-${purchase.id.slice(0, 8)}-${Date.now().toString().slice(-4)}`

                    const finalSellingPrice = item.sellingPrice || Number(product?.sellingPrice || 0)
                    const finalExpiry = item.expiryDate ? new Date(item.expiryDate) : null

                    await tx.productBatch.create({
                        data: {
                            productId: item.productId,
                            purchaseId: purchase.id,
                            batchNumber: batchNum,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                            sellingPrice: finalSellingPrice,
                            expiryDate: finalExpiry
                        } as any
                    })

                    // If dynamic, update ALL stocks and master
                    if ((product as any)?.pricingType === 'DYNAMIC') {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                costPrice: item.costPrice,
                                sellingPrice: finalSellingPrice
                            }
                        })

                        await tx.$executeRawUnsafe(
                            `UPDATE "ProductBatch" SET "sellingPrice" = $1, "updatedAt" = NOW() 
                             WHERE "productId" = $2 AND quantity > 0 AND ("expiryDate" IS NULL OR "expiryDate" > NOW())`,
                            finalSellingPrice, item.productId
                        )
                    }
                }
            }

            return purchase
        })

        return NextResponse.json(result)
    } catch (e: any) {
        console.error("PURCHASE_CREATE_ERROR:", e)
        return NextResponse.json({ error: 'Failed to create purchase order', details: e.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id, action } = body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        if (action === 'cancel') {
            await (prisma as any).$executeRawUnsafe(
                'UPDATE "Purchase" SET "status" = $1 WHERE id = $2 AND "supermarketId" = $3',
                'CANCELLED', id, supermarketId
            )
            return NextResponse.json({ success: true })
        }

        if (action === 'receive') {
            const { items: updatedItems, paidAmount: updatedPaidAmount, paymentMode: updatedPaymentMode, invoiceNumber: updatedInvoiceNumber } = body

            const purchases = await prisma.$queryRawUnsafe(
                'SELECT * FROM "Purchase" WHERE id = $1 AND "supermarketId" = $2',
                id, supermarketId
            ) as any[]

            if (!purchases || purchases.length === 0) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
            const purchase = purchases[0]
            if (purchase.status === 'RECEIVED') return NextResponse.json({ error: 'Already received' }, { status: 400 })

            await prisma.$transaction(async (tx) => {
                // 1. If we have updated data, update the PO first
                if (updatedItems) {
                    const totalAmount = (updatedItems as any[]).reduce((acc, it) => acc + Number(it.total || 0), 0)
                    await tx.$executeRawUnsafe(
                        'UPDATE "Purchase" SET "invoiceNumber" = $1, "paidAmount" = $2, "paymentMode" = $3, "totalAmount" = $4 WHERE id = $5',
                        updatedInvoiceNumber || purchase.invoiceNumber || '', Number(updatedPaidAmount || 0),
                        updatedPaymentMode || purchase.paymentMode, totalAmount, id
                    )

                    // Refresh items: Clear old and insert new
                    await tx.$executeRawUnsafe('DELETE FROM "PurchaseItem" WHERE "purchaseId" = $1', id)
                    for (const item of updatedItems) {
                        const itemId = (await import('node:crypto')).randomUUID()
                        await tx.$executeRawUnsafe(
                            `INSERT INTO "PurchaseItem" ("id", "purchaseId", "productId", "quantity", "costPrice", "sellingPrice", "expiryDate", "taxAmount", "total")
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                            itemId, id, item.productId, Number(item.quantity), Number(item.costPrice),
                            item.sellingPrice ? Number(item.sellingPrice) : null,
                            item.expiryDate ? new Date(item.expiryDate) : null,
                            Number(item.taxAmount || 0), Number(item.total)
                        )
                    }
                }

                // 2. Mark as RECEIVED
                await tx.$executeRawUnsafe(
                    'UPDATE "Purchase" SET "status" = $1 WHERE id = $2',
                    'RECEIVED', id
                )

                // 3. Get finalized items to create batches
                const finalizedItems = await tx.$queryRawUnsafe(
                    'SELECT * FROM "PurchaseItem" WHERE "purchaseId" = $1',
                    id
                ) as any[]

                for (const item of finalizedItems) {
                    const products = await tx.$queryRawUnsafe('SELECT * FROM "Product" WHERE id = $1', item.productId) as any[]
                    const product = products[0]

                    const batchId = (await import('node:crypto')).randomUUID()
                    const batchNum = `PO-${id.slice(0, 8)}-${Date.now().toString().slice(-4)}`
                    const finalSellingPrice = item.sellingPrice ? Number(item.sellingPrice) : Number(product?.sellingPrice || 0)
                    const finalExpiry = item.expiryDate ? new Date(item.expiryDate) : null

                    await tx.$executeRawUnsafe(
                        `INSERT INTO "ProductBatch" ("id", "productId", "purchaseId", "batchNumber", "quantity", "costPrice", "sellingPrice", "expiryDate", "createdAt", "updatedAt")
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
                        batchId, item.productId, id, batchNum, Number(item.quantity), Number(item.costPrice), finalSellingPrice, finalExpiry
                    )

                    if (product?.pricingType === 'DYNAMIC') {
                        await tx.$executeRawUnsafe(
                            'UPDATE "Product" SET "costPrice" = $1, "sellingPrice" = $2, "updatedAt" = NOW() WHERE id = $3',
                            Number(item.costPrice), finalSellingPrice, item.productId
                        )
                        await tx.$executeRawUnsafe(
                            `UPDATE "ProductBatch" SET "sellingPrice" = $1, "updatedAt" = NOW() 
                             WHERE "productId" = $2 AND quantity > 0 AND ("expiryDate" IS NULL OR "expiryDate" > NOW())`,
                            finalSellingPrice, item.productId
                        )
                    }
                }
            })

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (e: any) {
        console.error("PURCHASE_UPDATE_ERROR:", e)
        return NextResponse.json({ error: 'Failed to update purchase', details: e.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    try {
        await prisma.$transaction(async (tx) => {
            // Check ownership and existence
            const purchase = await tx.purchase.findFirst({
                where: { id, supermarketId }
            })

            if (!purchase) throw new Error('Purchase not found')

            // 1. Delete associated batches (to keep inventory clean)
            await tx.productBatch.deleteMany({
                where: { purchaseId: id }
            })

            // 2. Delete associated items
            await tx.purchaseItem.deleteMany({
                where: { purchaseId: id }
            })

            // 3. Delete the purchase record
            await tx.purchase.delete({
                where: { id }
            })
        })

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("PURCHASE_DELETE_ERROR:", e)
        return NextResponse.json({ error: 'Failed to delete purchase', details: e.message }, { status: 500 })
    }
}
