import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

async function getUser(request: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        return decoded
    } catch { return null }
}

export async function GET(request: Request) {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily' // daily, weekly, monthly, yearly, custom
    const dateParam = searchParams.get('date')

    // Default to today
    let startDate = new Date()
    let endDate: Date | undefined
    const now = new Date()

    if (period === 'daily') {
        if (dateParam) startDate = new Date(dateParam)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
    } else if (period === 'weekly') {
        const start = dateParam ? new Date(dateParam) : new Date()
        // Get start of week (Sunday or Monday, depending on locale, sticking to simple Sunday here)
        startDate = new Date(start)
        startDate.setDate(start.getDate() - start.getDay()) // Sunday
        startDate.setHours(0, 0, 0, 0)

        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 7)
        endDate.setMilliseconds(-1)
    } else if (period === 'monthly') {
        const d = dateParam ? new Date(dateParam) : new Date()
        startDate = new Date(d.getFullYear(), d.getMonth(), 1)
        endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (period === 'yearly') {
        const d = dateParam ? new Date(dateParam) : new Date()
        startDate = new Date(d.getFullYear(), 0, 1)
        endDate = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
    } else if (period === 'custom') {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        if (from && to) {
            startDate = new Date(from)
            startDate.setHours(0, 0, 0, 0)
            endDate = new Date(to)
            endDate.setHours(23, 59, 59, 999)
        }
    }

    try {
        const whereClause: any = {
            supermarketId: user.supermarketId,
            date: {
                gte: startDate,
                lte: endDate
            }
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: {
                user: {
                    select: { name: true }
                }
            }
        })

        const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

        return NextResponse.json({
            expenses,
            totalAmount,
            period: { start: startDate, end: endDate }
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { title, amount, category, date, note } = body

        if (!title || !amount) {
            return NextResponse.json({ error: 'Title and Amount are required' }, { status: 400 })
        }

        const expense = await prisma.expense.create({
            data: {
                supermarketId: user.supermarketId,
                title,
                amount: Number(amount),
                category: category || 'General',
                date: date ? new Date(date) : new Date(),
                note,
                userId: user.userId
            }
        })

        return NextResponse.json(expense)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
