'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Truck, Settings, Shield, X } from 'lucide-react'
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

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const { user } = useUser()

    if (!user) return null // Or skeleton

    const allowedItems = menuItems.filter(item => item.roles.includes(user.role))

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={clsx(
                    "fixed md:static inset-y-0 left-0 z-50 w-64 glass-panel m-0 md:m-4 md:mr-0 flex flex-col h-full md:h-[calc(100vh-2rem)] transition-transform duration-300 ease-in-out md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Antigravity
                        </h1>
                        <p className="text-xs text-slate-400">Supermarket OS</p>
                    </div>
                    {/* Close Button Mobile */}
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-2 md:hidden">
                    <div className="px-2 py-1 bg-white/5 rounded text-xs text-center text-slate-300">
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
                                onClick={() => onClose()} // Close on navigate (mobile)
                                className={clsx(
                                    'group flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all duration-300 border-l-[6px]',
                                    isActive
                                        ? 'bg-gradient-to-r from-purple-500/25 to-blue-500/5 border-purple-500 text-white shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]'
                                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5 hover:pl-5'
                                )}
                            >
                                <item.icon
                                    size={20}
                                    className={clsx(
                                        "transition-all duration-300",
                                        isActive ? "text-purple-400 scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "group-hover:text-purple-300"
                                    )}
                                />
                                <span className={clsx("text-sm font-medium tracking-wide", isActive && "font-semibold")}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 hidden md:block">
                    <div className="mt-2 px-2 py-1 bg-white/5 rounded text-xs text-center text-slate-300 mb-2">
                        {user.name} ({user?.role?.replace('_', ' ')})
                    </div>
                    <div className="text-xs text-center text-slate-500">
                        v1.0.0 Alpha
                    </div>
                </div>
            </aside>
        </>
    )
}
