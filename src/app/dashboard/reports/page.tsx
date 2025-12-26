'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    BarChart3, Calendar, TrendingUp, DollarSign,
    CreditCard, ShoppingBag, ArrowUpRight, ArrowDownRight,
    Loader2, Download
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ReportsPage() {
    const [period, setPeriod] = useState('weekly')
    const { data, isLoading, error } = useSWR(`/api/reports?period=${period}`, fetcher)

    if (error) return <div className="p-8 text-center text-red-400">Failed to load reports</div>

    const kpis = data?.kpis || { totalRevenue: 0, totalSales: 0, digitalPercent: 0, avgOrderValue: 0, revenueGrowth: 0 }
    const chartData = data?.chartData || []
    const topProducts = data?.topProducts || []
    const maxSale = chartData.length > 0 ? Math.max(...chartData.map((d: any) => d.sales)) : 1

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Analytics & Reports
                    </h1>
                    <p className="text-sm text-slate-400">Financial insights and performance metrics</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Download size={16} /> Export
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 space-y-2 relative overflow-hidden group">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-2 rounded bg-green-500/10 text-green-400">
                            <DollarSign size={20} />
                        </div>
                        <span className={`flex items-center text-xs px-1.5 py-0.5 rounded ${kpis.revenueGrowth >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {kpis.revenueGrowth >= 0 ? '+' : ''}{kpis.revenueGrowth.toFixed(1)}%
                            {kpis.revenueGrowth >= 0 ? <ArrowUpRight size={12} className="ml-1" /> : <ArrowDownRight size={12} className="ml-1" />}
                        </span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-white">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : formatCurrency(kpis.totalRevenue)}
                        </h3>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-green-500/5 group-hover:text-green-500/10 transition-colors">
                        <DollarSign size={80} />
                    </div>
                </Card>

                <Card className="p-4 space-y-2 relative overflow-hidden group">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm">Total Orders</p>
                        <h3 className="text-2xl font-bold text-white">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : kpis.totalSales}
                        </h3>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-blue-500/5 group-hover:text-blue-500/10 transition-colors">
                        <ShoppingBag size={80} />
                    </div>
                </Card>

                <Card className="p-4 space-y-2 relative overflow-hidden group">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-2 rounded bg-purple-500/10 text-purple-400">
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm">Digital Payments</p>
                        <h3 className="text-2xl font-bold text-white">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : `${kpis.digitalPercent.toFixed(0)}%`}
                        </h3>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-purple-500/5 group-hover:text-purple-500/10 transition-colors">
                        <CreditCard size={80} />
                    </div>
                </Card>

                <Card className="p-4 space-y-2 relative overflow-hidden group">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-2 rounded bg-orange-500/10 text-orange-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm">Avg. Order Value</p>
                        <h3 className="text-2xl font-bold text-white">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : formatCurrency(kpis.avgOrderValue)}
                        </h3>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-orange-500/5 group-hover:text-orange-500/10 transition-colors">
                        <TrendingUp size={80} />
                    </div>
                </Card>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-white">Revenue Overview</h3>
                        <span className="text-xs text-slate-500">Sales Trend for requested period</span>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2">
                        {isLoading ? (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : chartData.length > 0 ? (
                            chartData.map((d: any, idx: number) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-slate-800 rounded-t-sm relative group-hover:bg-purple-500/20 transition-all duration-500 overflow-hidden"
                                        style={{ height: `${(d.sales / maxSale) * 100}%`, minHeight: d.sales > 0 ? '4px' : '0px' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                                        {/* Tooltip on hover */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-slate-900 border border-slate-700 text-[10px] px-1.5 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                            {formatCurrency(d.sales)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium group-hover:text-white transition-colors truncate w-full text-center">
                                        {d.day}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded">
                                No sales data found for this period
                            </div>
                        )}
                    </div>
                </Card>

                {/* Top Products */}
                <Card className="lg:col-span-1 p-0 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <h3 className="font-bold text-white">Top Selling Products</h3>
                    </div>
                    <div className="divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">
                                <Loader2 className="animate-spin mx-auto mb-2" />
                                Calculating...
                            </div>
                        ) : topProducts.length > 0 ? (
                            topProducts.map((item: any, i: number) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-slate-500 font-mono">{item.sold} units sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-400 text-sm">{formatCurrency(item.rev)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No sales recorded yet.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
