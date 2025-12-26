'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Bell, User, X, Check, Menu } from 'lucide-react'
import { Button } from './ui/Button'
import useSWR, { mutate } from 'swr'
import { useUser } from '@/hooks/useUser'

type Notification = {
    id: string
    title: string
    message: string
    type: 'WARNING' | 'INFO' | 'SUCCESS'
    link: string | null
    createdAt: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const router = useRouter()
    const { user } = useUser()
    const { data: notifications } = useSWR<Notification[]>('/api/notifications', fetcher, { refreshInterval: 60000 })
    const [isOpen, setIsOpen] = useState(false)

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
    }

    const handleNotificationClick = async (n: Notification) => {
        await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id })
        })
        mutate('/api/notifications')
        setIsOpen(false)

        if (n.link) {
            router.push(n.link)
        }
    }

    const markAllRead = async () => {
        await fetch('/api/notifications', { method: 'PUT', body: JSON.stringify({}) })
        mutate('/api/notifications')
    }

    return (
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 glass-panel m-4 mb-0 rounded-2xl relative z-40">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Menu size={20} />
                </button>
                <span className="text-sm text-slate-400 hidden sm:inline">Welcome back, <span className="text-white font-medium">{user?.name}</span></span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 text-slate-400 hover:text-white transition-colors relative"
                    >
                        <Bell size={20} />
                        {notifications && notifications.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>

                    {isOpen && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-[#1a1c23] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="text-sm font-bold text-white">Notifications</h3>
                                {notifications && notifications.length > 0 && (
                                    <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                                        <Check size={12} /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications && notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-xs font-bold ${n.type === 'WARNING' ? 'text-orange-400' : 'text-blue-400'}`}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs text-slate-300 line-clamp-2">{n.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 text-xs">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}

                <div className="h-8 w-[1px] bg-white/10" />

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <Button variant="secondary" onClick={handleLogout} className="text-xs py-1 px-3 h-8">
                        <LogOut size={14} className="sm:mr-1" /> <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}
