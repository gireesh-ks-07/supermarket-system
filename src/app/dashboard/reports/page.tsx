'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    BarChart3, Calendar, TrendingUp, DollarSign,
    CreditCard, ShoppingBag, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Mock Data for MVP - In production this would come from an API based on `prisma.sale.groupBy`
const SALES_DATA = [
    { day: 'Mon', sales: 4200 },
    { day: 'Tue', sales: 3800 },
    { day: 'Wed', sales: 5100 },
    { day: 'Thu', sales: 4900 },
    { day: 'Fri', sales: 6200 },
    { day: 'Sat', sales: 8400 },
    { day: 'Sun', sales: 7100 },
]

export default function ReportsPage() {
    const [period, setPeriod] = useState('weekly')

    const maxSale = Math.max(...SALES_DATA.map(d => d.sales))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Analytics & Reports
                    </h1>
                    <p className="text-sm text-slate-400">Financial insights and performance metrics</p>
                </div>
                <Card className="flex items-center gap-2 p-1 bg-slate-900/50 border-slate-800">
                    {['daily', 'weekly', 'monthly'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${period === p
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </Card>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded bg-green-500/10 text-green-400">
                            <DollarSign size={20} />
                        </div>
                        <span className="flex items-center text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                            +12.5% <ArrowUpRight size={12} className="ml-1" />
                        </span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-white">{formatCurrency(12450)}</h3>
                    </div>
                </Card>

                <Card className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="flex items-center text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            +8.2% <ArrowUpRight size={12} className="ml-1" />
                        </span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Sales</p>
                        <h3 className="text-2xl font-bold text-white">1,240</h3>
                    </div>
                </Card>

                <Card className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded bg-purple-500/10 text-purple-400">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-xs text-slate-500">UPI vs Cash</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Digital Payments</p>
                        <h3 className="text-2xl font-bold text-white">68%</h3>
                    </div>
                </Card>

                <Card className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div className="p-2 rounded bg-orange-500/10 text-orange-400">
                            <TrendingUp size={20} />
                        </div>
                        <span className="flex items-center text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                            -2.4% <ArrowDownRight size={12} className="ml-1" />
                        </span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Avg. Order Value</p>
                        <h3 className="text-2xl font-bold text-white">{formatCurrency(42.50)}</h3>
                    </div>
                </Card>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-white">Revenue Overview</h3>
                        <Button variant="secondary" className="text-xs h-8">Download CSV</Button>
                    </div>

                    {/* Custom CSS Bar Chart */}
                    <div className="h-64 flex items-end justify-between gap-2">
                        {SALES_DATA.map((d) => (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-slate-800 rounded-t-sm relative group-hover:bg-purple-500/20 transition-all duration-500 overflow-hidden"
                                    style={{ height: `${(d.sales / maxSale) * 100}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                                </div>
                                <span className="text-xs text-slate-500 font-medium group-hover:text-white transition-colors">
                                    {d.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Top Products */}
                <Card className="col-span-1 p-0 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <h3 className="font-bold text-white">Top Selling Products</h3>
                    </div>
                    <div className="divide-y divide-white/5">
                        {[
                            { name: 'Matta Rice (Jaya)', sold: 420, rev: 21000 },
                            { name: 'Coconut Oil 1L', sold: 310, rev: 18500 },
                            { name: 'Milma Milk', sold: 850, rev: 8500 },
                            { name: 'Sugar 1kg', sold: 290, rev: 4350 },
                            { name: 'Green Gram', sold: 180, rev: 3600 },
                        ].map((item, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div>
                                    <p className="font-medium text-white text-sm">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.sold} units sold</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-400 text-sm">{formatCurrency(item.rev)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}
