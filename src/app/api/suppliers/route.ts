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

    try {
        const suppliers = await prisma.supplier.findMany({
            where: { supermarketId },
            orderBy: { name: 'asc' }
        })

        // Fetch balances using raw SQL to bypass Prisma model mismatches/caching issues
        const balances: any[] = await prisma.$queryRaw`
            SELECT "supplierId", 
                   CAST(SUM("totalAmount") AS FLOAT) as "totalAmount", 
                   CAST(SUM("paidAmount") AS FLOAT) as "paidAmount"
            FROM "Purchase"
            WHERE "supermarketId" = ${supermarketId} AND "status" != 'CANCELLED'
            GROUP BY "supplierId"
        `

        const suppliersWithBalance = suppliers.map(s => {
            const balance = balances.find(b => b.supplierId === s.id)
            const total = Number(balance?.totalAmount || 0)
            const paid = Number(balance?.paidAmount || 0)

            return {
                ...s,
                totalOwed: total - paid
            }
        })

        return NextResponse.json(suppliersWithBalance)
    } catch (e: any) {
        console.error("SUPPLIERS_GET_ERROR:", e)
        return NextResponse.json({ error: 'Failed to fetch suppliers', details: e.message }, { status: 500 })
    }
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

        // Ensure ownership
        const existing = await prisma.supplier.findUnique({
            where: { id }
        })

        if (!existing || existing.supermarketId !== supermarketId) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        const supplier = await prisma.supplier.update({
            where: { id },
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
        // Ensure ownership
        const existing = await prisma.supplier.findUnique({
            where: { id }
        })

        if (!existing || existing.supermarketId !== supermarketId) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        await prisma.supplier.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (e: any) {
        // P2003 is the Prisma error code for foreign key constraint violation
        if (e.code === 'P2003') {
            return NextResponse.json({
                error: 'Cannot delete supplier. They have associated purchase records. Please deactivate them instead.'
            }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to delete supplier', details: e.message }, { status: 500 })
    }
}
