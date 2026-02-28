
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const SECRET_KEY = JWT_SECRET || 'super-secret-key-v2'

export async function GET(request: Request) {
    try {
        // Auth check
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let user
        try {
            user = jwt.verify(token, SECRET_KEY) as any
        } catch (e) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

        // 1. Get all customers with a flat number
        const customers = await prisma.customer.findMany({
            where: {
                supermarketId: user.supermarketId,
                flatNumber: { not: null }
            },
            select: {
                id: true,
                name: true,
                flatNumber: true,
                phone: true
            },
            orderBy: { flatNumber: 'asc' }
        })

        if (!customers.length) {
            return new NextResponse('Flat Name,Amount Paid,Amount Not Paid\nNo Data,0,0', {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="credit_report_${new Date().toISOString().split('T')[0]}.csv"`
                }
            })
        }

        const customerIds = customers.map(c => c.id)

        // 2. Get Total Credit Sales per customer
        const creditSalesGroup = await prisma.sale.groupBy({
            by: ['customerId'],
            where: {
                supermarketId: user.supermarketId,
                customerId: { in: customerIds },
                paymentMode: 'CREDIT'
            },
            _sum: {
                totalAmount: true
            }
        })

        // 3. Get Total Payments per customer
        const paymentsGroup = await prisma.payment.groupBy({
            by: ['customerId'],
            where: {
                supermarketId: user.supermarketId,
                customerId: { in: customerIds }
            },
            _sum: {
                amount: true
            }
        })

        // 4. Map to easy lookup
        const creditMap = new Map<string, number>()
        creditSalesGroup.forEach(item => {
            if (item.customerId) {
                creditMap.set(item.customerId, Number(item._sum.totalAmount || 0))
            }
        })

        const paymentMap = new Map<string, number>()
        paymentsGroup.forEach(item => {
            if (item.customerId) {
                paymentMap.set(item.customerId, Number(item._sum.amount || 0))
            }
        })

        // 5. Filter for Pending Dues if requested
        const searchParams = new URL(request.url).searchParams
        const onlyDue = searchParams.get('onlyDue') === 'true'

        // 6. Generate CSV Content
        // Header matches UI: Flat Number, Customer Name, Lifetime Credit, Paid, Balance Due
        let csvContent = 'Flat Number,Customer Name,Lifetime Credit,Paid,Balance Due\n'

        customers.forEach(customer => {
            const totalCredit = creditMap.get(customer.id) || 0
            const totalPaid = paymentMap.get(customer.id) || 0
            const balance = totalCredit - totalPaid

            if (onlyDue && balance <= 0) return

            const flatNum = `"${(customer.flatNumber || '').replace(/"/g, '""')}"`
            const custName = `"${(customer.name || '').replace(/"/g, '""')}"`

            csvContent += `${flatNum},${custName},${totalCredit.toFixed(2)},${totalPaid.toFixed(2)},${balance.toFixed(2)}\n`
        })

        if (csvContent.split('\n').length <= 2 && onlyDue) {
            csvContent += 'No,Accounts,With,Pending,Dues\n'
        }

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="credit_summary_${onlyDue ? 'pending_' : ''}${new Date().toISOString().split('T')[0]}.csv"`
            }
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
