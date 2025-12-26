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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, barcode, category, brand, unit, costPrice, sellingPrice, taxPercent, minStockLevel } = body

    try {
        const product = await prisma.product.update({
            where: { id, supermarketId },
            data: {
                name,
                barcode,
                category,
                brand,
                unit,
                costPrice: Number(costPrice),
                sellingPrice: Number(sellingPrice),
                taxPercent: Number(taxPercent),
                minStockLevel: Number(minStockLevel)
            }
        })
        return NextResponse.json({ success: true, product })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update product' }, { status: 400 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    try {
        // Ensure the product belongs to the store
        const count = await prisma.product.count({
            where: { id, supermarketId }
        })

        if (count === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        await prisma.product.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Cannot delete product (likely used in sales)' }, { status: 400 })
    }
}
