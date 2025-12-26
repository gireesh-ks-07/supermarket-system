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

    const suppliers = await prisma.supplier.findMany({
        where: { supermarketId },
        orderBy: { name: 'asc' }
    })

    return NextResponse.json(suppliers)
}

const supplierSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    gstNumber: z.string().optional()
})

export async function POST(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const validation = supplierSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Validation Error', details: validation.error.flatten() }, { status: 400 })
        }

        const supplier = await prisma.supplier.create({
            data: {
                ...validation.data,
                supermarketId
            }
        })

        return NextResponse.json(supplier)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id, ...data } = body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const supplier = await prisma.supplier.update({
            where: { id, supermarketId }, // Ensure ownership
            data: data
        })

        return NextResponse.json(supplier)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    try {
        await prisma.supplier.delete({
            where: { id, supermarketId }
        })
        return NextResponse.json({ success: true })
    } catch (e) {
        // Likely foreign key constraint if they have purchases
        return NextResponse.json({ error: 'Cannot delete supplier with existing records.' }, { status: 400 })
    }
}
