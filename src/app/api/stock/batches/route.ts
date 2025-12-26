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

    // Fetch batches where the related product belongs to the supermarket
    const batches = await prisma.productBatch.findMany({
        where: {
            product: {
                supermarketId: supermarketId
            }
        },
        include: {
            product: {
                select: {
                    name: true,
                    unit: true
                }
            }
        },
        orderBy: { expiryDate: 'asc' } // Show expiring soon first
    })

    return NextResponse.json(batches)
}

const addStockSchema = z.object({
    productId: z.string().min(1),
    batchNumber: z.string().min(1),
    quantity: z.coerce.number().min(1),
    expiryDate: z.string().optional()
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

        // Verify product owner
        const product = await prisma.product.findUnique({ where: { id: productId } })
        if (!product || product.supermarketId !== supermarketId) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const batch = await prisma.productBatch.create({
            data: {
                productId,
                batchNumber,
                quantity,
                expiryDate: expiryDate ? new Date(expiryDate) : null
            }
        })

        return NextResponse.json(batch)
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to add stock' }, { status: 500 })
    }
}
// Update Schema
const updateStockSchema = z.object({
    id: z.string().min(1),
    quantity: z.coerce.number().min(0),
    expiryDate: z.string().optional().nullable()
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

        // Verify ownership via product
        const batch = await prisma.productBatch.findUnique({
            where: { id },
            include: { product: true }
        })

        if (!batch || batch.product.supermarketId !== supermarketId) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
        }

        const updated = await prisma.productBatch.update({
            where: { id },
            data: {
                quantity,
                expiryDate: expiryDate ? new Date(expiryDate) : null
            }
        })

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
