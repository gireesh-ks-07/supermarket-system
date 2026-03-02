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

const expiredStockSchema = z.object({
    productId: z.string().min(1),
    batchId: z.string().min(1),
    quantity: z.number().gt(0),
    type: z.enum(['REPLACED', 'LOSS']),
    note: z.string().optional(),
    // For replacements
    newBatch: z.object({
        batchNumber: z.string().optional().or(z.literal('')),
        expiryDate: z.string().optional().nullable(),
        costPrice: z.coerce.number().optional(),
        sellingPrice: z.coerce.number().optional()
    }).optional()
})

export async function POST(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const validation = expiredStockSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ error: 'Validation Error', details: validation.error.flatten() }, { status: 400 })
        }

        const { productId, batchId, quantity, type, note, newBatch } = validation.data

        // 1. Verify batch exists and belongs to supermarket
        const batch = await prisma.productBatch.findUnique({
            where: { id: batchId },
            include: { product: true }
        })

        if (!batch || batch.product.supermarketId !== supermarketId) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
        }

        // Use a small epsilon for float comparison (3 decimal places precision)
        if (Number(batch.quantity.toFixed(3)) < Number(Number(quantity).toFixed(3))) {
            return NextResponse.json({ error: 'Insufficient quantity in batch' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx) => {
            // 2. Reduce quantity from original batch
            await tx.$executeRawUnsafe(
                `UPDATE "ProductBatch" SET "quantity" = ROUND(("quantity" - $1)::numeric, 3), "updatedAt" = NOW() WHERE id = $2`,
                Number(quantity), batchId
            )

            let newBatchId = null

            // 3. If REPLACED, create new batch
            if (type === 'REPLACED' && newBatch) {
                const generatedBatchNum = newBatch.batchNumber || `REP_${batch.batchNumber}_${Date.now().toString().slice(-4)}`
                const createdBatch = await tx.productBatch.create({
                    data: {
                        productId,
                        batchNumber: generatedBatchNum,
                        quantity: Number(quantity),
                        expiryDate: newBatch.expiryDate ? new Date(newBatch.expiryDate) : null,
                        costPrice: newBatch.costPrice || Number(batch.costPrice || 0),
                        sellingPrice: newBatch.sellingPrice || Number(batch.sellingPrice || 0),
                    }
                })
                newBatchId = createdBatch.id
            }

            // 4. Record the expired stock entry
            // Using Raw SQL for ExpiredStock due to intermittent Prisma object undefined issues observed in this project
            const entryId = (await import('node:crypto')).randomUUID()
            const entryStatus = type === 'REPLACED' ? 'REPLACED' : 'LOSS'

            await tx.$executeRawUnsafe(
                `INSERT INTO "ExpiredStock" ("id", "supermarketId", "productId", "batchId", "quantity", "type", "status", "newBatchId", "note", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
                entryId, supermarketId, productId, batchId, Number(quantity), type, entryStatus, newBatchId, note || ''
            )

            return { id: entryId, status: entryStatus, newBatchId }
        })

        return NextResponse.json(result)

    } catch (e: any) {
        console.error("EXPIRED_STOCK_POST_ERROR:", e)
        return NextResponse.json({ error: 'Internal Server Error', details: e.message }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(request.url)
        const typeFilter = searchParams.get('type')

        let query = `
            SELECT es.*, p.name as "productName", p.unit as "productUnit", p.barcode as "productBarcode", p."costPrice" as "productCostPrice"
            FROM "ExpiredStock" es
            JOIN "Product" p ON es."productId" = p.id
            WHERE es."supermarketId" = $1
        `
        const params = [supermarketId]

        if (typeFilter) {
            query += ` AND es."type" = $2`
            params.push(typeFilter)
        }

        query += ` ORDER BY es."createdAt" DESC`

        const entries = await prisma.$queryRawUnsafe(query, ...params) as any[]

        const mapped = entries.map(e => ({
            ...e,
            quantity: Number(Number(e.quantity).toFixed(3)),
            product: {
                name: e.productName,
                unit: e.productUnit,
                barcode: e.productBarcode,
                costPrice: Number(e.productCostPrice)
            }
        }))

        return NextResponse.json(mapped)
    } catch (e: any) {
        console.error("EXPIRED_STOCK_GET_ERROR:", e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
