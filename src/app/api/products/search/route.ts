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
    const lowerQ = `%${q.toLowerCase()}%`

    // Use raw query for maximum reliability and performance
    const results = await prisma.$queryRaw`
        SELECT 
            p.id, 
            p.name as "baseName", 
            p.barcode, 
            p."taxPercent", 
            p.unit, 
            p."costPrice" as "prodCost", 
            p."sellingPrice" as "prodSell",
            b.id as "batchId",
            b."batchNumber",
            b.quantity as "batchQty",
            b."costPrice" as "batchCost",
            b."sellingPrice" as "batchSell",
            b."expiryDate"
        FROM "Product" p
        LEFT JOIN "ProductBatch" b ON p.id = b."productId" AND b.quantity > 0 AND (b."expiryDate" IS NULL OR b."expiryDate" >= CURRENT_DATE)
        WHERE p."supermarketId" = ${supermarketId}
        AND (LOWER(p.name) LIKE LOWER(${lowerQ}) OR p.barcode LIKE ${lowerQ})
        AND b.id IS NOT NULL -- Only show products with active, non-expired batches
        ORDER BY p.name ASC, b."expiryDate" ASC
        LIMIT 20
    ` as any[]

    const formattedResults = results.map(r => {
        // Robust price selection (Postgres can return null for batch fields in LEFT JOIN)
        const sellingPrice = (r.batchSell !== null && r.batchSell !== undefined) ? Number(r.batchSell) : Number(r.prodSell)
        const costPrice = (r.batchCost !== null && r.batchCost !== undefined) ? Number(r.batchCost) : Number(r.prodCost)

        return {
            id: r.id,
            barcode: r.barcode,
            unit: r.unit,
            taxPercent: Number(r.taxPercent),
            name: r.baseName,
            batchId: r.batchId,
            batchNumber: r.batchNumber,
            stock: r.batchId ? Number(r.batchQty) : 0,
            sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
            costPrice: isNaN(costPrice) ? 0 : costPrice,
            expiryDate: r.expiryDate
        }
    })

    return NextResponse.json(formattedResults)
}
