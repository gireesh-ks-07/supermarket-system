import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let supermarketId
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        supermarketId = decoded.supermarketId
    } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

    if (!q) return NextResponse.json([])

    // MVP Optimization: Fetch all products and filter in memory to handle Case-Insensitivity reliably on SQLite
    // In production with Postgres, use { mode: 'insensitive' }
    const allProducts = await prisma.product.findMany({
        where: {
            supermarketId
        },
        include: {
            batches: true
        }
    })

    const lowerQ = q.toLowerCase()
    const products = allProducts.filter(p =>
        p.name.toLowerCase().includes(lowerQ) ||
        p.barcode.includes(lowerQ)
    ).slice(0, 10).map(p => {
        const total = p.batches.reduce((acc, b) => acc + b.quantity, 0)
        const expired = p.batches.filter(b => b.expiryDate && new Date(b.expiryDate) < new Date()).reduce((acc, b) => acc + b.quantity, 0)
        return {
            ...p,
            stock: total,
            expiredStock: expired
        }
    })

    return NextResponse.json(products)
}
