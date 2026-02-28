import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

async function getUser(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return null
        return jwt.verify(token, JWT_SECRET) as any
    } catch (e) {
        return null
    }
}

async function revertStock(tx: any, saleItem: any) {
    const returnQty = saleItem.quantity
    const productId = saleItem.productId

    // Find the batches for this product
    const batches = await tx.productBatch.findMany({
        where: { productId },
        orderBy: { expiryDate: 'asc' }
    })

    if (batches.length > 0) {
        // Add back to the first batch
        // In a more complex system we might distribute, but for now this restores the total stock
        await tx.productBatch.update({
            where: { id: batches[0].id },
            data: { quantity: { increment: returnQty } }
        })
    } else {
        // If no batch exists, create a default one to hold the returned stock
        await tx.productBatch.create({
            data: {
                productId,
                batchNumber: 'RESTORED',
                quantity: returnQty,
                expiryDate: null
            }
        })
    }
}

async function deductStock(tx: any, productId: string, quantity: number, productName: string) {
    let remainingQty = quantity

    const batches = await tx.productBatch.findMany({
        where: {
            productId,
            quantity: { gt: 0 }
        },
        orderBy: { expiryDate: 'asc' }
    })

    let totalAvailable = batches.reduce((acc: number, b: any) => acc + b.quantity, 0)
    if (totalAvailable < remainingQty) {
        throw new Error(`Insufficient stock for product: ${productName} (Available: ${totalAvailable})`)
    }

    for (const batch of batches) {
        if (remainingQty <= 0.0001) break

        const deduct = Math.min(batch.quantity, remainingQty)
        if (deduct <= 0) continue

        await tx.productBatch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deduct } }
        })

        remainingQty -= deduct
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: saleId } = await params

        await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({
                where: { id: saleId, supermarketId: user.supermarketId },
                include: { items: true }
            })

            if (!sale) throw new Error('Sale not found')

            // 1. Revert Stock
            for (const item of sale.items) {
                await revertStock(tx, item)
            }

            // 2. Delete Items
            await tx.saleItem.deleteMany({
                where: { saleId }
            })

            // 3. Delete Sale
            await tx.sale.delete({
                where: { id: saleId }
            })
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete sale error:', error)
        return NextResponse.json({ error: error.message || 'Failed to delete sale' }, { status: 400 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: saleId } = await params
        const body = await request.json()
        const { items, paymentMode, subTotal, taxTotal, totalAmount, customerId, customer } = body

        await prisma.$transaction(async (tx) => {
            const existingSale = await tx.sale.findUnique({
                where: { id: saleId, supermarketId: user.supermarketId },
                include: { items: { include: { product: true } } }
            })

            if (!existingSale) throw new Error('Sale not found')
            // If customer info is provided, find or create the customer
            let finalCustomerId = existingSale.customerId
            if (customer) {
                const { name, flatNumber, phone } = customer
                if (name || flatNumber || phone) {
                    const existingCust = await tx.customer.findFirst({
                        where: {
                            supermarketId: user.supermarketId,
                            OR: [
                                ...(flatNumber ? [{ flatNumber }] : []),
                                ...(name ? [{ name }] : [])
                            ].filter(Boolean) as any[]
                        }
                    })

                    if (existingCust) {
                        finalCustomerId = existingCust.id
                        // Update phone if needed
                        if (phone && existingCust.phone !== phone) {
                            await tx.customer.update({
                                where: { id: finalCustomerId },
                                data: { phone }
                            })
                        }
                    } else {
                        // Create novel customer mapping
                        const newCust = await tx.customer.create({
                            data: {
                                supermarketId: user.supermarketId,
                                name: name || (flatNumber ? `Flat ${flatNumber}` : 'Walk-in Customer'),
                                flatNumber: flatNumber || null,
                                phone: phone || null
                            }
                        })
                        finalCustomerId = newCust.id
                    }
                } else if (existingSale.paymentMode !== 'CREDIT') {
                    finalCustomerId = null // Clear customer if they wiped the text and it's not credit
                }
            }

            // 1. If items are provided, handle stock update
            if (items) {
                // Revert OLD stock
                for (const oldItem of existingSale.items) {
                    await revertStock(tx, oldItem)
                }

                // Delete old items
                await tx.saleItem.deleteMany({
                    where: { saleId }
                })

                // Create NEW items and deduct stock
                for (const newItem of items) {
                    await tx.saleItem.create({
                        data: {
                            saleId,
                            productId: newItem.productId || newItem.id, // Support both formats
                            quantity: newItem.quantity,
                            unitPrice: newItem.unitPrice || newItem.sellingPrice,
                            taxAmount: newItem.taxAmount || 0,
                            total: newItem.total
                        }
                    })

                    const productName = newItem.product?.name || newItem.name || 'Product'
                    await deductStock(tx, newItem.productId || newItem.id, newItem.quantity, productName)
                }
            }

            // 2. Update Sale Details
            await tx.sale.update({
                where: { id: saleId },
                data: {
                    paymentMode: paymentMode || existingSale.paymentMode,
                    subTotal: subTotal !== undefined ? subTotal : existingSale.subTotal,
                    taxTotal: taxTotal !== undefined ? taxTotal : existingSale.taxTotal,
                    totalAmount: totalAmount !== undefined ? totalAmount : existingSale.totalAmount,
                    customerId: finalCustomerId,
                    // If changed to CREDIT, might need to track original
                    originalPaymentMode: paymentMode === 'CREDIT' ? 'CREDIT' : existingSale.originalPaymentMode
                }
            })
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Update sale error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update sale' }, { status: 400 })
    }
}
