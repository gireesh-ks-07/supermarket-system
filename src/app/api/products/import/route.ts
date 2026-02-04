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

const productImportSchema = z.object({
    name: z.string().min(1),
    barcode: z.string().min(1),
    category: z.string().optional(),
    brand: z.string().optional(),
    unit: z.string().min(1),
    costPrice: z.coerce.number().min(0),
    sellingPrice: z.coerce.number().min(0),
    taxPercent: z.coerce.number().default(0),
    minStockLevel: z.coerce.number().default(10),
})

export async function POST(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const products = await request.json()
        if (!Array.isArray(products)) {
            return NextResponse.json({ error: 'Expected an array of products' }, { status: 400 })
        }

        const validProducts = []
        const errors = []

        for (let i = 0; i < products.length; i++) {
            const validation = productImportSchema.safeParse(products[i])
            if (validation.success) {
                validProducts.push({
                    ...validation.data,
                    supermarketId,
                    category: validation.data.category || 'General',
                })
            } else {
                errors.push({ index: i, error: validation.error.flatten() })
            }
        }

        if (validProducts.length === 0) {
            return NextResponse.json({ error: 'No valid products found', details: errors }, { status: 400 })
        }

        // Use transaction for bulk creation or just loop if we want to handle individual errors
        // Prisma doesn't have a built-in "skip on error" for createMany in all DBs.
        // We'll use createMany but check for duplicates if possible, or just catch the error.

        let createdCount = 0;
        let skippedCount = 0;

        for (const prod of validProducts) {
            try {
                await prisma.product.create({ data: prod })
                createdCount++
            } catch (e: any) {
                if (e.code === 'P2002') {
                    // Duplicate barcode, skip
                    skippedCount++
                } else {
                    throw e
                }
            }
        }

        return NextResponse.json({
            success: true,
            created: createdCount,
            skipped: skippedCount,
            validationErrors: errors
        })

    } catch (e: any) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
