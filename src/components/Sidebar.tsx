'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Truck, Settings, Shield, X } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const pathname = usePathname()
    const { user } = useUser()

    if (!user) return null

    const allowedItems = menuItems.filter(item => item.roles.includes(user.role))

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed lg:static inset-y-0 left-0 w-64 glass-panel m-4 lg:mr-0 flex flex-col h-[calc(100vh-2rem)] z-50 transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-[calc(100%+2rem)] lg:translate-x-0"
                )}
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Antigravity
                        </h1>
                        <p className="text-xs text-slate-400">Supermarket OS</p>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-2">
                    <div className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-center text-slate-300 flex items-center justify-center gap-2">
                        <Shield size={12} className="text-purple-400" />
                        <span className="truncate">{user.name} ({user?.role?.replace('_', ' ')})</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
                    {allowedItems.map((item) => {
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onClose()}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all outline-none group',
                                    isActive
                                        ? 'bg-primary/20 text-white shadow-lg shadow-purple-900/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                )}
                            >
                                <item.icon size={20} className={clsx('transition-colors', isActive ? 'text-purple-400' : 'group-hover:text-purple-300')} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="text-[10px] text-center text-slate-500 uppercase tracking-widest">
                        v1.0.0 Alpha
                    </div>
                </div>
            </aside>
        </>
    )
}
