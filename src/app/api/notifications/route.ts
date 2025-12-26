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

    // 1. Run Dynamic Checks
    // Check Low Stock
    const lowStockBatches = await prisma.productBatch.findMany({
        where: {
            product: { supermarketId },
            quantity: { lt: 10 }
        },
        include: { product: true }
    })

    // Check Expiring Soon (30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringBatches = await prisma.productBatch.findMany({
        where: {
            product: { supermarketId },
            expiryDate: {
                not: null,
                lte: thirtyDaysFromNow,
                gte: new Date()
            }
        },
        include: { product: true }
    })

    // 2. Upsert Notifications
    // We use a unique key logic: 'LOW_STOCK_{batchId}' or 'EXPIRY_{batchId}'
    // Actually, simple upsert might be hard without a unique constraint in DB on a custom key.
    // Instead, we can check if a similar unread notification exists.

    // Helper to create if not exists
    const createIfNotExists = async (title: string, message: string, type: string, link: string) => {
        // Check if recent unread notification with same title exists
        const existing = await prisma.notification.findFirst({
            where: {
                supermarketId,
                title,
                isRead: false
            }
        })

        if (!existing) {
            await prisma.notification.create({
                data: {
                    supermarketId,
                    title,
                    message,
                    type,
                    link
                }
            })
        }
    }

    // Process Low Stock
    if (lowStockBatches.length > 0) {
        await createIfNotExists(
            'Low Stock Alert',
            `${lowStockBatches.length} batches are running low on stock (< 10 units).`,
            'WARNING',
            '/dashboard/stock'
        )
    }

    // Process Expiry
    if (expiringBatches.length > 0) {
        await createIfNotExists(
            'Expiry Warning',
            `${expiringBatches.length} batches are expiring within 30 days.`,
            'WARNING',
            '/dashboard/stock'
        )
    }

    // 3. Update Fetch
    const notifications = await prisma.notification.findMany({
        where: { supermarketId, isRead: false },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notifications)
}

export async function PUT(request: Request) {
    const supermarketId = await getSupermarketId()
    if (!supermarketId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { id } = body

        if (id) {
            // Mark single as read
            await prisma.notification.update({
                where: { id },
                data: { isRead: true }
            })
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { supermarketId, isRead: false },
                data: { isRead: true }
            })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}
