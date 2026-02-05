'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Trash, Plus, Minus, Search, CreditCard, Banknote, QrCode, RefreshCcw, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { clsx } from 'clsx'

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

    const [activeTab, setActiveTab] = useState<'cart' | 'actions'>('cart')

    return (
        <div className="flex flex-col h-full gap-2 md:gap-4">
            <div className="flex justify-between items-center mb-1 md:mb-2 px-1">
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Billing Terminal</h1>
                <div className="flex items-center gap-2 md:gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDrafts(true)}
                        className="relative h-9 px-3 text-sm"
                    >
                        Drafts {drafts.length > 0 && <span className="ml-1 bg-purple-500 text-white text-[10px] px-1.5 rounded-full">{drafts.length}</span>}
                    </Button>
                    <div className="hidden lg:block text-slate-400 text-sm">Shift ID: #8823 • Cashier: You</div>
                </div>
            </div>

            {/* Mobile Tabs */}
            <div className="flex md:hidden bg-slate-900/50 p-1 rounded-xl border border-white/5 mb-2">
                <button
                    onClick={() => setActiveTab('cart')}
                    className={clsx(
                        "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                        activeTab === 'cart' ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-slate-400"
                    )}
                >
                    Cart ({cart.length})
                </button>
                <button
                    onClick={() => setActiveTab('actions')}
                    className={clsx(
                        "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                        activeTab === 'actions' ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-slate-400"
                    )}
                >
                    Checkout & Search
                </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 gap-4 md:gap-6 overflow-hidden">
                {/* Left: Cart */}
                <Card className={clsx(
                    "flex-1 md:flex-[2] flex flex-col p-0 overflow-hidden min-h-[300px] border-white/10",
                    activeTab !== 'cart' && "hidden md:flex"
                )}>
                    <div className="hidden md:grid p-4 bg-white/5 border-b border-white/5 grid-cols-12 gap-4 font-semibold text-slate-300">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-center">Price</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-2 text-right">Total</div>
                    </div>
                    <div className="flex-1 overflow-auto p-1.5 md:p-2 space-y-1.5 md:space-y-2 custom-scrollbar">
                        {cart.map((item, idx) => (
                            <div key={item.cartId} className="group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-lg bg-white/5 md:bg-transparent hover:bg-white/10 transition-all border border-white/5 md:border-0">
                                <div className="hidden md:block col-span-1 text-slate-500">{idx + 1}</div>
                                <div className="md:col-span-5 flex justify-between items-start md:block">
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-bold text-white md:max-w-none">{item.name}</p>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400">{item.unit}</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-slate-500 font-mono mt-0.5">{item.barcode}</p>
                                    </div>
                                    <div className="md:hidden text-right">
                                        <p className="text-xs text-slate-400">{formatCurrency(item.sellingPrice)} / {item.unit}</p>
                                        <p className="font-bold text-green-400">{formatCurrency(item.total)}</p>
                                    </div>
                                </div>
                                <div className="hidden md:block col-span-2 text-center text-slate-400">{formatCurrency(item.sellingPrice)}</div>
                                <div className="flex items-center justify-between md:justify-center md:col-span-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t border-white/5 md:border-0">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-2 md:p-1 bg-white/5 md:hover:bg-white/10 rounded-lg"><Minus size={14} /></button>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.001"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const val = Math.max(0, parseFloat(e.target.value) || 0)
                                                setCart(prev => prev.map(p => p.id === item.id ? { ...p, quantity: val, total: val * Number(p.sellingPrice) } : p))
                                            }}
                                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-sm focus:border-purple-500 outline-none"
                                        />
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-2 md:p-1 bg-white/5 md:hover:bg-white/10 rounded-lg"><Plus size={14} /></button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="hidden md:block md:col-span-2 text-right font-bold text-green-400">
                                            {formatCurrency(item.total)}
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-red-400 p-2 md:p-1 bg-red-500/10 md:bg-transparent md:hover:bg-white/10 rounded-lg transition-colors"><Trash size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-12">
                                <Search size={48} className="mb-4 text-slate-600" />
                                <p className="text-sm font-medium">Cart is empty</p>
                                <button
                                    onClick={() => setActiveTab('actions')}
                                    className="md:hidden mt-4 text-purple-400 text-xs underline"
                                >
                                    Go to Search
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right: Actions */}
                <div className={clsx(
                    "flex-1 flex flex-col gap-4 overflow-hidden",
                    activeTab !== 'actions' && "hidden md:flex"
                )}>
                    <Card className="p-3 md:p-4 relative z-20 border-white/10 bg-slate-900/40 backdrop-blur-md">
                        <div className="relative">
                            <Search className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={20} />
                            <Input
                                ref={searchInputRef}
                                wrapperClassName="mb-0"
                                className="pr-10 h-10 md:h-12 bg-white/5 border-white/10 focus:bg-white/10 text-white placeholder:text-slate-500 rounded-xl"
                                placeholder="Scan / Search Product..."
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
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 max-h-72 overflow-auto divide-y divide-white/5">
                                {searchResults.length > 0 ? (
                                    searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            className={`w-full text-left p-4 flex justify-between items-center transition-all ${product.stock > 0 ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'}`}
                                            disabled={product.stock <= 0}
                                            onClick={() => {
                                                if (product.stock > 0) {
                                                    addToCart(product)
                                                    setQuery('')
                                                    setSearchResults([])
                                                    if (!window.matchMedia("(max-width: 768px)").matches) {
                                                        searchInputRef.current?.focus()
                                                    }
                                                }
                                            }}
                                        >
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <p className="font-bold text-white leading-tight">{product.name}</p>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">{product.unit}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-slate-500 font-mono">{product.barcode}</p>
                                                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                    <p className="text-[10px] text-slate-400 font-bold">Stock: {product.stock}</p>
                                                </div>
                                                <div className="mt-1 flex gap-1">
                                                    {product.stock <= 0 && <span className="text-[9px] font-bold text-red-500 uppercase px-1 border border-red-500/30 rounded">Out of Stock</span>}
                                                    {product.stock > 0 && product.expiredStock === product.stock && <span className="text-[9px] font-bold text-red-500 uppercase px-1 border border-red-500/30 rounded">Expired</span>}
                                                    {product.stock > 0 && product.expiredStock! > 0 && product.expiredStock !== product.stock && <span className="text-[9px] font-bold text-yellow-500 uppercase px-1 border border-yellow-500/30 rounded">Expiring</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-green-400">{formatCurrency(product.sellingPrice)}</p>
                                                <div className="inline-flex p-1.5 bg-purple-500/20 text-purple-400 rounded-lg mt-1 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                                    <Plus size={16} />
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 text-sm italic">
                                        No products match "{query}"
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    <Card className="flex-1 flex flex-col justify-end p-4 md:p-6 border-white/10 bg-slate-900/60 backdrop-blur-xl">
                        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 text-slate-300">
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span>{formatCurrency(subTotal)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-3 md:pt-4 border-t border-white/10">
                                <span className="text-lg md:text-xl font-medium">Total Bill</span>
                                <span className="text-3xl md:text-5xl font-black text-white tracking-tighter shadow-sm">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3 relative">
                            <div className="col-span-2 relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <span className="text-xs text-slate-500 group-focus-within:text-purple-400 transition-colors uppercase font-bold tracking-widest">Flat:</span>
                                </div>
                                <input
                                    ref={flatInputRef}
                                    placeholder="Number..."
                                    value={flatNumber}
                                    onChange={handleFlatChange}
                                    onKeyDown={handleFlatKeyDown}
                                    onFocus={() => flatNumber && setShowFlatSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowFlatSuggestions(false), 200)}
                                    className="w-full pl-16 pr-4 py-3 bg-white/5 border border-white/10 focus:border-purple-500/50 focus:bg-white/10 text-white placeholder:text-slate-600 rounded-xl outline-none transition-all text-sm font-bold"
                                    autoComplete="off"
                                />
                                {showFlatSuggestions && filteredFlats.length > 0 && (
                                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-auto py-1 animate-in slide-in-from-bottom-2">
                                        {filteredFlats.map((flat, i) => (
                                            <button
                                                key={i}
                                                className={`w-full text-left px-4 py-2.5 text-white text-sm font-medium border-l-4 transition-all ${i === flatSelectedIndex ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'border-transparent hover:bg-white/5'}`}
                                                onClick={() => selectFlat(flat)}
                                                onMouseEnter={() => setFlatSelectedIndex(i)}
                                            >
                                                {flat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button variant="secondary" onClick={saveDraft} disabled={cart.length === 0} className="col-span-2 justify-center py-2.5 md:py-3 border-dashed border-white/10 text-slate-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider">
                                <RefreshCcw size={16} className="mr-2" /> Hold Bill
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <Button variant="secondary" className="justify-center py-4 md:py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-900/20 font-black text-sm md:text-base transition-all active:scale-95" onClick={() => handleCheckout('CASH')}>
                                <Banknote className="mr-2" size={20} /> CASH
                            </Button>
                            <Button variant="secondary" className="justify-center py-4 md:py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-900/20 font-black text-sm md:text-base transition-all active:scale-95" onClick={() => handleCheckout('CREDIT')}>
                                <CreditCard className="mr-2" size={20} /> CREDIT
                            </Button>
                            <Button variant="secondary" className="justify-center py-4 md:py-6 col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-purple-900/30 font-black text-sm md:text-base transition-all active:scale-95" onClick={() => handleCheckout('UPI')}>
                                <QrCode className="mr-2" size={20} /> UPI / SCAN
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
                    <Card className={`w-full max-w-sm border-2 overflow-hidden shadow-2xl ${statusModal?.type === 'success' ? 'border-emerald-500/50 shadow-emerald-500/20' : 'border-red-500/50 shadow-red-500/20'}`}>
                        <div className="p-6 text-center space-y-4">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${statusModal?.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                {statusModal?.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">{statusModal?.title}</h3>
                                <p className="text-slate-400 text-sm">{statusModal?.message}</p>
                            </div>
                            <Button
                                className={`w-full mt-4 ${statusModal?.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-600 hover:bg-red-700'}`}
                                onClick={() => setStatusModal(null)}
                            >
                                Continue
                            </Button>
                        </div>
                        {/* Progress Bar for Auto-dismiss (optional) but for POS acknowledgement is better */}
                        <div className={`h-1 w-full ${statusModal?.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} opacity-30`} />
                    </Card>
                </div>
            )}
        </div>
    )
}
