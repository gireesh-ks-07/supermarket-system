'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Trash, Plus, Minus, Search, CreditCard, Banknote, QrCode, RefreshCcw, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

type Product = {
    id: string
    name: string
    sellingPrice: number
    barcode: string
    taxPercent: number
    unit: string
    stock: number
    expiredStock?: number // Added
}

type CartItem = Product & {
    cartId: string
    quantity: number
    total: number
}

export default function POSPage() {
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Auto focus search for barcode scanning
    useEffect(() => {
        const focusSearch = () => {
            if (document.activeElement?.tagName !== 'INPUT') {
                searchInputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', focusSearch)
        return () => window.removeEventListener('keydown', focusSearch)
    }, [])

    const searchProduct = async (q: string) => {
        if (!q) {
            setSearchResults([])
            return
        }
        try {
            const res = await fetch(`/api/products/search?q=${q}`)
            const data = await res.json()
            if (data) {
                // If exact barcode match, we might still want to add immediately if triggered by ENTER
                // But generally populating the list is safer UX unless we are sure it's a barcode scanner
                if (data.length === 1 && data[0].barcode === q) {
                    // Exact barcode match usually implies scanner
                    addToCart(data[0])
                    setQuery('')
                    setSearchResults([])
                } else {
                    setSearchResults(data)
                }
            }
        } catch (e) { console.error(e) }
    }

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id)
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1, total: (p.quantity + 1) * Number(p.sellingPrice) } : p)
            }
            return [...prev, { ...product, cartId: Math.random().toString(), quantity: 1, total: Number(product.sellingPrice) }]
        })
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.id === id) {
                const newQ = p.quantity + delta
                if (newQ <= 0) return p
                return { ...p, quantity: newQ, total: newQ * Number(p.sellingPrice) }
            }
            return p
        }))
    }

    const removeItem = (id: string) => {
        setCart(prev => prev.filter(p => p.id !== id))
    }

    const subTotal = cart.reduce((acc, item) => acc + item.total, 0)
    const total = subTotal

    const handleCheckout = async (mode: string) => {
        if (cart.length === 0) return
        if (mode === 'CREDIT' && !flatNumber) {
            setStatusModal({
                show: true,
                type: 'error',
                title: 'Missing Flat Number',
                message: 'Please enter a flat number to record this credit transaction.'
            })
            return
        }
        setLoading(true)
        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                body: JSON.stringify({ items: cart, paymentMode: mode, flatNumber: flatNumber.trim() })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Transaction failed')
            }

            setCart([])
            setFlatNumber('')
            setStatusModal({
                show: true,
                type: 'success',
                title: 'Sale Successful!',
                message: 'Transaction has been completed and inventory updated.'
            })
        } catch (e: any) {
            setStatusModal({
                show: true,
                type: 'error',
                title: 'Transaction Failed',
                message: e.message || 'There was an issue processing the sale. Please try again.'
            })
        } finally {
            setLoading(false)
        }
    }

    const [drafts, setDrafts] = useState<{ id: string, items: CartItem[], date: string }[]>([])
    const [showDrafts, setShowDrafts] = useState(false)
    const [flatNumber, setFlatNumber] = useState('')
    const [allFlats, setAllFlats] = useState<string[]>([])
    const [filteredFlats, setFilteredFlats] = useState<string[]>([])
    const [showFlatSuggestions, setShowFlatSuggestions] = useState(false)
    const [flatSelectedIndex, setFlatSelectedIndex] = useState(-1)
    const [statusModal, setStatusModal] = useState<{ show: boolean, type: 'success' | 'error', message: string, title: string } | null>(null)
    const flatInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        // Fetch all flats for autocomplete
        fetch('/api/customers/flats')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAllFlats(data)
            })
            .catch(err => console.error('Failed to fetch flats', err))
    }, [])

    const handleFlatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setFlatNumber(val)
        if (val.length > 0) {
            const matches = allFlats.filter(f => f.toLowerCase().includes(val.toLowerCase()))
            setFilteredFlats(matches)
            setShowFlatSuggestions(true)
            setFlatSelectedIndex(0) // Default to first item
        } else {
            setShowFlatSuggestions(false)
            setFlatSelectedIndex(-1)
        }
    }

    const handleFlatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showFlatSuggestions || filteredFlats.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setFlatSelectedIndex(prev => (prev < filteredFlats.length - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setFlatSelectedIndex(prev => (prev > 0 ? prev - 1 : 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (flatSelectedIndex >= 0 && flatSelectedIndex < filteredFlats.length) {
                selectFlat(filteredFlats[flatSelectedIndex])
                flatInputRef.current?.blur() // Optional: Move focus or keep it
            }
        }
    }

    const selectFlat = (flat: string) => {
        setFlatNumber(flat)
        setShowFlatSuggestions(false)
    }

    useEffect(() => {
        const saved = localStorage.getItem('pos_drafts')
        if (saved) setDrafts(JSON.parse(saved))
    }, [])

    const saveDraft = () => {
        if (cart.length === 0) return
        const newDraft = {
            id: Date.now().toString(),
            items: cart,
            date: new Date().toLocaleTimeString()
        }
        const updated = [...drafts, newDraft]
        setDrafts(updated)
        localStorage.setItem('pos_drafts', JSON.stringify(updated))
        setCart([])
    }

    const restoreDraft = (id: string) => {
        const draft = drafts.find(d => d.id === id)
        if (draft) {
            setCart(draft.items)
            const updated = drafts.filter(d => d.id !== id)
            setDrafts(updated)
            localStorage.setItem('pos_drafts', JSON.stringify(updated))
            setShowDrafts(false)
        }
    }

    const deleteDraft = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const updated = drafts.filter(d => d.id !== id)
        setDrafts(updated)
        localStorage.setItem('pos_drafts', JSON.stringify(updated))
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-xl md:text-2xl font-bold">Billing Terminal</h1>
                <div className="flex items-center gap-2 md:gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDrafts(true)}
                        className="relative"
                    >
                        Drafts {drafts.length > 0 && <span className="ml-1 bg-purple-500 text-white text-[10px] px-1.5 rounded-full">{drafts.length}</span>}
                    </Button>
                    <div className="hidden md:block text-slate-400 text-sm">Shift ID: #8823 • Cashier: You</div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 gap-4 md:gap-6 overflow-hidden md:overflow-hidden overflow-y-auto">
                {/* Left: Cart */}
                <Card className="flex-1 md:flex-[2] flex flex-col p-0 overflow-hidden min-h-[400px]">
                    <div className="hidden md:grid p-4 bg-white/5 border-b border-white/5 grid-cols-12 gap-4 font-semibold text-slate-300">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-center">Price</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-2 text-right">Total</div>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-2">
                        {cart.map((item, idx) => (
                            <div key={item.cartId} className="group grid grid-cols-6 md:grid-cols-12 gap-2 md:gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors text-sm border-b border-white/5 md:border-0 last:border-0">
                                <div className="hidden md:block col-span-1 text-slate-500">{idx + 1}</div>
                                <div className="col-span-5">
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-medium truncate max-w-[120px] md:max-w-none">{item.name}</p>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-slate-300">{item.unit}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{item.barcode}</p>
                                </div>
                                <div className="hidden md:block col-span-2 text-center text-slate-400">{formatCurrency(item.sellingPrice)}</div>
                                <div className="col-span-3 md:col-span-2 flex items-center justify-center gap-1">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white/10 rounded"><Minus size={14} /></button>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseFloat(e.target.value) || 0)
                                            setCart(prev => prev.map(p => p.id === item.id ? { ...p, quantity: val, total: val * Number(p.sellingPrice) } : p))
                                        }}
                                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-sm focus:border-purple-500 outline-none"
                                    />
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white/10 rounded"><Plus size={14} /></button>
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right font-bold text-green-400 flex items-center justify-end gap-2">
                                    {formatCurrency(item.total)}
                                    <button onClick={() => removeItem(item.id)} className="text-red-400 p-1 hover:bg-white/10 rounded"><Trash size={14} /></button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                <Search size={48} className="mb-4" />
                                <p>Scan barcode or search product</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right: Actions */}
                <div className="flex-1 flex flex-col gap-4">
                    <Card className="p-4 relative z-20">
                        <div className="relative">
                            <Search className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={20} />
                            <Input
                                ref={searchInputRef}
                                wrapperClassName="mb-0"
                                className="pr-10 h-10 bg-white/10 border-transparent focus:bg-white/20 text-white placeholder:text-slate-500"
                                placeholder="Scan / Search..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                    if (e.target.value.length > 1) {
                                        searchProduct(e.target.value)
                                    } else {
                                        setSearchResults([])
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (searchResults.length === 1) {
                                            addToCart(searchResults[0])
                                            setQuery('')
                                            setSearchResults([])
                                        } else if (searchResults.length > 1) {
                                            // Focus list?
                                        } else {
                                            searchProduct(query)
                                        }
                                    }
                                }}
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {(query.length > 1) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-auto">
                                {searchResults.length > 0 ? (
                                    searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            className={`w-full text-left p-3 border-b border-white/5 last:border-0 flex justify-between items-center ${product.stock > 0 ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'}`}
                                            disabled={product.stock <= 0}
                                            onClick={() => {
                                                if (product.stock > 0) {
                                                    addToCart(product)
                                                    setQuery('')
                                                    setSearchResults([])
                                                    searchInputRef.current?.focus()
                                                }
                                            }}
                                        >
                                            <div>
                                                <p className="font-medium text-white">
                                                    {product.name}
                                                    <span className="ml-2 text-xs font-normal text-slate-400 bg-white/10 px-1 rounded">{product.unit}</span>
                                                    {product.stock <= 0 && <span className="ml-2 text-xs font-bold text-red-500 uppercase">Out of Stock</span>}
                                                    {product.stock > 0 && product.expiredStock === product.stock && <span className="ml-2 text-xs font-bold text-red-500 uppercase">Expired</span>}
                                                    {product.stock > 0 && product.expiredStock! > 0 && product.expiredStock !== product.stock && <span className="ml-2 text-xs font-bold text-yellow-500 uppercase">Expiring</span>}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {product.barcode} • {formatCurrency(product.sellingPrice)} • Stock: {product.stock}
                                                </p>
                                            </div>
                                            {product.stock > 0 && <Plus size={16} className="text-green-400" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No products found
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    <Card className="flex-1 flex flex-col justify-end p-6">
                        <div className="space-y-3 mb-6 text-slate-300">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subTotal)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-white/10">
                                <span className="text-lg">Total Payable</span>
                                <span className="text-4xl font-bold text-white">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3 relative">
                            <Input
                                ref={flatInputRef}
                                placeholder="Enter Flat Number (Required for Credit)"
                                value={flatNumber}
                                onChange={handleFlatChange}
                                onKeyDown={handleFlatKeyDown}
                                onFocus={() => flatNumber && setShowFlatSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowFlatSuggestions(false), 200)}
                                className="col-span-2 bg-white/10 border-transparent focus:bg-white/20 text-white placeholder:text-slate-500"
                                autoComplete="off"
                            />
                            {showFlatSuggestions && filteredFlats.length > 0 && (
                                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl z-50 max-h-40 overflow-auto">
                                    {filteredFlats.map((flat, i) => (
                                        <button
                                            key={i}
                                            className={`w-full text-left p-2 text-white text-sm ${i === flatSelectedIndex ? 'bg-purple-600' : 'hover:bg-white/5'}`}
                                            onClick={() => selectFlat(flat)}
                                            onMouseEnter={() => setFlatSelectedIndex(i)}
                                        >
                                            {flat}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <Button variant="secondary" onClick={saveDraft} disabled={cart.length === 0} className="col-span-2 justify-center py-3 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white">
                                + Hold Bill / New
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" className="justify-center py-4 bg-green-600 hover:bg-green-500 text-white" onClick={() => handleCheckout('CASH')}>
                                <Banknote className="mr-2" /> CASH
                            </Button>
                            <Button variant="secondary" className="justify-center py-4 bg-blue-600 hover:bg-blue-500 text-white" onClick={() => handleCheckout('CREDIT')}>
                                <CreditCard className="mr-2" /> CREDIT
                            </Button>
                            <Button variant="secondary" className="justify-center py-4 col-span-2 bg-purple-600 hover:bg-purple-500 text-white" onClick={() => handleCheckout('UPI')}>
                                <QrCode className="mr-2" /> UPI / QR
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Drafts Modal */}
            {showDrafts && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-lg max-h-[80vh] flex flex-col p-0">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Held Bills / Drafts</h3>
                            <button onClick={() => setShowDrafts(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {drafts.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No held bills found.</p>
                            ) : (
                                drafts.map((draft) => (
                                    <div key={draft.id} onClick={() => restoreDraft(draft.id)} className="flex justify-between items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer border border-transparent hover:border-purple-500/50 transition-all">
                                        <div>
                                            <p className="font-bold text-white mb-1">Bill #{draft.id.slice(-4)}</p>
                                            <p className="text-xs text-slate-400">{draft.date} • {draft.items.length} Items</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-green-400 font-bold">
                                                {formatCurrency(draft.items.reduce((acc, i) => acc + i.total, 0))}
                                            </span>
                                            <button onClick={(e) => deleteDraft(draft.id, e)} className="p-2 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400">
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}
            {/* Custom Status Modal */}
            {statusModal?.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className={`w-full max-w-sm border-2 overflow-hidden shadow-2xl ${statusModal.type === 'success' ? 'border-emerald-500/50 shadow-emerald-500/20' : 'border-red-500/50 shadow-red-500/20'}`}>
                        <div className="p-6 text-center space-y-4">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${statusModal.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                {statusModal.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">{statusModal.title}</h3>
                                <p className="text-slate-400 text-sm">{statusModal.message}</p>
                            </div>
                            <Button
                                className={`w-full mt-4 ${statusModal.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-600 hover:bg-red-700'}`}
                                onClick={() => setStatusModal(null)}
                            >
                                Continue
                            </Button>
                        </div>
                        {/* Progress Bar for Auto-dismiss (optional) but for POS acknowledgement is better */}
                        <div className={`h-1 w-full ${statusModal.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} opacity-30`} />
                    </Card>
                </div>
            )}
        </div>
    )
}
