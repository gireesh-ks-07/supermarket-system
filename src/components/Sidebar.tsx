'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Truck, Settings, Shield, X, Receipt, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

import { useUser } from '@/hooks/useUser'

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: ShoppingCart, label: 'POS Billing', href: '/dashboard/pos', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: Receipt, label: 'Sales History', href: '/dashboard/sales', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: Package, label: 'Products', href: '/dashboard/products', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: Truck, label: 'Stock & Suppliers', href: '/dashboard/stock', roles: ['ADMIN', 'STOCK_MANAGER', 'BILLING_STAFF'] },
    { icon: Wallet, label: 'Expenses', href: '/dashboard/expenses', roles: ['ADMIN', 'STOCK_MANAGER'] },
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
    const [isCollapsed, setIsCollapsed] = useState(false)

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
                    "fixed md:static inset-y-0 left-0 z-50 glass-panel m-0 md:m-4 md:mr-0 flex flex-col h-full md:h-[calc(100vh-2rem)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 border-r md:border border-white/10 w-64",
                    isOpen ? "translate-x-0 opacity-100 shadow-[20px_0_50px_rgba(0,0,0,0.5)]" : "-translate-x-full opacity-0 md:opacity-100",
                    isCollapsed && "md:w-20"
                )}
            >
                <div className={clsx("p-4 md:p-5 border-b border-white/5 flex items-center relative", isCollapsed ? "justify-center md:h-[73px]" : "justify-between")}>
                    <div className={clsx(isCollapsed ? "md:hidden" : "block")}>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            BeNostra
                        </h1>
                        <p className="text-[11px] text-slate-400 whitespace-nowrap">Supermarket OS</p>
                    </div>

                    {isCollapsed && (
                        <div className="hidden md:flex w-8 h-8 rounded-lg outline outline-1 outline-white/10 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 items-center justify-center text-white font-bold">
                            B
                        </div>
                    )}

                    {/* Toggle Button Desktop */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={clsx(
                            "hidden md:flex items-center justify-center text-slate-400 hover:text-white transition-all outline-none",
                            isCollapsed
                                ? "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 rounded-full border border-white/10 shadow-lg z-10 hover:bg-slate-700 hover:scale-110"
                                : "p-1 hover:bg-white/5 rounded-md"
                        )}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={20} />}
                    </button>

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

                <nav className={clsx(
                    "flex-1 py-4 px-2 space-y-1",
                    isCollapsed ? "overflow-visible" : "overflow-y-auto"
                )}>
                    {allowedItems.map((item) => {
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={(e) => {
                                    if (pathname === '/dashboard/pos' && item.href !== '/dashboard/pos') {
                                        const event = new CustomEvent('pos-nav-intent', {
                                            detail: { href: item.href },
                                            cancelable: true
                                        })
                                        window.dispatchEvent(event)
                                        if (event.defaultPrevented) {
                                            e.preventDefault()
                                            return
                                        }
                                    }
                                    onClose()
                                }}

                                className={clsx(
                                    'relative group flex items-center gap-3 py-3 transition-all duration-300 border-l-[6px]',
                                    isCollapsed ? 'px-0 justify-center rounded-xl mx-2' : 'px-4 rounded-r-xl',
                                    isActive
                                        ? 'bg-gradient-to-r from-purple-500/25 to-blue-500/5 border-purple-500 text-white shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]'
                                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5',
                                    !isCollapsed && !isActive && 'hover:pl-5'
                                )}
                            >
                                <item.icon
                                    size={20}
                                    className={clsx(
                                        "transition-all duration-300",
                                        isActive ? "text-purple-400 scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "group-hover:text-purple-300",
                                        isCollapsed && "min-w-[20px]"
                                    )}
                                />
                                <span className={clsx(
                                    "font-medium tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden",
                                    isActive && "font-semibold",
                                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 text-sm"
                                )}>
                                    {item.label}
                                </span>

                                {/* Custom Tooltip for Collapsed View */}
                                {isCollapsed && (
                                    <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-slate-800 border border-white/10 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-[100] pointer-events-none">
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-white/10 rotate-45"></div>
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 hidden md:block">
                    {!isCollapsed ? (
                        <>
                            <div className="mt-2 px-2 py-1 bg-white/5 rounded text-xs text-center text-slate-300 mb-2 truncate">
                                {user.name} ({user?.role?.replace('_', ' ')})
                            </div>
                            <div className="text-xs text-center text-slate-500">
                                v1.0.0 Alpha
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white mb-1" title={user.name}>
                                {user?.name?.[0] || 'U'}
                            </div>
                        </div>
                    )}
                </div>
            </aside >
        </>
    )
}
