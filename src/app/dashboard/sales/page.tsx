'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Filter, Calendar, CreditCard, Banknote, QrCode, FileText, ChevronRight, X, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type SaleItem = {
    id: string
    quantity: number
    unitPrice: number
    total: number
    product: {
        name: string
        barcode: string
        unit: string
    }
}

type Sale = {
    id: string
    invoiceNumber: string
    date: string
    totalAmount: number
    paymentMode: string
    items: SaleItem[]
    cashier: {
        name: string
    }
    customer?: {
        name: string
        flatNumber: string
    }
}

export default function SalesHistoryPage() {
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

    // Filters
    const [period, setPeriod] = useState('day')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
    const [paymentMode, setPaymentMode] = useState('ALL')

    // For custom period
    // const [from, setFrom] = useState('')
    // const [to, setTo] = useState('')

    const fetchSales = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('period', period)
            if (period === 'day') params.set('date', date)
            if (period === 'month') params.set('month', month)
            if (paymentMode !== 'ALL') params.set('paymentMode', paymentMode)

            const res = await fetch(`/api/sales?${params.toString()}`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setSales(data)
            } else {
                setSales([])
            }
        } catch (error) {
            console.error('Failed to fetch sales', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSales()
    }, [period, date, month, paymentMode])

    const getTotalRevenue = () => sales.reduce((acc, s) => acc + Number(s.totalAmount), 0)

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Sales History</h1>
                <Button onClick={fetchSales} variant="secondary" className="text-sm">
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">Filters:</span>
                </div>

                <div className="flex bg-white/5 rounded-lg p-1">
                    {['day', 'month', 'year'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 rounded-md text-sm transition-all ${period === p ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>

                {period === 'day' && (
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                )}

                {period === 'month' && (
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                )}

                <div className="h-6 w-px bg-white/10 mx-2" />

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">Payment:</span>
                    <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                        <option value="ALL">All Modes</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / QR</option>
                        <option value="CREDIT">Credit</option>
                    </select>
                </div>

                <div className="ml-auto flex items-center gap-2 px-4 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <span className="text-xs text-green-400 font-bold uppercase">Total Revenue</span>
                    <span className="text-lg font-bold text-green-400">{formatCurrency(getTotalRevenue())}</span>
                </div>
            </Card>

            {/* Sales List */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <Card className="flex-1 flex flex-col overflow-hidden p-0">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/5 font-medium text-slate-300 text-sm">
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-2">Invoice #</div>
                        <div className="col-span-3">Customer</div>
                        <div className="col-span-2">Payment</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-1 text-center">Action</div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-slate-500">Loading...</div>
                        ) : sales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                                <FileText size={32} className="mb-2 opacity-50" />
                                <p>No sales found for this period.</p>
                            </div>
                        ) : (
                            sales.map((sale) => (
                                <div key={sale.id} className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 items-center text-sm hover:bg-white/5 transition-colors">
                                    <div className="col-span-2 text-slate-300">
                                        <p>{new Date(sale.date).toLocaleDateString()}</p>
                                        <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="col-span-2 font-mono text-xs">{sale.invoiceNumber}</div>
                                    <div className="col-span-3">
                                        {sale.customer ? (
                                            <div>
                                                <p className="text-white">{sale.customer.name}</p>
                                                <p className="text-xs text-slate-500">{sale.customer.flatNumber}</p>
                                            </div>
                                        ) : (
                                            <span className="text-slate-500 italic">Walk-in Customer</span>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium 
                                            ${sale.paymentMode === 'CASH' ? 'bg-green-500/10 text-green-400' :
                                                sale.paymentMode === 'UPI' ? 'bg-purple-500/10 text-purple-400' :
                                                    'bg-blue-500/10 text-blue-400'}`}>
                                            {sale.paymentMode === 'CASH' && <Banknote size={12} />}
                                            {sale.paymentMode === 'UPI' && <QrCode size={12} />}
                                            {sale.paymentMode === 'CREDIT' && <CreditCard size={12} />}
                                            {sale.paymentMode}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right font-bold text-white">
                                        {formatCurrency(Number(sale.totalAmount))}
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <Button
                                            variant="secondary"
                                            className="h-8 w-8 p-0 rounded-full"
                                            onClick={() => setSelectedSale(sale)}
                                        >
                                            <ArrowUpRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Sale Detail Modal */}
            {selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl border-white/10">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="font-bold text-lg text-white">Sale Details</h3>
                                <p className="text-sm text-slate-400 font-mono">{selectedSale.invoiceNumber}</p>
                            </div>
                            <Button variant="secondary" onClick={() => setSelectedSale(null)} className="h-8 w-8 p-0 rounded-full">
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 rounded-lg bg-white/5 space-y-1">
                                    <p className="text-slate-500 text-xs uppercase font-bold">Date & Time</p>
                                    <p className="text-white">{new Date(selectedSale.date).toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 space-y-1">
                                    <p className="text-slate-500 text-xs uppercase font-bold">Cashier</p>
                                    <p className="text-white">{selectedSale.cashier?.name || 'Unknown'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 space-y-1">
                                    <p className="text-slate-500 text-xs uppercase font-bold">Customer</p>
                                    <p className="text-white">{selectedSale.customer?.name || 'N/A'}</p>
                                    {selectedSale.customer?.flatNumber && <p className="text-xs text-slate-400">Flat: {selectedSale.customer.flatNumber}</p>}
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 space-y-1">
                                    <p className="text-slate-500 text-xs uppercase font-bold">Payment Mode</p>
                                    <p className="font-bold text-purple-400">{selectedSale.paymentMode}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <MenuIcon className="text-purple-500" size={18} />
                                    Items Sold ({selectedSale.items.length})
                                </h4>
                                <div className="border border-white/10 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white/5 text-slate-400 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Product</th>
                                                <th className="px-4 py-3 text-right">Qty</th>
                                                <th className="px-4 py-3 text-right">Price</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {selectedSale.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/5">
                                                    <td className="px-4 py-3">
                                                        <p className="text-white font-medium">{item.product.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{item.product.barcode}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{item.quantity} {item.product.unit}</td>
                                                    <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(Number(item.unitPrice))}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(Number(item.total))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-white/5 font-bold">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right text-slate-300">Grand Total</td>
                                                <td className="px-4 py-3 text-right text-green-400 text-lg">{formatCurrency(Number(selectedSale.totalAmount))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                            <Button onClick={() => setSelectedSale(null)}>Close</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}

function MenuIcon({ className, size }: { className?: string, size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
        </svg>
    )
}
