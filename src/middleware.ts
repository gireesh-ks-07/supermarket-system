import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-v2'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value

    // Paths that require auth
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        try {
            const secret = new TextEncoder().encode(JWT_SECRET)
            const { payload } = await jwtVerify(token, secret) as any
            const role = payload.role

            // Role Based Access Control
            const path = request.nextUrl.pathname

            // 1. Users Page - ADMIN Only
            if (path.startsWith('/dashboard/users') && role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }

            // 2. Settings - ADMIN Only
            if (path.startsWith('/dashboard/settings') && role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }

            // 3. Reports - ADMIN & STOCK_MANAGER Only (Cashier excluded)
            if (path.startsWith('/dashboard/reports') && role === 'BILLING_STAFF') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }

            // API Protection
            if (path.startsWith('/api/')) {
                const method = request.method
                const isMutation = ['POST', 'PUT', 'DELETE'].includes(method)

                // Users API - Admin Only for Mutations
                if (path.startsWith('/api/users') && isMutation && role !== 'ADMIN') {
                    return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 })
                }

                // Products/Stock/Suppliers - Admin or Manager for Mutations
                // Cashiers can only GET (Read)
                if ((path.startsWith('/api/products') || path.startsWith('/api/stock') || path.startsWith('/api/suppliers')) && isMutation) {
                    if (role === 'BILLING_STAFF') {
                        return NextResponse.json({ error: 'Unauthorized: Read only access' }, { status: 403 })
                    }
                }
            }

            return NextResponse.next()
        } catch (e) {
            // Invalid token
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Logic to prevent logged-in user from visiting login page
    if (request.nextUrl.pathname === '/') {
        if (token) {
            try {
                const secret = new TextEncoder().encode(JWT_SECRET)
                await jwtVerify(token, secret)
                return NextResponse.redirect(new URL('/dashboard', request.url))
            } catch (e) {
                // Token invalid, allow login page
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/'],
}
