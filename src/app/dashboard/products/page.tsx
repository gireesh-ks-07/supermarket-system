'use client'

import React, { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Plus, Trash2, Edit2, X, Package, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { formatCurrency } from '@/lib/utils'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useUser } from '@/hooks/useUser'

// Validations
const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    barcode: z.string().min(1, 'Barcode is required'),
    category: z.string().optional(),
    brand: z.string().optional(),
    unitValue: z.string().min(1, 'Qty required'),
    unitType: z.string(),
    costPrice: z.string().min(1, 'Cost required'),
    sellingPrice: z.string().min(1, 'Price required'),
    taxPercent: z.string().default('0'),
    minStockLevel: z.string().default('10')
})

type Product = {
    id: string
    name: string
    barcode: string
    category: string
    brand: string | null
    unit: string
    costPrice: number
    sellingPrice: number
    taxPercent: number
    minStockLevel: number
}

// Fetcher
const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ProductsPage() {
    // SWR Data Fetching
    const { data: products, error, isLoading } = useSWR<Product[]>('/api/products', fetcher)
    const { canManageStock } = useUser()

    const [editingId, setEditingId] = useState<string | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        name: '', barcode: '', category: '', brand: '',
        unitValue: '1', unitType: 'piece',
        costPrice: '', sellingPrice: '', taxPercent: '0', minStockLevel: '10'
    })

    const openEdit = (product: Product) => {
        setEditingId(product.id)
        const [val, type] = product.unit.split(' ')
        setFormData({
            name: product.name,
            barcode: product.barcode,
            category: product.category,
            brand: product.brand || '',
            unitValue: val || '1',
            unitType: type || product.unit,
            costPrice: product.costPrice.toString(),
            sellingPrice: product.sellingPrice.toString(),
            taxPercent: product.taxPercent.toString(),
            minStockLevel: product.minStockLevel.toString()
        })
        setIsAddModalOpen(true)
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({
            name: '', barcode: '', category: '', brand: '',
            unitValue: '1', unitType: 'piece',
            costPrice: '', sellingPrice: '', taxPercent: '0', minStockLevel: '10'
        })
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        // Zod Validation
        const result = productSchema.safeParse(formData)
        if (!result.success) {
            result.error.issues.forEach((err) => {
                toast.error(err.message)
            })
            return
        }

        setSubmitting(true)
        const loadingToast = toast.loading(editingId ? 'Updating product...' : 'Creating product...')

        try {
            const payload = { ...formData, unit: `${formData.unitValue} ${formData.unitType}` }
            const url = editingId ? `/api/products/${editingId}` : '/api/products'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(editingId ? 'Product updated' : 'Product created')
                setIsAddModalOpen(false)
                resetForm()
                mutate('/api/products') // Refresh Data
            } else {
                const json = await res.json()
                toast.error(json.error || 'Operation failed')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            toast.dismiss(loadingToast)
            setSubmitting(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        const loadingToast = toast.loading('Deleting product...')
        try {
            const res = await fetch(`/api/products/${deleteId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Product deleted')
                setDeleteId(null)
                mutate('/api/products')
            } else {
                toast.error('Could not delete product')
            }
        } catch (e) {
            toast.error('Failed to delete')
        } finally {
            toast.dismiss(loadingToast)
        }
    }

    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            if (!text) return

            const rows = text.split('\n').filter(row => row.trim() !== '')
            if (rows.length < 2) {
                toast.error('CSV file is empty or missing data')
                return
            }

            // Simple CSV parsing: assume header is name,barcode,category,brand,unit,cost,price,tax,minStock
            const header = rows[0].split(',').map(h => h.trim().toLowerCase())
            const productsToImport = []

            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',').map(v => v.trim())
                if (values.length < 2) continue // Skip empty rows

                const product: any = {}
                header.forEach((h, index) => {
                    if (h === 'name') product.name = values[index]
                    if (h === 'barcode') product.barcode = values[index]
                    if (h === 'category') product.category = values[index]
                    if (h === 'brand') product.brand = values[index]
                    if (h === 'unit') product.unit = values[index]
                    if (h === 'cost' || h === 'costprice') product.costPrice = values[index]
                    if (h === 'price' || h === 'sellingprice') product.sellingPrice = values[index]
                    if (h === 'tax' || h === 'taxpercent') product.taxPercent = values[index]
                    if (h === 'minstock' || h === 'minstocklevel') product.minStockLevel = values[index]
                })

                if (product.name && product.barcode) {
                    productsToImport.push(product)
                }
            }

            if (productsToImport.length === 0) {
                toast.error('No valid products found in CSV')
                return
            }

            setSubmitting(true)
            const loadingToast = toast.loading(`Importing ${productsToImport.length} products...`)

            try {
                const res = await fetch('/api/products/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productsToImport)
                })

                if (res.ok) {
                    const result = await res.json()
                    toast.success(`Import complete! Created: ${result.created}, Skipped (Duplicates): ${result.skipped}`)
                    mutate('/api/products')
                } else {
                    const error = await res.json()
                    toast.error(error.error || 'Import failed')
                }
            } catch (err) {
                toast.error('Network error during import')
            } finally {
                toast.dismiss(loadingToast)
                setSubmitting(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
        reader.readAsText(file)
    }

    const downloadTemplate = () => {
        const headers = ['name', 'barcode', 'category', 'brand', 'unit', 'cost', 'price', 'tax', 'minStock']
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "product_import_template.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
    ) || []

    const categories = Array.from(new Set(products?.map(p => p.category) || [])).sort()

    if (error) return <div className="text-red-500">Failed to load products</div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Product Catalogue
                    </h1>
                    <p className="text-sm text-slate-400">Manage your inventory items</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv"
                        className="hidden"
                    />
                    <Button variant="secondary" onClick={handleImportClick} className="flex-1 md:flex-none h-10 text-xs md:text-sm">
                        <Upload size={18} className="md:mr-2" /> <span className="hidden md:inline">Import CSV</span>
                    </Button>
                    {canManageStock && (
                        <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }} className="flex-1 md:flex-none h-10 text-xs md:text-sm">
                            <Plus size={18} className="md:mr-2" /> <span className="hidden md:inline">Add Product</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-4">
                    <Card className="flex-1 p-2.5 md:p-3 flex items-center gap-3 bg-slate-900/60 transition-all border-white/10">
                        <Search className="text-slate-400" size={18} />
                        <input
                            className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500 text-sm"
                            placeholder="Search by name, barcode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Card>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="text-[10px] md:text-xs text-purple-400 hover:text-purple-300 text-left w-fit px-1 transition-colors flex items-center gap-1 uppercase font-bold tracking-widest"
                >
                    <Package size={12} /> Download CSV Template
                </button>
            </div>

            {/* Product Table / Mobile Cards */}
            <div className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-bold uppercase tracking-widest">Loading Catalogue...</p>
                        </div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-slate-500 border-dashed border-2 border-white/5">
                        <Package size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">No products found.</p>
                        <p className="text-xs mt-1">Add one to get started.</p>
                    </Card>
                ) : (
                    <>
                        {/* Mobile List */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {filteredProducts.map((product) => (
                                <Card key={product.id} className="p-4 bg-slate-900/40 border-white/10 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-12">
                                            <h3 className="font-black text-white text-base leading-tight">{product.name}</h3>
                                            <p className="text-[10px] text-slate-500 font-mono mt-1">{product.barcode}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-emerald-400">{formatCurrency(product.sellingPrice)}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{product.unit}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                            {product.category}
                                        </span>
                                        {canManageStock && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEdit(product)}
                                                    className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(product.id)}
                                                    className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <Card className="hidden md:block p-0 overflow-hidden border-white/10">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                        <tr>
                                            <th className="p-4">Product Details</th>
                                            <th className="p-4">Barcode</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4 text-right">Cost</th>
                                            <th className="p-4 text-right">Price</th>
                                            <th className="p-4 text-center">Unit</th>
                                            <th className="p-4 text-right">Min Stock</th>
                                            {canManageStock && <th className="p-4 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 font-bold text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-purple-400 transition-colors">
                                                            <Package size={16} />
                                                        </div>
                                                        {product.name}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-400 font-mono text-xs">{product.barcode}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right text-slate-500 font-medium">{formatCurrency(product.costPrice)}</td>
                                                <td className="p-4 text-right font-black text-emerald-400 text-base">{formatCurrency(product.sellingPrice)}</td>
                                                <td className="p-4 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">{product.unit}</td>
                                                <td className="p-4 text-right text-slate-500 font-bold">{product.minStockLevel}</td>
                                                {canManageStock && (
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                onClick={() => openEdit(product)}
                                                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteId(product.id)}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-200 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-2">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{editingId ? 'Update Product' : 'Add New Product'}</h2>
                                <button onClick={() => { setIsAddModalOpen(false); resetForm() }} className="text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Product Name *"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <Input
                                        label="Barcode *"
                                        required
                                        value={formData.barcode}
                                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Category"
                                        list="category-options"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Select or Type New..."
                                    />
                                    <datalist id="category-options">
                                        {categories.map(c => <option key={c} value={c as string} />)}
                                    </datalist>
                                    <Input
                                        label="Brand"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <Input
                                        label="Qty"
                                        type="number"
                                        required
                                        value={formData.unitValue}
                                        onChange={e => setFormData({ ...formData, unitValue: e.target.value })}
                                        wrapperClassName="mb-0"
                                    />
                                    <div>
                                        <label className="label">Unit Type</label>
                                        <select
                                            className="input w-full appearance-none"
                                            value={formData.unitType}
                                            onChange={e => setFormData({ ...formData, unitType: e.target.value })}
                                        >
                                            <option value="piece">Piece</option>
                                            <option value="kg">Kg</option>
                                            <option value="gm">Gm</option>
                                            <option value="litre">Litre</option>
                                            <option value="ml">Ml</option>
                                            <option value="packet">Packet</option>
                                            <option value="box">Box</option>
                                            <option value="dozen">Dozen</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="Min Stock Alert"
                                        type="number"
                                        value={formData.minStockLevel}
                                        onChange={e => setFormData({ ...formData, minStockLevel: e.target.value })}
                                    />
                                    <Input
                                        label="Tax (%)"
                                        type="number"
                                        value={formData.taxPercent}
                                        onChange={e => setFormData({ ...formData, taxPercent: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                                    <Input
                                        label="Cost Price *"
                                        type="number" step="0.01"
                                        required
                                        value={formData.costPrice}
                                        onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                                        wrapperClassName="mb-0"
                                    />
                                    <Input
                                        label="Selling Price *"
                                        type="number" step="0.01"
                                        required
                                        value={formData.sellingPrice}
                                        onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                                        wrapperClassName="mb-0"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" isLoading={submitting}>
                                        Save Product
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Product?"
                message="Are you sure you want to delete this product? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    )
}
