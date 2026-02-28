'use client'

import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Truck, Plus, Search, Archive, AlertTriangle, User, X, Trash2, Edit2, Pause, Play, Download, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { z } from 'zod'
import { formatCurrency } from '@/lib/utils'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useUser } from '@/hooks/useUser'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type StockBatch = {
    id: string
    batchNumber: string
    quantity: number
    expiryDate: string | null
    productId: string
    costPrice: number | null
    sellingPrice: number | null
    product: {
        name: string
        unit: string
        barcode: string
    }
}

type Product = {
    id: string
    name: string
    barcode: string
    unit: string
}

export default function StockPage() {
    const [view, setView] = useState<'inventory' | 'suppliers' | 'purchases'>('inventory')
    const [filterSupplierId, setFilterSupplierId] = useState<string | null>(null)

    const handleViewOrders = (supplierId: string) => {
        setFilterSupplierId(supplierId)
        setView('purchases')
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                        Stock & Suppliers
                    </h1>
                    <p className="text-sm md:text-sm text-slate-500 font-bold transition-all mt-0.5">Inventory flow & vendor records</p>
                </div>
                <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'inventory', label: 'Inventory', icon: Archive },
                        { id: 'suppliers', label: 'Suppliers', icon: User },
                        { id: 'purchases', label: 'Purchases', icon: Truck }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setView(t.id as any)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${view === t.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-slate-500 hover:text-white'}`}
                        >
                            <t.icon size={14} className="md:hidden" />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'inventory' ? (
                <InventoryView />
            ) : view === 'suppliers' ? (
                <SuppliersView onViewOrders={handleViewOrders} />
            ) : (
                <PurchasesView filterSupplierId={filterSupplierId} clearFilter={() => setFilterSupplierId(null)} />
            )}
        </div>
    )
}

// ... (InventoryView and SuppliersView remain, adding PurchasesView below)

function InventoryView() {
    const { data: batches, isLoading } = useSWR<StockBatch[]>('/api/stock/batches', fetcher)
    const { data: products } = useSWR<Product[]>('/api/products', fetcher)
    const { canManageStock } = useUser()

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [search, setSearch] = useState('')

    // Add Stock Form State
    const [formData, setFormData] = useState({
        productId: '',
        batchNumber: '',
        quantity: '1',
        expiryDate: '',
        costPrice: '',
        sellingPrice: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [editBatchId, setEditBatchId] = useState<string | null>(null)

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const loadingToast = toast.loading(editBatchId ? 'Updating Stock...' : 'Adding Stock...')
        try {
            const url = editBatchId ? '/api/stock/batches' : '/api/stock/batches'
            const method = editBatchId ? 'PUT' : 'POST'
            const body = editBatchId ? { ...formData, id: editBatchId } : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(editBatchId ? 'Stock updated successfully' : 'Stock added successfully')
                setIsAddModalOpen(false)
                setFormData({ productId: '', batchNumber: '', quantity: '1', expiryDate: '', costPrice: '', sellingPrice: '' })
                setEditBatchId(null)
                mutate('/api/stock/batches')
            } else {
                toast.error(editBatchId ? 'Failed to update stock' : 'Failed to add stock')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            toast.dismiss(loadingToast)
            setSubmitting(false)
        }
    }

    const filteredBatches = batches?.filter(b =>
        b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.product.name.toLowerCase().includes(search.toLowerCase()) ||
        b.product.barcode.toLowerCase().includes(search.toLowerCase())
    ) || []

    const expiringSoon = batches?.filter(b => {
        if (!b.expiryDate) return false
        const days = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return days > 0 && days <= 30
    }).length || 0

    const lowStock = batches?.filter(b => b.quantity < 10).length || 0

    const handleDownloadLowStockCSV = () => {
        const lowStockBatches = batches?.filter(b => b.quantity < 10) || []
        if (lowStockBatches.length === 0) {
            toast.error("No low stock batches found")
            return
        }

        const csvRows = [
            ['Batch ID', 'Product Name', 'Current Quantity', 'Unit', 'Expiry Date']
        ]

        lowStockBatches.forEach(batch => {
            csvRows.push([
                batch.batchNumber,
                batch.product.name,
                batch.quantity.toString(),
                batch.product.unit,
                batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'
            ])
        })

        const csvContent = "data:text/csv;charset=utf-8,"
            + csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `low_stock_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Low stock report downloaded")
    }

    const downloadStockTemplate = () => {
        const headers = ['barcode', 'batchNumber', 'quantity', 'expiryDate']
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "stock_import_template.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleStockImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (results.data.length === 0) {
                    toast.error('CSV is empty')
                    return
                }

                const loadingToast = toast.loading(`Importing ${results.data.length} batches...`)
                try {
                    const res = await fetch('/api/stock/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(results.data)
                    })

                    if (res.ok) {
                        const data = await res.json()
                        if (data.failed > 0) {
                            toast.warning(`Imported: ${data.imported}, Failed: ${data.failed}. Check console for errors.`)
                            console.error("Import Errors:", data.errors)
                        } else {
                            toast.success(`Successfully imported ${data.imported} batches`)
                        }
                        mutate('/api/stock/batches')
                    } else {
                        toast.error('Import failed')
                    }
                } catch (err) {
                    toast.error('Network error during import')
                } finally {
                    toast.dismiss(loadingToast)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                }
            },
            error: () => {
                toast.error('Failed to parse CSV file')
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center justify-between bg-emerald-500/5 border-emerald-500/10 shadow-lg shadow-emerald-900/5">
                    <div>
                        <p className="text-sm text-emerald-500 font-bold transition-all">Total Batches</p>
                        <h3 className="text-2xl font-bold text-white">{batches?.length || 0}</h3>
                        <p className="text-sm text-slate-500 font-medium">Active inventory lots</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                        <Archive size={24} />
                    </div>
                </Card>
                <Card className="p-4 flex items-center justify-between bg-yellow-500/5 border-yellow-500/10 shadow-lg shadow-yellow-900/5">
                    <div>
                        <p className="text-sm text-yellow-500 font-bold transition-all">Low Stock</p>
                        <h3 className="text-2xl font-bold text-white">{lowStock}</h3>
                        <p className="text-sm text-slate-500 font-medium">Below 10 units alert</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500">
                        <AlertTriangle size={24} />
                    </div>
                </Card>
                <Card className="p-4 flex items-center justify-between bg-red-500/5 border-red-500/10 shadow-lg shadow-red-900/5 sm:col-span-2 lg:col-span-1">
                    <div>
                        <p className="text-sm text-red-500 font-bold transition-all">Expiring Soon</p>
                        <h3 className="text-2xl font-bold text-white">{expiringSoon}</h3>
                        <p className="text-sm text-slate-500 font-medium">Within next 30 days</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                </Card>
            </div>

            <Card className="p-0 overflow-hidden border-white/10 bg-slate-900/40">
                <div className="p-4 border-b border-white/5 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white/5">
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-purple-500 transition-all outline-none placeholder:text-slate-600"
                            placeholder="Search by name, barcode, or batch..."
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <Button
                            variant="secondary"
                            onClick={handleDownloadLowStockCSV}
                            disabled={lowStock === 0}
                            className="flex-1 lg:flex-none text-sm font-bold transition-all h-10 px-4 rounded-xl border-white/5 bg-white/5"
                        >
                            <Download size={16} className="mr-2" /> Low Stock Report
                        </Button>
                        {canManageStock && (
                            <div className="flex gap-2 w-full lg:w-auto">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleStockImport}
                                />
                                <Button
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 lg:flex-none text-sm font-bold transition-all h-10 px-4 rounded-xl border-white/5 bg-white/5"
                                >
                                    <Upload size={16} className="mr-2" /> Import
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEditBatchId(null)
                                        setFormData({ productId: '', batchNumber: '', quantity: '1', expiryDate: '', costPrice: '', sellingPrice: '' })
                                        setIsAddModalOpen(true)
                                    }}
                                    className="flex-1 lg:flex-none text-sm font-bold transition-all h-10 px-4 rounded-xl shadow-lg shadow-purple-900/40"
                                >
                                    <Plus size={16} className="mr-2" /> New Stock
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                    <button
                        onClick={downloadStockTemplate}
                        className="text-sm font-bold text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-all"
                    >
                        <Download size={12} /> Download Import Template
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-20 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold transition-all">Synchronizing Inventory...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile List */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {filteredBatches.map(item => (
                                <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-10">
                                            <h4 className="font-bold text-white text-base leading-tight">{item.product.name}</h4>
                                            <p className="text-sm text-slate-500 font-mono mt-0.5 tracking-tight">#{item.batchNumber}</p>
                                        </div>
                                        {canManageStock && (
                                            (() => {
                                                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()
                                                const isOutOfStock = item.quantity <= 0
                                                const canEdit = !isExpired && !isOutOfStock

                                                return (
                                                    <button
                                                        onClick={() => {
                                                            if (!canEdit) return
                                                            setEditBatchId(item.id)
                                                            setFormData({
                                                                productId: item.productId,
                                                                batchNumber: item.batchNumber,
                                                                quantity: item.quantity.toString(),
                                                                expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
                                                                costPrice: item.costPrice?.toString() || '',
                                                                sellingPrice: item.sellingPrice?.toString() || ''
                                                            })
                                                            setIsAddModalOpen(true)
                                                        }}
                                                        disabled={!canEdit}
                                                        className={`absolute top-4 right-4 p-2 rounded-lg transition-all shadow-lg ${canEdit ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}
                                                        title={isExpired ? "Cannot edit expired stock" : isOutOfStock ? "Cannot edit out of stock items" : "Edit Stock"}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )
                                            })()
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-bold transition-all mb-1">Pricing (C/S)</p>
                                            <p className="text-sm font-bold text-white">
                                                {formatCurrency(Number(item.costPrice || 0))} /
                                                <span className="text-purple-400 ml-1">{formatCurrency(Number(item.sellingPrice || 0))}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-bold transition-all mb-1">Qty</p>
                                            <p className="text-lg font-bold text-emerald-400">
                                                {Number(item.quantity).toFixed(3)}
                                                <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">{item.product.unit}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-500 font-bold transition-all mb-1">Expiry</p>
                                            <p className="text-xs font-bold text-white">
                                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-start">
                                        {(() => {
                                            const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()
                                            if (item.quantity <= 0) return <span className="text-[9px] font-bold transition-all bg-slate-500/10 text-slate-400 px-3 py-1 rounded-full border border-slate-500/20">Out of Stock</span>
                                            if (isExpired) return <span className="text-[9px] font-bold transition-all bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">Expired</span>
                                            if (item.quantity < 10) return <span className="text-[9px] font-bold transition-all bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">Low Stock</span>
                                            return <span className="text-[9px] font-bold transition-all bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 transition-all">Stable</span>
                                        })()}
                                    </div>
                                </div>
                            ))}
                            {filteredBatches.length === 0 && (
                                <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-4">
                                    <Archive size={48} className="opacity-10" />
                                    <p className="text-sm font-bold transition-all">Empty Inventory</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-slate-400 font-bold transition-all text-sm border-b border-white/5">
                                    <tr>
                                        <th className="p-4">Batch Details</th>
                                        <th className="p-4">Product Name</th>
                                        <th className="p-4">Cost/Sell Price</th>
                                        <th className="p-4 text-center">Available Qty</th>
                                        <th className="p-4">Expiry Date</th>
                                        <th className="p-4 text-center">Health Status</th>
                                        {canManageStock && <th className="p-4 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredBatches.map(item => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-all group">
                                            <td className="p-4 font-mono text-slate-500 text-xs">#{item.batchNumber}</td>
                                            <td className="p-4 font-bold text-white">
                                                {item.product.name}
                                                <span className="text-sm font-bold text-slate-500 ml-2 opacity-60">({item.product.unit})</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500">C: {formatCurrency(Number(item.costPrice || 0))}</span>
                                                    <span className="text-sm font-bold text-purple-400">S: {formatCurrency(Number(item.sellingPrice || 0))}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-bold text-emerald-400 text-base">{Number(item.quantity).toFixed(3)}</td>
                                            <td className="p-4 text-slate-400 font-medium">
                                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                            </td>
                                            <td className="p-4 text-center">
                                                {(() => {
                                                    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()
                                                    if (item.quantity <= 0) return <span className="text-[9px] font-bold transition-all bg-slate-500/10 text-slate-400 px-3 py-1 rounded-full border border-slate-500/20">Out of Stock</span>
                                                    if (isExpired) return <span className="text-[9px] font-bold transition-all bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">Expired</span>
                                                    if (item.quantity < 10) return <span className="text-[9px] font-bold transition-all bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20">Low Stock</span>
                                                    return <span className="text-[9px] font-bold transition-all bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">In Stock</span>
                                                })()}
                                            </td>
                                            {canManageStock && (
                                                <td className="p-4 text-right">
                                                    {(() => {
                                                        const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()
                                                        const isOutOfStock = item.quantity <= 0
                                                        const canEdit = !isExpired && !isOutOfStock

                                                        return (
                                                            <button
                                                                onClick={() => {
                                                                    if (!canEdit) return
                                                                    setEditBatchId(item.id)
                                                                    setFormData({
                                                                        productId: item.productId,
                                                                        batchNumber: item.batchNumber,
                                                                        quantity: item.quantity.toString(),
                                                                        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
                                                                        costPrice: item.costPrice?.toString() || '',
                                                                        sellingPrice: item.sellingPrice?.toString() || ''
                                                                    })
                                                                    setIsAddModalOpen(true)
                                                                }}
                                                                disabled={!canEdit}
                                                                className={`p-2 rounded-lg transition-all ${canEdit ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}
                                                                title={isExpired ? "Cannot edit expired stock" : isOutOfStock ? "Cannot edit out of stock items" : "Edit Stock"}
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        )
                                                    })()}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Card>

            {/* Add Stock Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-md">
                            <div className="p-2">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">{editBatchId ? 'Edit Stock Batch' : 'Add New Stock Batch'}</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleAddStock} className="space-y-4">
                                    <div>
                                        <label className="label">Select Product</label>
                                        <select
                                            className="input w-full appearance-none"
                                            required
                                            value={formData.productId}
                                            onChange={e => setFormData({ ...formData, productId: e.target.value })}
                                            disabled={!!editBatchId}
                                        >
                                            <option value="">-- Choose Product --</option>
                                            {products?.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input
                                        label="Batch Number"
                                        required
                                        value={formData.batchNumber}
                                        onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                                        placeholder="e.g. BATCH-2024-001"
                                        disabled={!!editBatchId}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Cost Price"
                                            type="number"
                                            step="0.01"
                                            value={formData.costPrice}
                                            onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                                            placeholder="Optional"
                                        />
                                        <Input
                                            label="Selling Price"
                                            type="number"
                                            step="0.01"
                                            value={formData.sellingPrice}
                                            onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Quantity"
                                            type="number"
                                            required
                                            value={formData.quantity}
                                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        />
                                        <Input
                                            label="Expiry Date"
                                            type="date"
                                            value={formData.expiryDate}
                                            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                        <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" isLoading={submitting}>
                                            {editBatchId ? 'Update Stock' : 'Add Stock'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </Card>
                    </div>
                )
            }
        </div >
    )
}

type Supplier = {
    id: string
    name: string
    phone: string | null
    address: string | null
    gstNumber: string | null
    isActive: boolean
}

function SuppliersView({ onViewOrders }: { onViewOrders: (id: string) => void }) {
    const { data: suppliers, isLoading } = useSWR<Supplier[]>('/api/suppliers', fetcher)
    const { canManageStock } = useUser()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Add/Edit Supplier Form
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        gstNumber: ''
    })

    const openEdit = (s: Supplier) => {
        setEditingId(s.id)
        setFormData({
            name: s.name,
            phone: s.phone || '',
            address: s.address || '',
            gstNumber: s.gstNumber || ''
        })
        setIsAddModalOpen(true)
    }

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const isEdit = !!editingId
        const toastId = toast.loading(isEdit ? 'Updating Supplier...' : 'Adding Supplier...')

        try {
            const method = isEdit ? 'PUT' : 'POST'
            const body = isEdit ? { ...formData, id: editingId } : formData

            const res = await fetch('/api/suppliers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast.success(isEdit ? 'Supplier updated' : 'Supplier added')
                setIsAddModalOpen(false)
                setFormData({ name: '', phone: '', address: '', gstNumber: '' })
                setEditingId(null)
                mutate('/api/suppliers')
            } else {
                toast.error('Failed to save supplier')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            toast.dismiss(toastId)
            setSubmitting(false)
        }
    }

    const toggleStatus = async (s: Supplier) => {
        try {
            await fetch('/api/suppliers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: s.id, isActive: !s.isActive })
            })
            mutate('/api/suppliers')
            toast.success(`Supplier ${s.isActive ? 'paused' : 'activated'}`)
        } catch (e) {
            toast.error('Failed to update status')
        }
    }

    const executeDelete = async () => {
        if (!deleteId) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/suppliers?id=${deleteId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Supplier deleted')
                mutate('/api/suppliers')
                setDeleteId(null)
            } else {
                const json = await res.json()
                toast.error(json.error || 'Failed to delete')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <React.Fragment>
            <Card className="p-0 overflow-hidden border-white/10 bg-slate-900/40">
                <div className="p-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
                    <div>
                        <h3 className="font-bold text-white text-lg tracking-tight">Registered Suppliers</h3>
                        <p className="text-sm text-slate-500 font-bold transition-all mt-0.5">Manage your vendor relationships</p>
                    </div>
                    {canManageStock && (
                        <Button onClick={() => { setEditingId(null); setFormData({ name: '', phone: '', address: '', gstNumber: '' }); setIsAddModalOpen(true); }} variant="secondary" className="w-full md:w-auto border-dashed border-slate-700 text-sm font-bold transition-all h-10 px-4 rounded-xl hover:border-purple-500 hover:text-purple-400">
                            <Plus size={16} className="mr-2" /> Add New Supplier
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="p-20 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold transition-all text-slate-400">Loading Vendors...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {suppliers?.map(s => (
                                <div key={s.id} className={`p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden transition-all ${!s.isActive ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shadow-lg">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-base leading-tight">{s.name}</p>
                                            <p className="text-sm text-slate-500 font-bold transition-all">{s.gstNumber || 'No GST ID'}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-white/5 flex flex-col gap-1">
                                        <p className="text-xs text-slate-400 flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                            {s.phone || 'No phone'}
                                        </p>
                                        <p className="text-sm text-slate-500 italic truncate">{s.address || 'No address provided'}</p>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${s.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {s.isActive ? 'Active' : 'Paused'}
                                        </span>
                                        <div className="flex gap-1">
                                            <button onClick={() => onViewOrders(s.id)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white" title="Orders">
                                                <Search size={14} />
                                            </button>
                                            {canManageStock && (
                                                <>
                                                    <button onClick={() => openEdit(s)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-blue-400">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => toggleStatus(s)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-yellow-400">
                                                        {s.isActive ? <Pause size={14} /> : <Play size={14} />}
                                                    </button>
                                                    <button onClick={() => setDeleteId(s.id)} className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {suppliers?.length === 0 && (
                                <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-4">
                                    <User size={48} className="opacity-10" />
                                    <p className="text-sm font-bold transition-all">No Registered Suppliers</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-slate-400 font-bold transition-all text-sm border-b border-white/5">
                                    <tr>
                                        <th className="p-4">Vendor Info</th>
                                        <th className="p-4">Contact Channel</th>
                                        <th className="p-4">Tax ID / GST</th>
                                        <th className="p-4 text-center">Lifecycle</th>
                                        <th className="p-4 text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {suppliers?.map(s => (
                                        <tr key={s.id} className={`hover:bg-white/5 transition-all group ${!s.isActive ? 'opacity-40 grayscale' : ''}`}>
                                            <td className="p-4 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-purple-600/20 group-hover:text-purple-400 transition-all">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{s.name}</p>
                                                    <p className="text-sm text-slate-500 font-medium truncate max-w-[200px]">{s.address || 'Universal Store'}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-400 font-bold text-xs">{s.phone || '-'}</td>
                                            <td className="p-4 text-slate-500 font-mono text-sm uppercase tracking-wider">{s.gstNumber || 'N/A'}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${s.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                    {s.isActive ? 'Operational' : 'On Hold'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => onViewOrders(s.id)} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all">
                                                        <Search size={16} />
                                                    </button>
                                                    {canManageStock && (
                                                        <>
                                                            <button onClick={() => openEdit(s)} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-blue-400 transition-all">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => toggleStatus(s)} className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-yellow-400 transition-all">
                                                                {s.isActive ? <Pause size={16} /> : <Play size={16} />}
                                                            </button>
                                                            <button onClick={() => setDeleteId(s.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Card>

            {/* Modals omitted for brevity - assuming they stay same but wrapped in responsive Card if needed */}
            {/* ... Modal code below (Add/Edit Supplier, Delete Supplier) ... */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <Card className="w-full max-w-md bg-slate-900 border-white/10 shadow-2xl">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-bold text-white tracking-tight">{editingId ? 'Modify Supplier' : 'New Vendor'}</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveSupplier} className="p-6 space-y-5">
                            <Input
                                label="SUPPLIER NAME"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="PHONE"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-white/5 border-white/10"
                                />
                                <Input
                                    label="TAX / GST ID"
                                    value={formData.gstNumber}
                                    onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <Input
                                label="OFFICE ADDRESS"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white/5 border-white/5">
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={submitting} className="flex-1 shadow-lg shadow-purple-900/40 font-bold transition-all">
                                    {editingId ? 'Update Info' : 'Register Vendor'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={executeDelete}
                title="Delete Supplier"
                message="Permanently remove this vendor from records? This cannot be undone."
                confirmText="Confirm Deletion"
                isLoading={submitting}
            />
        </React.Fragment>
    )
}

function PurchasesView({ filterSupplierId, clearFilter }: { filterSupplierId: string | null, clearFilter: () => void }) {
    const { data: purchases, isLoading } = useSWR('/api/stock/purchases', fetcher)
    const { data: suppliers } = useSWR<Supplier[]>('/api/suppliers', fetcher)
    const { data: products } = useSWR<Product[]>('/api/products', fetcher)
    const { canManageStock } = useUser()

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [receivePo, setReceivePo] = useState<any>(null)

    // PO Form State
    const [poData, setPoData] = useState({
        supplierId: '',
        invoiceNumber: '',
        items: [{ productId: '', quantity: 1, costPrice: 0, total: 0 }]
    })

    const addItem = () => {
        setPoData(prev => ({
            ...prev,
            items: [...prev.items, { productId: '', quantity: 1, costPrice: 0, total: 0 }]
        }))
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...poData.items]
        const item = { ...newItems[index] }

        if (field === 'productId') {
            item.productId = value
        } else if (field === 'quantity' || field === 'costPrice') {
            (item as any)[field] = Number(value)
            item.total = item.quantity * item.costPrice
        }

        newItems[index] = item
        setPoData({ ...poData, items: newItems })
    }

    const removeItem = (index: number) => {
        if (poData.items.length === 1) return
        const newItems = poData.items.filter((_, i) => i !== index)
        setPoData({ ...poData, items: newItems })
    }

    const handleCreatePO = async (status: 'PENDING' | 'RECEIVED') => {
        setSubmitting(true)
        const loadingToast = toast.loading('Synchronizing Purchase...')
        const validItems = poData.items.filter(i => i.productId && i.quantity > 0)

        try {
            const res = await fetch('/api/stock/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: poData.supplierId,
                    invoiceNumber: poData.invoiceNumber,
                    items: validItems,
                    status
                })
            })

            if (res.ok) {
                toast.success(status === 'RECEIVED' ? 'Restock Completed' : 'Import Draft Saved')
                setIsAddModalOpen(false)
                setPoData({ supplierId: '', invoiceNumber: '', items: [{ productId: '', quantity: 1, costPrice: 0, total: 0 }] })
                mutate('/api/stock/purchases')
                if (status === 'RECEIVED') mutate('/api/stock/batches')
            } else {
                toast.error('Transaction Failed')
            }
        } catch (e) {
            toast.error('Network failure')
        } finally {
            toast.dismiss(loadingToast)
            setSubmitting(false)
        }
    }

    const executeReceive = async () => {
        if (!receivePo) return
        const loadingToast = toast.loading('Receiving Shipments...')
        try {
            const res = await fetch('/api/stock/purchases', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: receivePo.id, action: 'receive' })
            })

            if (res.ok) {
                toast.success('Inventory Synchronized')
                mutate('/api/stock/purchases')
                mutate('/api/stock/batches')
                setReceivePo(null)
            } else {
                toast.error('Sync Error')
            }
        } catch (e) {
            toast.error('Network Error')
        } finally {
            toast.dismiss(loadingToast)
        }
    }

    const totalAmount = poData.items.reduce((acc, item) => acc + item.total, 0)
    const filteredPurchases = filterSupplierId
        ? purchases?.filter((p: any) => p.supplierId === filterSupplierId)
        : purchases

    return (
        <React.Fragment>
            <Card className="p-0 overflow-hidden border-white/10 bg-slate-900/40">
                <div className="p-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <h3 className="font-bold text-white text-lg tracking-tight">Purchase Orders</h3>
                        {filterSupplierId && (
                            <span className="flex items-center gap-2 px-3 py-1 text-[9px] font-bold transition-all rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Vendor Lockdown
                                <button onClick={clearFilter} className="hover:text-white"><X size={12} /></button>
                            </span>
                        )}
                    </div>
                    {canManageStock && (
                        <Button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto h-10 px-6 rounded-xl shadow-lg shadow-purple-900/40 font-bold transition-all text-sm">
                            <Plus size={16} className="mr-2" /> New Purchase Record
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="p-20 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold transition-all text-slate-400">Syncing Transactions...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {filteredPurchases?.map((po: any) => (
                                <div key={po.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-white">{po.supplier.name}</p>
                                            <p className="text-sm text-slate-500 font-mono mt-0.5">#{po.invoiceNumber || 'NO-REF'}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${po.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {po.status === 'RECEIVED' ? 'Delivered' : 'Awaiting'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end pt-2 border-t border-white/5">
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-bold transition-all mb-0.5">Final Value</p>
                                            <p className="text-lg font-bold text-white">{formatCurrency(po.totalAmount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-500 font-bold transition-all mb-0.5">{po._count.items} Products</p>
                                            <p className="text-sm text-slate-500 font-bold transition-all">{new Date(po.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                        </div>
                                    </div>
                                    {po.status !== 'RECEIVED' && canManageStock && (
                                        <Button
                                            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-sm shadow-lg shadow-emerald-900/20"
                                            onClick={() => setReceivePo(po)}
                                        >
                                            Finalize & Receive Stock
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {filteredPurchases?.length === 0 && (
                                <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-4">
                                    <Truck size={48} className="opacity-10" />
                                    <p className="text-sm font-bold transition-all">No Transaction History</p>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-slate-400 font-bold transition-all text-sm border-b border-white/5">
                                    <tr>
                                        <th className="p-4">Arrival Date</th>
                                        <th className="p-4">Vendor Entity</th>
                                        <th className="p-4">Invoice / Ref</th>
                                        <th className="p-4 text-center">SKUs</th>
                                        <th className="p-4 text-right">Settlement</th>
                                        <th className="p-4 text-center">Logistics</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredPurchases?.map((po: any) => (
                                        <tr key={po.id} className="hover:bg-white/5 transition-all group">
                                            <td className="p-4 text-slate-500 text-xs font-bold transition-all">
                                                {new Date(po.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-4 font-bold text-white">{po.supplier.name}</td>
                                            <td className="p-4 font-mono text-slate-500 text-sm uppercase">{po.invoiceNumber || '-'}</td>
                                            <td className="p-4 text-center text-slate-400 font-bold">{po._count.items}</td>
                                            <td className="p-4 text-right font-bold text-white text-base">{formatCurrency(po.totalAmount)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${po.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                    {po.status === 'RECEIVED' ? 'Operational' : 'En Route'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {po.status !== 'RECEIVED' && canManageStock && (
                                                    <Button variant="secondary" className="h-8 text-[9px] font-bold transition-all bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border-none rounded-lg px-4 transition-all" onClick={() => setReceivePo(po)}>
                                                        Synchronize
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Card>

            {/* Create PO Modal - Responsive Wrapped */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-md">
                    <Card className="w-full max-w-5xl max-h-[95vh] flex flex-col bg-slate-900 border-white/10 shadow-2xl overflow-hidden rounded-2xl">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Create Purchase Order</h2>
                                <p className="text-sm text-slate-500 font-bold transition-all">Inbound Stock Logistics</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-900/50">
                            <form id="po-form" className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 ml-1">Select Active Vendor</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                                            required
                                            value={poData.supplierId}
                                            onChange={e => setPoData({ ...poData, supplierId: e.target.value })}
                                        >
                                            <option value="" className="bg-slate-900">-- Select Entity --</option>
                                            {suppliers?.map(s => (
                                                <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input
                                        label="INVOICE / REFERENCE NUMBER"
                                        placeholder="e.g. SHIP-001-X"
                                        value={poData.invoiceNumber}
                                        onChange={e => setPoData({ ...poData, invoiceNumber: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                        <div>
                                            <h3 className="font-bold text-white text-base tracking-tight">Manifest Items</h3>
                                            <p className="text-[9px] text-slate-500 font-bold transition-all">Detail all inbound SKUs</p>
                                        </div>
                                        <Button type="button" variant="secondary" onClick={addItem} className="text-[9px] font-bold transition-all h-8 px-4 bg-white/5 border-white/5 hover:border-purple-500 transition-all">
                                            <Plus size={14} className="mr-1" /> Add Entry
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {poData.items.map((item, idx) => {
                                            const selectedProduct = products?.find(p => p.id === item.productId)
                                            return (
                                                <div key={idx} className="grid grid-cols-1 md:flex gap-3 items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all relative group">
                                                    <div className="flex-[3] w-full">
                                                        <select
                                                            className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 appearance-none"
                                                            required
                                                            value={item.productId}
                                                            onChange={e => updateItem(idx, 'productId', e.target.value)}
                                                        >
                                                            <option value="" className="bg-slate-900">Search Product Manifest...</option>
                                                            {products?.map(p => (
                                                                <option key={p.id} value={p.id} className="bg-slate-900">{p.name} ({p.barcode})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex-[2] flex gap-2 w-full">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                                                placeholder="Qty"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-600 pointer-events-none">
                                                                {selectedProduct?.unit || 'Units'}
                                                            </span>
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                                                placeholder="Cost"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.costPrice}
                                                                onChange={e => updateItem(idx, 'costPrice', e.target.value)}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-600 pointer-events-none">
                                                                Price
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="hidden md:flex flex-[1] items-center justify-end text-sm font-bold text-emerald-400 py-2 px-3 bg-white/5 rounded-lg">
                                                        {formatCurrency(item.total)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="absolute -top-2 -right-2 md:relative md:top-0 md:right-0 p-2 bg-red-500/10 md:bg-transparent text-red-500 hover:scale-110 transition-transform"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 md:p-8 border-t border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                                <p className="text-sm font-bold text-slate-500 mb-1">Total Manifest Value</p>
                                <p className="text-4xl font-bold text-white tracking-tighter">{formatCurrency(totalAmount)}</p>
                            </div>
                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} className="flex-1 md:flex-none border-white/5 bg-white/5 h-12 md:h-10 text-sm font-bold transition-all px-8">
                                    Discard
                                </Button>
                                <Button type="button" variant="secondary" isLoading={submitting} onClick={() => handleCreatePO('PENDING')} className="flex-1 md:flex-none border-purple-500/20 bg-purple-500/5 h-12 md:h-10 text-sm font-bold transition-all px-8">
                                    Save Draft
                                </Button>
                                <Button type="button" isLoading={submitting} className="flex-1 md:flex-none h-12 md:h-10 text-sm font-bold transition-all px-8 shadow-xl shadow-emerald-900/40" onClick={() => handleCreatePO('RECEIVED')}>
                                    Finalize Receipt
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            <ConfirmationModal
                isOpen={!!receivePo}
                onClose={() => setReceivePo(null)}
                onConfirm={executeReceive}
                title="Synchronize Stock"
                message={`Verify and finalize inbound manifest #${receivePo?.invoiceNumber || receivePo?.id.slice(0, 8)}? Inventory will be updated immediately.`}
                confirmText="Verify & Receive"
                variant="info"
            />
        </React.Fragment>
    )
}

