'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Truck, Settings, Shield } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

import { useUser } from '@/hooks/useUser'

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: ShoppingCart, label: 'POS Billing', href: '/dashboard/pos', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: Package, label: 'Products', href: '/dashboard/products', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: Truck, label: 'Stock & Suppliers', href: '/dashboard/stock', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: BarChart3, label: 'Reports', href: '/dashboard/reports', roles: ['ADMIN', 'STOCK_MANAGER'] },
    { icon: Users, label: 'Users', href: '/dashboard/users', roles: ['ADMIN'] },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings', roles: ['ADMIN'] },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { user } = useUser()

    if (!user) return null // Or skeleton

    const allowedItems = menuItems.filter(item => item.roles.includes(user.role))

    return (
        <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="w-64 glass-panel m-4 mr-0 flex flex-col h-[calc(100vh-2rem)]"
        >
            <div className="p-6 border-b border-white/5">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Antigravity
                </h1>
                <p className="text-xs text-slate-400">Supermarket OS</p>
                <div className="mt-2 px-2 py-1 bg-white/5 rounded text-xs text-center text-slate-300">
                    {user.name} ({user?.role?.replace('_', ' ')})
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {allowedItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                isActive
                                    ? 'bg-primary/20 text-white shadow-lg shadow-purple-900/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <item.icon size={20} className={isActive ? 'text-purple-400' : ''} />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="text-xs text-center text-slate-500">
                    v1.0.0 Alpha
                </div>
            </div>
        </motion.aside>
    )
}
