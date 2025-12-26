'use client'

import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Truck, Plus, Search, Archive, AlertTriangle, User, X, Trash2, Edit2, Pause, Play } from 'lucide-react'
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
    product: {
        name: string
        unit: string
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Stock & Suppliers
                    </h1>
                    <p className="text-sm text-slate-400">Manage inventory flow and vendor relationships</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setView('inventory')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'inventory' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                    >
                        Inventory & Batches
                    </button>
                    <button
                        onClick={() => setView('suppliers')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'suppliers' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                    >
                        Supplier Directory
                    </button>
                    <button
                        onClick={() => setView('purchases')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'purchases' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
                    >
                        Purchase Orders
                    </button>
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
        expiryDate: ''
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
                setFormData({ productId: '', batchNumber: '', quantity: '1', expiryDate: '' })
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
        b.product.name.toLowerCase().includes(search.toLowerCase())
    ) || []

    const expiringSoon = batches?.filter(b => {
        if (!b.expiryDate) return false
        const days = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return days > 0 && days <= 30
    }).length || 0

    const lowStock = batches?.filter(b => b.quantity < 10).length || 0

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 flex items-center justify-between bg-emerald-500/5 border-emerald-500/20">
                    <div>
                        <p className="text-emerald-400 text-sm font-medium">Total Batches</p>
                        <h3 className="text-2xl font-bold text-white">{batches?.length || 0}</h3>
                        <p className="text-xs text-slate-500">Active lots</p>
                    </div>
                    <Archive className="text-emerald-500" size={24} />
                </Card>
                <Card className="p-4 flex items-center justify-between bg-yellow-500/5 border-yellow-500/20">
                    <div>
                        <p className="text-yellow-400 text-sm font-medium">Low Stock Batches</p>
                        <h3 className="text-2xl font-bold text-white">{lowStock}</h3>
                        <p className="text-xs text-slate-500">Below 10 units</p>
                    </div>
                    <AlertTriangle className="text-yellow-500" size={24} />
                </Card>
                <Card className="p-4 flex items-center justify-between bg-red-500/5 border-red-500/20">
                    <div>
                        <p className="text-red-400 text-sm font-medium">Expiring Soon</p>
                        <h3 className="text-2xl font-bold text-white">{expiringSoon}</h3>
                        <p className="text-xs text-slate-500">In 30 days</p>
                    </div>
                    <AlertTriangle className="text-red-500" size={24} />
                </Card>
            </div>

            <Card className="p-0 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-white"
                            placeholder="Search batch or product..."
                        />
                    </div>
                    {canManageStock && (
                        <Button onClick={() => {
                            setEditBatchId(null)
                            setFormData({ productId: '', batchNumber: '', quantity: '1', expiryDate: '' })
                            setIsAddModalOpen(true)
                        }}>
                            <Plus size={16} /> Add New Stock
                        </Button>
                    )}
                </div>
                {
                    isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading inventory...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-slate-300">
                                    <tr>
                                        <th className="p-4">Batch ID</th>
                                        <th className="p-4">Product Name</th>
                                        <th className="p-4 text-center">Current Qty</th>
                                        <th className="p-4">Expiry Date</th>
                                        <th className="p-4 text-center">Status</th>
                                        {canManageStock && <th className="p-4 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredBatches.map(item => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">{item.batchNumber}</td>
                                            <td className="p-4 font-medium text-white">
                                                {item.product.name}
                                                <span className="text-xs text-slate-500 ml-2">({item.product.unit})</span>
                                            </td>
                                            <td className="p-4 text-center font-bold text-emerald-400">{item.quantity}</td>
                                            <td className="p-4 text-slate-400">
                                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.quantity < 10 ? (
                                                    <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">Low Stock</span>
                                                ) : (
                                                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">In Stock</span>
                                                )}
                                            </td>
                                            {canManageStock && (
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setEditBatchId(item.id)
                                                            setFormData({
                                                                productId: item.productId,
                                                                batchNumber: item.batchNumber,
                                                                quantity: item.quantity.toString(),
                                                                expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
                                                            })
                                                            setIsAddModalOpen(true)
                                                        }}
                                                        className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredBatches.length === 0 && (
                                        <tr>
                                            <td colSpan={canManageStock ? 6 : 5} className="p-8 text-center text-slate-500">No batches found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                }
            </Card >

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
            <Card className="p-0 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white">Registered Suppliers</h3>
                    {canManageStock && (
                        <Button onClick={() => { setEditingId(null); setFormData({ name: '', phone: '', address: '', gstNumber: '' }); setIsAddModalOpen(true); }} variant="secondary" className="border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white">
                            <Plus size={16} /> Add New Supplier
                        </Button>
                    )}
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading suppliers...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-slate-300">
                                <tr>
                                    <th className="p-4">Supplier Name</th>
                                    <th className="p-4">Contact Info</th>
                                    <th className="p-4">GST / Tax ID</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {suppliers?.map(s => (
                                    <tr key={s.id} className={`hover:bg-white/5 transition-colors ${!s.isActive ? 'opacity-50' : ''}`}>
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{s.name}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{s.address || 'No address'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400">{s.phone || '-'}</td>
                                        <td className="p-4 text-slate-500 font-mono text-xs">{s.gstNumber || 'N/A'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${s.isActive ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                {s.isActive ? 'Active' : 'Paused'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => onViewOrders(s.id)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="View Orders">
                                                    <Search size={14} />
                                                </button>
                                                {canManageStock && (
                                                    <>
                                                        <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-blue-400" title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => toggleStatus(s)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-yellow-400" title={s.isActive ? 'Pause' : 'Activate'}>
                                                            {s.isActive ? <Pause size={14} /> : <Play size={14} />}
                                                        </button>
                                                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-red-400" title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {suppliers && suppliers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">No suppliers found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add/Edit Supplier Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-md">
                        <div className="p-2">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveSupplier} className="space-y-4">
                                <Input
                                    label="Supplier Name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <Input
                                    label="Phone Number"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                                <Input
                                    label="Address"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                                <Input
                                    label="GST / Tax ID"
                                    value={formData.gstNumber}
                                    onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                                />
                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" isLoading={submitting}>
                                        {editingId ? 'Update Supplier' : 'Save Supplier'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={executeDelete}
                title="Delete Supplier"
                message="Are you sure you want to delete this supplier? This action cannot be undone if they have existing records."
                confirmText="Delete Supplier"
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
            const prod = products?.find(p => p.id === value)
            if (prod) {
                // Auto-fill cost from product master if available (assuming we had costPrice there for now or default 0)
                // In a real app we might fetch the last purchase price
            }
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
        const loadingToast = toast.loading('Creating Purchase Order...')

        // Filter out empty rows
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
                toast.success(status === 'RECEIVED' ? 'Order Created & Received' : 'Order Draft Created')
                setIsAddModalOpen(false)
                setPoData({ supplierId: '', invoiceNumber: '', items: [{ productId: '', quantity: 1, costPrice: 0, total: 0 }] })
                mutate('/api/stock/purchases')
                if (status === 'RECEIVED') mutate('/api/stock/batches')
            } else {
                toast.error('Failed to create PO')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            toast.dismiss(loadingToast)
            setSubmitting(false)
        }
    }

    const executeReceive = async () => {
        if (!receivePo) return
        const loadingToast = toast.loading('Receiving stock...')
        try {
            const res = await fetch('/api/stock/purchases', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: receivePo.id, action: 'receive' })
            })

            if (res.ok) {
                toast.success('Stock Received')
                mutate('/api/stock/purchases')
                mutate('/api/stock/batches')
                setReceivePo(null)
            } else {
                toast.error('Failed to receive stock')
            }
        } catch (e) {
            toast.error('Network error')
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
            <Card className="p-0 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-white">Purchase Orders</h3>
                        {filterSupplierId && (
                            <span className="flex items-center gap-2 px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400">
                                Filtered by Supplier
                                <button onClick={clearFilter} className="hover:text-white"><X size={12} /></button>
                            </span>
                        )}
                    </div>
                    {canManageStock && (
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={16} /> New Purchase Order
                        </Button>
                    )}
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading orders...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-slate-300">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4">Invoice #</th>
                                    <th className="p-4 text-center">Items</th>
                                    <th className="p-4 text-right">Total Amount</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredPurchases?.map((po: any) => (
                                    <tr key={po.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-slate-400">
                                            {new Date(po.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-white">{po.supplier.name}</td>
                                        <td className="p-4 font-mono text-slate-500 text-xs">{po.invoiceNumber || '-'}</td>
                                        <td className="p-4 text-center text-slate-400">{po._count.items}</td>
                                        <td className="p-4 text-right font-bold text-white">{formatCurrency(po.totalAmount)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${po.status === 'RECEIVED' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                {po.status === 'RECEIVED' ? 'Received' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {po.status !== 'RECEIVED' && canManageStock && (
                                                <Button variant="secondary" className="h-7 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border-none" onClick={() => setReceivePo(po)}>
                                                    Receive Stock
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredPurchases?.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">No purchase orders found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create PO Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-bold text-white">Create Purchase Order</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="po-form" className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="label">Select Supplier</label>
                                        <select
                                            className="input w-full appearance-none"
                                            required
                                            value={poData.supplierId}
                                            onChange={e => setPoData({ ...poData, supplierId: e.target.value })}
                                        >
                                            <option value="">-- Choose Supplier --</option>
                                            {suppliers?.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input
                                        label="Invoice Number / Ref ID"
                                        placeholder="e.g. INV-2024-001"
                                        value={poData.invoiceNumber}
                                        onChange={e => setPoData({ ...poData, invoiceNumber: e.target.value })}
                                        wrapperClassName="mb-0"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-white">Order Items</h3>
                                        <Button type="button" variant="secondary" onClick={addItem} className="text-xs h-7">
                                            <Plus size={14} /> Add Item
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {poData.items.map((item, idx) => {
                                            const selectedProduct = products?.find(p => p.id === item.productId)
                                            return (
                                                <div key={idx} className="flex gap-2 items-start">
                                                    <div className="flex-[3]">
                                                        <select
                                                            className="input w-full appearance-none py-2 text-sm"
                                                            required
                                                            value={item.productId}
                                                            onChange={e => updateItem(idx, 'productId', e.target.value)}
                                                        >
                                                            <option value="">Select Product...</option>
                                                            {products?.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex-[1.5] flex gap-2">
                                                        <input
                                                            type="number"
                                                            className="input w-full py-2 text-sm"
                                                            placeholder="Quantity"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                        />
                                                        <div className="flex items-center justify-center bg-white/5 px-2 rounded text-xs text-slate-400 min-w-[3rem] whitespace-nowrap">
                                                            {selectedProduct?.unit || 'Unit'}
                                                        </div>
                                                    </div>
                                                    <div className="flex-[1]">
                                                        <input
                                                            type="number"
                                                            className="input w-full py-2 text-sm"
                                                            placeholder="Unit Cost"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.costPrice}
                                                            onChange={e => updateItem(idx, 'costPrice', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-[1] flex items-center justify-end text-sm font-medium text-slate-300 py-2 px-2 bg-white/5 rounded">
                                                        {formatCurrency(item.total)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="p-2 text-slate-500 hover:text-red-400"
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

                        <div className="p-4 border-t border-white/10 bg-slate-900/50 flex justify-between items-center">
                            <div className="text-right">
                                <p className="text-sm text-slate-400">Total Amount</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="button" variant="secondary" isLoading={submitting} onClick={() => handleCreatePO('PENDING')}>
                                    Save as Draft
                                </Button>
                                <Button type="button" isLoading={submitting} className="bg-emerald-600 hover:bg-emerald-500" onClick={() => handleCreatePO('RECEIVED')}>
                                    Receive & Save
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            {/* Confirmation for Receive */}
            <ConfirmationModal
                isOpen={!!receivePo}
                onClose={() => setReceivePo(null)}
                onConfirm={executeReceive}
                title="Receive Stock"
                message={`Are you sure you want to finalize and receive stock for order #${receivePo?.invoiceNumber || receivePo?.id.slice(0, 8)}? This will update inventory immediately.`}
                confirmText="Receive Stock"
                variant="info"
            />
        </React.Fragment>
    )
}
