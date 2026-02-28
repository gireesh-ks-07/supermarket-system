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

    // Use raw query to ensure we get the costPrice/sellingPrice even if Prisma client is stale
    const batches = await prisma.$queryRaw`
        SELECT 
            b.*,
            p.name as "productName",
            p.unit as "productUnit",
            p.barcode as "productBarcode"
        FROM "ProductBatch" b
        JOIN "Product" p ON b."productId" = p.id
        WHERE p."supermarketId" = ${supermarketId}
        ORDER BY b."expiryDate" ASC
    ` as any[]

    // Map to expected format for frontend
    const formattedBatches = batches.map(b => {
        // Ensure we handle Decimal strings from Postgres
        const { productName, productUnit, productBarcode, ...rest } = b;
        return {
            ...rest,
            costPrice: b.costPrice ? Number(b.costPrice) : 0,
            sellingPrice: b.sellingPrice ? Number(b.sellingPrice) : 0,
            quantity: Number(b.quantity),
            product: {
                name: b.productName,
                unit: b.productUnit,
                barcode: b.productBarcode
            }
        };
    })

    return NextResponse.json(formattedBatches)
}

const addStockSchema = z.object({
    productId: z.string().min(1),
    batchNumber: z.string().min(1),
    quantity: z.coerce.number().gt(0), // Allow decimals and anything > 0
    expiryDate: z.string().optional().nullable(),
    costPrice: z.union([z.number(), z.string(), z.null().optional()]),
    sellingPrice: z.union([z.number(), z.string(), z.null().optional()])
})

export async function POST(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const validation = addStockSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Validation Error', details: validation.error.flatten() }, { status: 400 })
        }

        const { productId, batchNumber, quantity, expiryDate } = validation.data

        // Manual price parsing to handle "" -> product default
        const rawCost = body.costPrice;
        const rawSell = body.sellingPrice;

        // Verify product owner
        const product = await prisma.product.findUnique({ where: { id: productId } })
        if (!product || product.supermarketId !== supermarketId) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const finalCost = (rawCost !== undefined && rawCost !== null && rawCost !== '') ? Number(rawCost) : Number(product.costPrice)
        const finalSell = (rawSell !== undefined && rawSell !== null && rawSell !== '') ? Number(rawSell) : Number(product.sellingPrice)

        // Robust date parsing
        const finalDate = expiryDate && expiryDate.trim() !== '' ? new Date(expiryDate) : null

        const batchId = crypto.randomUUID()
        await prisma.$executeRaw`
            INSERT INTO "ProductBatch" (id, "productId", "batchNumber", quantity, "expiryDate", "costPrice", "sellingPrice", "updatedAt") 
            VALUES (${batchId}, ${productId}, ${batchNumber}, ${Number(quantity)}, ${finalDate && !isNaN(finalDate.getTime()) ? finalDate : null}, ${finalCost}, ${finalSell}, NOW())
        `

        const batch = {
            id: batchId,
            productId,
            batchNumber,
            quantity: Number(quantity),
            expiryDate: (finalDate && !isNaN(finalDate.getTime())) ? finalDate : null,
            costPrice: finalCost,
            sellingPrice: finalSell
        }

        return NextResponse.json(batch)
    } catch (e: any) {
        console.error("BATCH_CREATE_ERROR:", e)
        return NextResponse.json({
            error: 'Failed to add stock',
            details: e.message,
            code: e.code
        }, { status: 500 })
    }
}
// Update Schema
const updateStockSchema = z.object({
    id: z.string().min(1),
    quantity: z.coerce.number().min(0),
    expiryDate: z.string().optional().nullable(),
    costPrice: z.union([z.number(), z.string(), z.null().optional()]),
    sellingPrice: z.union([z.number(), z.string(), z.null().optional()])
})

export async function PUT(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const validation = updateStockSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Validation Error' }, { status: 400 })
        }

        const { id, quantity, expiryDate } = validation.data
        const rawCost = body.costPrice;
        const rawSell = body.sellingPrice;

        // Verify ownership via product
        const batch = await (prisma.productBatch as any).findUnique({
            where: { id },
            include: { product: true }
        })

        if (!batch || batch.product.supermarketId !== supermarketId) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
        }

        const finalDate = expiryDate && expiryDate.trim() !== '' ? new Date(expiryDate) : null

        const finalCost = (rawCost !== undefined && rawCost !== null && rawCost !== '') ? Number(rawCost) : batch.costPrice
        const finalSell = (rawSell !== undefined && rawSell !== null && rawSell !== '') ? Number(rawSell) : batch.sellingPrice

        await prisma.$executeRaw`
            UPDATE "ProductBatch" 
            SET quantity = ${Number(quantity)}, "expiryDate" = ${finalDate && !isNaN(finalDate.getTime()) ? finalDate : null}, "costPrice" = ${finalCost}, "sellingPrice" = ${finalSell}, "updatedAt" = NOW() 
            WHERE id = ${id}
        `

        const updated = {
            id,
            quantity: Number(quantity),
            expiryDate: (finalDate && !isNaN(finalDate.getTime())) ? finalDate : null,
            costPrice: finalCost,
            sellingPrice: finalSell
        }

        return NextResponse.json(updated)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    try {
        // Verify ownership
        const batch = await prisma.productBatch.findUnique({
            where: { id },
            include: { product: true }
        })

        if (!batch || batch.product.supermarketId !== supermarketId) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
        }

        await prisma.productBatch.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 })
    }
}
