
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

const paymentSchema = z.object({
    customerId: z.string().min(1),
    amount: z.number().positive(),
    note: z.string().optional(),
    paymentMode: z.string().optional()
})

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let user
        try {
            user = jwt.verify(token, JWT_SECRET) as any
        } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

        const body = await request.json()
        const result = paymentSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const { customerId, amount, note, paymentMode } = result.data

        // 1. Record Payment
        const payment = await prisma.payment.create({
            data: {
                supermarketId: user.supermarketId,
                customerId,
                amount,
                note,
                paymentMode: paymentMode || 'CASH'
            }
        })

        // 2. Update Invoices (Settlement Logic)
        // Find oldest CREDIT invoices
        const unpaidSales = await prisma.sale.findMany({
            where: {
                customerId,
                paymentMode: 'CREDIT',
                supermarketId: user.supermarketId
            },
            orderBy: { date: 'asc' }
        })

        let remainingPayment = Number(amount)

        for (const sale of unpaidSales) {
            if (remainingPayment <= 0) break

            const saleAmount = Number(sale.totalAmount)

            // Check if this sale is fully covered (or close enough)
            // Note: In a real system, we'd track 'balanceDue' per invoice. 
            // Here we assume 'CREDIT' means fully unpaid. 
            // If we have partial payments, we'd need a more complex system.
            // Simplified: If payment covers this invoice, switch it to PAID (new mode)

            // FIXED: We DO NOT update the original sale's payment mode. 
            // A Credit Sale is a historical record of debt.
            // The Payment record we just created serves as the credit against that debt.
            // Balance is calculated dynamically (Total Credit Sales - Total Payments).

            // if (remainingPayment >= saleAmount) {
            //     await prisma.sale.update({
            //         where: { id: sale.id },
            //         data: {
            //             paymentMode: paymentMode || 'CASH',
            //             originalPaymentMode: 'CREDIT'
            //         }
            //     })
            //     remainingPayment -= saleAmount
            // }
            // If partial, we leave it as CREDIT (simplest approach to avoid splitting invoice records)
        }

        return NextResponse.json({ success: true, payment })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
