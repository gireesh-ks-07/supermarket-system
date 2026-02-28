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
    } catch {
        return null
    }
}

const stockImportSchema = z.object({
    barcode: z.string().min(1),
    batchNumber: z.string().optional(),
    quantity: z.coerce.number().optional().default(0),
    expiryDate: z.string().optional().nullable(),
    costPrice: z.coerce.number().optional(),
    sellingPrice: z.coerce.number().optional()
})

export async function POST(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const items = Array.isArray(body) ? body : [body]

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        // Helper to normalize keys (remove BOM, trim)
        const normalizeKeys = (obj: any) => {
            const newObj: any = {}
            Object.keys(obj).forEach(key => {
                const cleanKey = key.trim().replace(/^[\uFEFF]/, '')
                newObj[cleanKey] = obj[key]
            })
            return newObj
        }

        // Get all products map for quick lookup
        const products = await prisma.product.findMany({
            where: { supermarketId },
            select: { id: true, barcode: true, name: true, costPrice: true, sellingPrice: true }
        })
        const productMap = new Map(products.map(p => [p.barcode, p]))

        for (const rawItem of items) {
            const item = normalizeKeys(rawItem)
            try {
                // Parse and validate
                const data = stockImportSchema.parse(item)
                const product = productMap.get(data.barcode)

                if (!product) {
                    results.failed++
                    results.errors.push(`Product not found for barcode: ${data.barcode}`)
                    continue
                }

                // Check if batch exists if batchNumber is provided
                let existingBatch = null
                if (data.batchNumber) {
                    existingBatch = await prisma.productBatch.findFirst({
                        where: {
                            productId: product.id,
                            batchNumber: data.batchNumber
                        }
                    })
                }

                if (existingBatch) {
                    // Update existing batch
                    await (prisma.productBatch as any).update({
                        where: { id: existingBatch.id },
                        data: {
                            quantity: { increment: data.quantity },
                            costPrice: data.costPrice !== undefined ? data.costPrice : (existingBatch as any).costPrice,
                            sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : (existingBatch as any).sellingPrice
                        }
                    })
                } else {
                    // Create Batch
                    const finalBatchNumber = data.batchNumber || `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`

                    await (prisma.productBatch as any).create({
                        data: {
                            productId: product.id,
                            batchNumber: finalBatchNumber,
                            quantity: data.quantity,
                            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                            costPrice: data.costPrice !== undefined ? data.costPrice : Number(product.costPrice),
                            sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : Number(product.sellingPrice)
                        }
                    })
                }

                results.success++
            } catch (err: any) {
                results.failed++
                if (err instanceof z.ZodError) {
                    const zodErr = err as z.ZodError
                    const message = zodErr.issues[0]?.message || 'Validation failed'
                    const keys = Object.keys(item).join(', ')
                    results.errors.push(`Validation error (Batch ${item.batchNumber || 'Unknown'}): ${message}. keys received: [${keys}], item: ${JSON.stringify(item)}`)
                } else {
                    results.errors.push(`Error (Batch ${item.batchNumber || 'Unknown'}): ${err.message}`)
                }
            }
        }

        return NextResponse.json({
            success: true,
            imported: results.success,
            failed: results.failed,
            errors: results.errors
        })

    } catch (e: any) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
