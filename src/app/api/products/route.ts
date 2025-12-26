import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

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

    const products = await prisma.product.findMany({
        where: { supermarketId },
        orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(products)
}

import { z } from 'zod'

const createProductSchema = z.object({
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
        const body = await request.json()
        const validation = createProductSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Validation Error', details: validation.error.flatten() }, { status: 400 })
        }

        const data = validation.data

        const product = await prisma.product.create({
            data: {
                supermarketId,
                name: data.name,
                barcode: data.barcode,
                category: data.category || 'General',
                brand: data.brand || '',
                unit: data.unit,
                costPrice: data.costPrice,
                sellingPrice: data.sellingPrice,
                taxPercent: data.taxPercent,
                minStockLevel: data.minStockLevel
            }
        })
        return NextResponse.json({ success: true, product })
    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'Product with this barcode already exists' }, { status: 409 })
        }
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
