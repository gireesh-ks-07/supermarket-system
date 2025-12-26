'use client'

import React from 'react'
import useSWR from 'swr'
import { Card } from '@/components/ui/Card'
import { DollarSign, Package, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function DashboardPage() {
    const { data: stats, isLoading } = useSWR('/api/dashboard/stats', fetcher, {
        refreshInterval: 30000
    })

    const items = [
        {
            label: 'Total Sales Today',
            value: isLoading ? '...' : formatCurrency(stats?.salesToday || 0),
            icon: DollarSign,
            color: 'text-green-400',
            bg: 'bg-green-400/10'
        },
        {
            label: 'Total Products',
            value: isLoading ? '...' : stats?.products || 0,
            icon: Package,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            label: 'Monthly Sales',
            value: isLoading ? '...' : formatCurrency(stats?.monthlySales || 0),
            icon: TrendingUp,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
        {
            label: 'Low Stock Alerts',
            value: isLoading ? '...' : stats?.lowStock || 0,
            icon: AlertTriangle,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10'
        },
    ]

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, idx) => (
                    <Card key={idx} className="flex items-center gap-4 hover:bg-white/5 transition-colors">
                        <div className={`p-3 rounded-xl ${item.bg}`}>
                            <item.icon className={item.color} size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">{item.label}</p>
                            <p className="text-2xl font-bold">{item.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-96">
                    <h3 className="text-lg font-semibold mb-4">Weekly Sales</h3>
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center text-slate-500">Loading Chart...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: '#334155', opacity: 0.2 }}
                                />
                                <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                    <div className="space-y-3">
                        <div className="p-4 text-center text-slate-500">
                            No sales data available yet.
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
