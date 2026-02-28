'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Filter, Calendar, CreditCard, Banknote, QrCode, FileText, ChevronRight, X, ArrowUpRight, Edit2, Trash2, Save, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

type SaleItem = {
    id: string
    quantity: number
    unitPrice: number
    total: number
    product: {
        id: string
        name: string
        barcode: string
        unit: string
    }
}

type Sale = {
    type?: 'SALE' | 'PAYMENT'
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
    const [isEditing, setIsEditing] = useState(false)
    const [editedSale, setEditedSale] = useState<Sale | null>(null)
    const [editedCustomer, setEditedCustomer] = useState<{ name: string, flatNumber: string, phone: string } | null>(null)
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [allFlats, setAllFlats] = useState<any[]>([])
    const [allNames, setAllNames] = useState<any[]>([])
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
    const [activeSuggestionField, setActiveSuggestionField] = useState<'NAME' | 'FLAT' | null>(null)

    // Filters
    const [period, setPeriod] = useState('day')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
    const [paymentMode, setPaymentMode] = useState('ALL')

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

    const fetchSuggestions = async () => {
        try {
            const res = await fetch('/api/customers/flats')
            const data = await res.json()
            if (data.flats) setAllFlats(data.flats)
            if (data.names) setAllNames(data.names)
        } catch (e) {
            console.error('Failed to fetch suggestions', e)
        }
    }

    useEffect(() => {
        fetchSales()
        fetchSuggestions()
    }, [period, date, month, paymentMode])

    const handleDelete = async () => {
        if (!saleToDelete) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/sales/${saleToDelete}`, { method: 'DELETE' })
            if (res.ok) {
                setSelectedSale(null)
                fetchSales()
                toast.success('Invoice deleted successfully.')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to delete sale')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('An error occurred while deleting.')
        } finally {
            setIsDeleting(false)
            setSaleToDelete(null)
        }
    }

    const handleUpdate = async () => {
        if (!editedSale) return
        setLoading(true)
        try {
            const res = await fetch(`/api/sales/${editedSale.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    items: editedSale.items.map(i => ({
                        productId: i.product.id || (i as any).productId,
                        id: (i as any).productId || i.id,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        total: i.total
                    })),
                    paymentMode: editedSale.paymentMode,
                    totalAmount: editedSale.totalAmount,
                    subTotal: editedSale.totalAmount,
                    customer: editedCustomer
                })
            })

            if (res.ok) {
                setIsEditing(false)
                setSelectedSale(null)
                setEditedCustomer(null)
                fetchSales()
                toast.success('Invoice updated successfully!')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to update sale')
            }
        } catch (error) {
            console.error('Update error:', error)
            toast.error('An error occurred while updating.')
        } finally {
            setLoading(false)
        }
    }
    const updateItemQuantity = (itemId: string, newQty: number) => {
        if (!editedSale) return
        const updatedItems = editedSale.items.map(item => {
            if (item.id === itemId) {
                const qty = Math.max(0, newQty)
                return { ...item, quantity: qty, total: qty * item.unitPrice }
            }
            return item
        })
        const newTotal = updatedItems.reduce((acc, i) => acc + i.total, 0)
        setEditedSale({ ...editedSale, items: updatedItems, totalAmount: newTotal })
    }

    const getTotalRevenue = () => sales.reduce((acc, s) => acc + Number(s.totalAmount), 0)

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Sales History</h1>
                <Button onClick={fetchSales} variant="secondary" className="text-sm">
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-3 md:p-4 flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-center border-white/10 bg-slate-900/60 transition-all">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-purple-400" />
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-widest text-xs">Filters</span>
                </div>

                <div className="flex bg-white/5 rounded-xl p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {['day', 'month', 'year'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${period === p ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-slate-400 hover:text-white'}`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {period === 'day' && (
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                        />
                    )}

                    {period === 'month' && (
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                        />
                    )}

                    <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                        <option value="ALL">All Modes</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / QR</option>
                        <option value="CREDIT">Credit</option>
                    </select>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto md:ml-auto pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 md:pl-6 justify-between md:justify-start">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase font-black tracking-widest">Invoices</span>
                        <span className="text-lg font-black text-white">{sales.length}</span>
                    </div>
                    <div className="flex flex-col text-right md:text-left">
                        <span className="text-xs text-slate-500 uppercase font-black tracking-widest">Revenue</span>
                        <span className="text-lg font-black text-emerald-400">{formatCurrency(getTotalRevenue())}</span>
                    </div>
                </div>
            </Card>

            {/* Sales List */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <Card className="flex-1 flex flex-col overflow-hidden p-0 border-white/10 transition-all">
                    <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/5 font-bold text-slate-400 text-xs uppercase tracking-widest">
                        <div className="col-span-2">Date & Time</div>
                        <div className="col-span-2">Invoice #</div>
                        <div className="col-span-3">Customer</div>
                        <div className="col-span-2 text-center">Payment</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-1 text-center">Action</div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-slate-500">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold uppercase tracking-widest">Loading Sales...</p>
                                </div>
                            </div>
                        ) : sales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <div className="p-6 rounded-3xl bg-white/5 mb-4">
                                    <FileText size={48} className="opacity-20" />
                                </div>
                                <p className="font-bold text-sm">No sales found for this period.</p>
                            </div>
                        ) : (
                            sales.map((sale) => (
                                <div key={sale.id} className={`flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 border-b border-white/5 items-center text-sm transition-all group relative ${sale.type === 'PAYMENT' ? 'bg-green-500/5 hover:bg-green-500/10' : 'hover:bg-white/5'}`}>
                                    <div className="w-full md:col-span-2 flex justify-between md:block">
                                        <div className="text-slate-300 font-bold">
                                            {new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            <span className="hidden md:inline">/{new Date(sale.date).getFullYear()}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium md:mt-0.5">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>

                                    <div className="w-full md:col-span-2 flex justify-between items-center md:block">
                                        {sale.type === 'PAYMENT' ? (
                                            <div className="font-black text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded md:bg-transparent md:p-0 uppercase tracking-wider">CREDIT PAY</div>
                                        ) : (
                                            <div className="font-mono text-xs text-slate-400 bg-white/5 px-1.5 py-0.5 rounded md:bg-transparent md:p-0">#{sale.invoiceNumber}</div>
                                        )}

                                        <div className="md:hidden">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider
                                                    ${sale.paymentMode === 'CASH' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    sale.paymentMode === 'UPI' ? 'bg-purple-500/10 text-purple-400' :
                                                        'bg-blue-500/10 text-blue-400'}`}>
                                                {sale.paymentMode}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full md:col-span-3 flex justify-between items-center md:block pt-2 md:pt-0 border-t border-white/5 md:border-0">
                                        {sale.customer ? (
                                            <div className="flex flex-col">
                                                <p className="text-white font-bold text-xs md:text-sm">{sale.customer.name}</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Flat {sale.customer.flatNumber}</p>
                                            </div>
                                        ) : (
                                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">Walk-in</span>
                                        )}
                                        <div className="md:hidden text-right">
                                            <p className="font-black text-white text-base">{formatCurrency(Number(sale.totalAmount))}</p>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex md:col-span-2 justify-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-black uppercase tracking-wider
                                                ${sale.paymentMode === 'CASH' ? 'bg-emerald-500/10 text-emerald-400' :
                                                sale.paymentMode === 'UPI' ? 'bg-purple-500/10 text-purple-400' :
                                                    'bg-blue-500/10 text-blue-400'}`}>
                                            {sale.paymentMode === 'CASH' && <Banknote size={12} />}
                                            {sale.paymentMode === 'UPI' && <QrCode size={12} />}
                                            {sale.paymentMode === 'CREDIT' && <CreditCard size={12} />}
                                            {sale.paymentMode}
                                        </span>
                                    </div>

                                    <div className="hidden md:block md:col-span-2 text-right font-black text-white text-base">
                                        {formatCurrency(Number(sale.totalAmount))}
                                    </div>

                                    <div className="w-full md:col-span-1 flex justify-end md:justify-center mt-3 md:mt-0">
                                        {sale.type === 'SALE' && (
                                            <Button
                                                variant="secondary"
                                                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-purple-600 hover:text-white border-white/5 md:px-3 py-2 md:py-1.5 h-auto rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                                onClick={() => setSelectedSale(sale)}
                                            >
                                                Details <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                            </Button>
                                        )}
                                        {sale.type === 'PAYMENT' && (
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest opacity-50 select-none">Settlement</span>
                                        )}
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
                                <h3 className="font-bold text-lg text-white">{isEditing ? 'Edit Sale' : 'Sale Details'}</h3>
                                <p className="text-sm text-slate-400 font-mono">{selectedSale.invoiceNumber}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditing && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setEditedSale({ ...selectedSale })
                                                setEditedCustomer({
                                                    name: selectedSale.customer?.name || '',
                                                    flatNumber: selectedSale.customer?.flatNumber || '',
                                                    phone: (selectedSale.customer as any)?.phone || ''
                                                })
                                                setIsEditing(true)
                                            }}
                                            className="h-8 px-3 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border-blue-500/30"
                                        >
                                            <Edit2 size={14} className="mr-1.5" /> Edit
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => setSaleToDelete(selectedSale.id)}
                                            disabled={isDeleting}
                                            className="h-8 px-3 text-xs bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border-red-500/30"
                                        >
                                            <Trash2 size={14} className="mr-1.5" /> Delete
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSelectedSale(null)
                                        setIsEditing(false)
                                        setFilteredCustomers([])
                                        setActiveSuggestionField(null)
                                    }}
                                    className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 rounded-lg bg-white/5 space-y-1">
                                    <p className="text-slate-500 text-xs uppercase font-bold">Date & Time</p>
                                    <p className="text-white">{new Date(selectedSale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/')} {new Date(selectedSale.date).toLocaleTimeString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 space-y-1">
                                    <p className="text-slate-500 text-xs uppercase font-bold">Cashier</p>
                                    <p className="text-white">{selectedSale.cashier?.name || 'Unknown'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 space-y-1 relative">
                                    <p className="text-slate-500 text-xs uppercase font-bold">Customer Identity</p>
                                    {isEditing ? (
                                        <div className="space-y-2 pt-1">
                                            <div className="relative">
                                                <Input
                                                    placeholder="Name"
                                                    value={editedCustomer?.name || ''}
                                                    onFocus={() => setActiveSuggestionField('NAME')}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        setEditedCustomer(prev => prev ? { ...prev, name: val } : null)
                                                        setFilteredCustomers(allNames.filter(n => (n.name || '').toLowerCase().includes(val.toLowerCase())).slice(0, 5))
                                                    }}
                                                    className="h-8 bg-slate-900 text-xs border-slate-700"
                                                    wrapperClassName="mb-0"
                                                />
                                                {activeSuggestionField === 'NAME' && filteredCustomers.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-32 overflow-y-auto">
                                                        {filteredCustomers.map((c, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => {
                                                                    setEditedCustomer({ name: c.name, flatNumber: c.flatNumber, phone: c.phone })
                                                                    setFilteredCustomers([])
                                                                    setActiveSuggestionField(null)
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-[10px] text-white hover:bg-white/10 border-b border-white/5 last:border-0"
                                                            >
                                                                <div className="flex justify-between items-baseline">
                                                                    <span className="font-bold">{c.name}</span>
                                                                    <span className="text-[9px] text-slate-500 font-black uppercase opacity-60">Customer</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    placeholder="Flat / Room"
                                                    value={editedCustomer?.flatNumber || ''}
                                                    onFocus={() => setActiveSuggestionField('FLAT')}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toUpperCase()
                                                        setEditedCustomer(prev => prev ? { ...prev, flatNumber: val } : null)
                                                        setFilteredCustomers(allFlats.filter(f => (f.flatNumber || '').toLowerCase().includes(val.toLowerCase())).slice(0, 5))
                                                    }}
                                                    className="h-8 bg-slate-900 text-xs border-slate-700"
                                                    wrapperClassName="mb-0"
                                                />
                                                {activeSuggestionField === 'FLAT' && filteredCustomers.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-32 overflow-y-auto">
                                                        {filteredCustomers.map((c, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => {
                                                                    setEditedCustomer({ name: c.name, flatNumber: c.flatNumber, phone: c.phone })
                                                                    setFilteredCustomers([])
                                                                    setActiveSuggestionField(null)
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-[10px] text-white hover:bg-white/10 border-b border-white/5 last:border-0"
                                                            >
                                                                <div className="flex justify-between items-baseline">
                                                                    <span className="font-bold">Flat {c.flatNumber}</span>
                                                                    <span className="text-[9px] text-slate-500 font-black uppercase opacity-60">{c.name}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-white">{selectedSale.customer?.name || 'Walk-in'}</p>
                                            {selectedSale.customer?.flatNumber && <p className="text-xs text-slate-400">Flat: {selectedSale.customer.flatNumber}</p>}
                                        </>
                                    )}
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 space-y-1">
                                    <p className="text-slate-500 text-xs uppercase font-bold flex justify-between">
                                        <span>Contact / Mode</span>
                                        {isEditing && <span className="text-[9px] text-purple-400">SELECT PAYMENT</span>}
                                    </p>
                                    {isEditing ? (
                                        <div className="space-y-2 pt-1">
                                            <Input
                                                placeholder="Phone (Optional)"
                                                value={editedCustomer?.phone || ''}
                                                onChange={(e) => setEditedCustomer(prev => prev ? { ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) } : null)}
                                                className="h-8 bg-slate-900 text-xs border-slate-700"
                                                wrapperClassName="mb-0"
                                            />
                                            <select
                                                value={editedSale?.paymentMode || 'CASH'}
                                                onChange={(e) => setEditedSale(prev => prev ? { ...prev, paymentMode: e.target.value } : null)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-purple-400 text-xs font-bold focus:outline-none focus:border-purple-500 h-8"
                                            >
                                                <option value="CASH">CASH</option>
                                                <option value="UPI">UPI</option>
                                                <option value="CREDIT">CREDIT</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <p className="text-emerald-400 font-mono text-sm">{(selectedSale.customer as any)?.phone || 'No Contact'}</p>
                                            <p className="font-bold text-purple-400 uppercase tracking-widest text-[10px]">{selectedSale.paymentMode}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-white mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <MenuIcon className="text-purple-500" size={18} />
                                        Items Sold ({isEditing ? editedSale?.items.length : selectedSale.items.length})
                                    </div>
                                    {isEditing && <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">Modifying quantities will update stock</span>}
                                </h4>
                                <div className="border border-white/10 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white/5 text-slate-400 font-medium">
                                            <tr>
                                                <th className="px-4 py-3 text-xs uppercase tracking-wider font-bold">Product</th>
                                                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold">Qty</th>
                                                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold">Price</th>
                                                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {(isEditing ? editedSale?.items : selectedSale.items)?.map((item) => (
                                                <tr key={item.id} className="hover:bg-white/5">
                                                    <td className="px-4 py-3">
                                                        <p className="text-white font-medium">{item.product.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{item.product.barcode}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {isEditing ? (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    step="0.01"
                                                                    onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-purple-500"
                                                                />
                                                                <span className="text-[10px] text-slate-500">{item.product.unit}</span>
                                                            </div>
                                                        ) : (
                                                            <>{item.quantity} {item.product.unit}</>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(Number(item.unitPrice))}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(Number(item.total))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-white/5 font-bold">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right text-slate-300">Grand Total</td>
                                                <td className="px-4 py-3 text-right text-green-400 text-lg">{formatCurrency(Number(isEditing ? editedSale?.totalAmount : selectedSale.totalAmount))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                            {isEditing ? (
                                <>
                                    <Button onClick={() => setIsEditing(false)} variant="ghost" className="text-slate-400">Cancel</Button>
                                    <Button onClick={handleUpdate} className="bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2">
                                        <Save size={16} /> Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => setSelectedSale(null)} className="bg-white/10 hover:bg-white/20 text-white">Close</Button>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!saleToDelete}
                onClose={() => setSaleToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Invoice"
                message="Are you sure you want to delete this invoice? This action cannot be undone and will restore the stock."
                confirmText="Delete Invoice"
                isLoading={isDeleting}
            />
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
