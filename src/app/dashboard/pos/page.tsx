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
    expiredStock?: number
    batchId?: string | null
    batchNumber?: string | null
}

type CartItem = Product & {
    cartId: string
    quantity: number
    total: number
}

export default function POSPage() {
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const resultsContainerRef = useRef<HTMLDivElement>(null)
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

    // Scroll into view during keyboard navigation
    useEffect(() => {
        if (resultsContainerRef.current && searchResults.length > 0) {
            const selectedItem = resultsContainerRef.current.children[selectedIndex] as HTMLElement
            if (selectedItem) {
                selectedItem.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                })
            }
        }
    }, [selectedIndex, searchResults])

    const searchProduct = async (q: string) => {
        if (!q) {
            setSearchResults([])
            setSelectedIndex(0)
            return
        }
        setIsSearching(true)
        try {
            const res = await fetch(`/api/products/search?q=${q}`)
            const data = await res.json()
            if (data && data.length > 0) {
                // Check if this looks like a barcode scan (exact match and length >= 8)
                const exactBarcodeMatches = data.filter((item: any) => item.barcode === q)

                if (exactBarcodeMatches.length > 0 && q.length >= 8) {
                    // Auto-add the first available batch (FIFO, sorted by API)
                    addToCart(exactBarcodeMatches[0])
                    setQuery('')
                    setSearchResults([])
                } else {
                    setSearchResults(data)
                    setSelectedIndex(0)
                }
            } else {
                setSearchResults([])
                setSelectedIndex(0)
            }
        } catch (e) {
            console.error(e)
            setSearchResults([])
            setSelectedIndex(0)
        } finally {
            setIsSearching(false)
        }
    }

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id && p.batchId === product.batchId)
            if (existing) {
                return prev.map(p => (p.id === product.id && p.batchId === product.batchId) ? { ...p, quantity: p.quantity + 1, total: (p.quantity + 1) * Number(p.sellingPrice) } : p)
            }
            return [...prev, { ...product, cartId: Math.random().toString(), quantity: 1, total: Number(product.sellingPrice) }]
        })
    }

    const updateQuantity = (cartId: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.cartId === cartId) {
                const newQ = p.quantity + delta
                if (newQ <= 0) return p
                return { ...p, quantity: newQ, total: newQ * Number(p.sellingPrice) }
            }
            return p
        }))
    }

    const removeItem = (cartId: string) => {
        setCart(prev => prev.filter(p => p.cartId !== cartId))
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
                body: JSON.stringify({
                    items: cart,
                    paymentMode: mode,
                    flatNumber: flatNumber.trim(),
                    phoneNumber: phoneNumber.trim()
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Transaction failed')
            }

            setCart([])
            setFlatNumber('')
            setPhoneNumber('')
            refreshSuggestions()
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
    const [phoneNumber, setPhoneNumber] = useState('')
    const [customerInputMode, setCustomerInputMode] = useState<'FLAT' | 'NAME'>('FLAT')
    const [allFlats, setAllFlats] = useState<{ flatNumber: string, name: string, phone: string }[]>([])
    const [allNames, setAllNames] = useState<{ flatNumber: string, name: string, phone: string }[]>([])
    const [filteredSuggestions, setFilteredSuggestions] = useState<{ flatNumber: string, name: string, phone: string }[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestionSelectedIndex, setSuggestionSelectedIndex] = useState(-1)
    const [statusModal, setStatusModal] = useState<{ show: boolean, type: 'success' | 'error', message: string, title: string } | null>(null)
    const flatInputRef = useRef<HTMLInputElement>(null)
    const customerSuggestionsRef = useRef<HTMLDivElement>(null)

    const refreshSuggestions = () => {
        fetch('/api/customers/flats')
            .then(res => res.json())
            .then(data => {
                if (data.flats) setAllFlats(data.flats)
                if (data.names) setAllNames(data.names)
            })
            .catch(err => console.error('Failed to fetch suggestions', err))
    }

    useEffect(() => {
        refreshSuggestions()
    }, [])

    const handleFlatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        if (customerInputMode === 'FLAT') {
            val = val.toUpperCase().replace(/[^A-Z0-9]/g, '')
        } else {
            val = val.replace(/\b\w/g, l => l.toUpperCase())
        }

        setFlatNumber(val)

        const sourceData = customerInputMode === 'FLAT' ? allFlats : allNames
        if (val.length > 0) {
            const matches = sourceData.filter(f => {
                const searchField = customerInputMode === 'FLAT' ? (f.flatNumber || '') : (f.name || '')
                return searchField.toLowerCase().includes(val.toLowerCase())
            })
            setFilteredSuggestions(matches)
            setShowSuggestions(true)
            setSuggestionSelectedIndex(0)
        } else {
            setShowSuggestions(false)
            setSuggestionSelectedIndex(-1)
        }
    }

    const handleFlatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSuggestionSelectedIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSuggestionSelectedIndex(prev => (prev > 0 ? prev - 1 : 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (suggestionSelectedIndex >= 0 && suggestionSelectedIndex < filteredSuggestions.length) {
                selectFlat(filteredSuggestions[suggestionSelectedIndex])
                flatInputRef.current?.blur()
            }
        }
    }

    const selectFlat = (customer: { flatNumber: string, name: string, phone: string }) => {
        setFlatNumber(customerInputMode === 'FLAT' ? customer.flatNumber : customer.name)
        setPhoneNumber(customer.phone || '')
        setShowSuggestions(false)
    }

    useEffect(() => {
        if (showSuggestions && suggestionSelectedIndex >= 0 && customerSuggestionsRef.current) {
            const container = customerSuggestionsRef.current
            const selectedItem = container.children[suggestionSelectedIndex] as HTMLElement
            if (selectedItem) {
                selectedItem.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                })
            }
        }
    }, [suggestionSelectedIndex, showSuggestions])

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
                    <div className="hidden md:grid p-4 bg-slate-800/20 border-b border-white/5 grid-cols-12 gap-4 text-xs font-black uppercase tracking-widest text-slate-500 items-center">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4 pl-2">Item Description</div>
                        <div className="col-span-2 text-center">Unit Price</div>
                        <div className="col-span-3 text-center">Quantity</div>
                        <div className="col-span-2 text-right pr-4">Line Total</div>
                    </div>
                    <div className="flex-1 overflow-auto p-1.5 md:p-2 space-y-1.5 md:space-y-1 custom-scrollbar">
                        {cart.map((item, idx) => (
                            <div key={item.cartId} className="group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-3 md:p-3 rounded-xl md:rounded-lg bg-white/5 md:bg-transparent hover:bg-white/10 transition-all border border-white/5 md:border-0 items-center">
                                <div className="hidden md:flex col-span-1 items-center justify-start text-xs font-mono text-slate-600 pl-2">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </div>
                                <div className="md:col-span-4 flex justify-between items-center md:items-start md:block">
                                    <div className="flex-1">
                                        <div className="flex items-center flex-wrap gap-2">
                                            <p className="font-medium text-slate-200 text-sm md:text-[15px] leading-tight capitalize">{item.name.toLowerCase()}</p>
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5 uppercase tracking-tighter">{item.unit}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.batchNumber && (
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10 uppercase">
                                                    Batch: {item.batchNumber}
                                                </span>
                                            )}
                                            <p className="text-[10px] text-slate-600 font-mono tracking-wider">{item.barcode}</p>
                                        </div>
                                    </div>
                                    <div className="md:hidden text-right pl-4">
                                        <p className="text-xs font-bold text-slate-400">{formatCurrency(item.sellingPrice)}</p>
                                        <p className="text-[15px] font-black text-emerald-400">{formatCurrency(item.total)}</p>
                                    </div>
                                </div>
                                <div className="hidden md:flex col-span-2 items-center justify-center text-sm font-bold text-slate-400 font-mono">
                                    {formatCurrency(item.sellingPrice)}
                                </div>
                                <div className="flex md:col-span-3 items-center justify-between md:justify-center gap-4 mt-3 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-0">
                                    <div className="flex items-center gap-1.5 p-1 bg-slate-900/50 rounded-xl border border-white/5">
                                        <button
                                            onClick={() => updateQuantity(item.cartId, -1)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.001"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = Math.max(0, parseFloat(e.target.value) || 0)
                                                    setCart(prev => prev.map(p => p.cartId === item.cartId ? { ...p, quantity: val, total: val * Number(p.sellingPrice) } : p))
                                                }}
                                                className="w-16 bg-transparent border-0 text-center text-sm font-black text-white focus:ring-0 outline-none"
                                            />
                                            {item.stock > 0 && Math.abs(item.quantity - item.stock) > 0.0001 && (
                                                <button
                                                    onClick={() => {
                                                        const val = Number(item.stock)
                                                        setCart(prev => prev.map(p => p.cartId === item.cartId ? { ...p, quantity: val, total: val * Number(p.sellingPrice) } : p))
                                                    }}
                                                    className="px-1.5 py-1 bg-purple-500/10 hover:bg-purple-600 text-[8px] font-black text-purple-400 hover:text-white rounded-md border border-purple-500/20 transition-all uppercase"
                                                >
                                                    MAX
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => updateQuantity(item.cartId, 1)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.cartId)}
                                        className="text-slate-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                                <div className="hidden md:flex col-span-2 items-center justify-end pr-4">
                                    <span className="text-[17px] font-black text-emerald-400 tracking-tight">
                                        {formatCurrency(item.total)}
                                    </span>
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
                            <Input
                                ref={searchInputRef}
                                wrapperClassName="mb-0"
                                className="pr-16 h-10 md:h-12 bg-white/5 border-white/10 focus:bg-white/10 text-white placeholder:text-slate-500 rounded-xl"
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
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault()
                                        setSelectedIndex(prev => (prev + 1) % (searchResults.length || 1))
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault()
                                        setSelectedIndex(prev => (prev - 1 + (searchResults.length || 1)) % (searchResults.length || 1))
                                    } else if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (searchResults.length > 0) {
                                            const selected = searchResults[selectedIndex]
                                            if (selected && selected.stock > 0) {
                                                addToCart(selected)
                                                setQuery('')
                                                setSearchResults([])
                                                setSelectedIndex(0)
                                            }
                                        } else if (query.length > 1) {
                                            searchProduct(query)
                                        }
                                    } else if (e.key === 'Escape') {
                                        setSearchResults([])
                                        setSelectedIndex(0)
                                    }
                                }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {isSearching && <RefreshCcw className="w-4 h-4 text-purple-500 animate-spin" />}
                                <Search className="text-slate-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {(query.length > 1) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 max-h-72 overflow-auto divide-y divide-white/5 custom-scrollbar">
                                <div ref={resultsContainerRef}>
                                    {searchResults.length > 0 ? (
                                        searchResults.map((product, idx) => (
                                            <button
                                                key={product.id + (product.batchId || '')}
                                                className={clsx(
                                                    "w-full text-left p-4 flex justify-between items-center transition-all outline-none border-l-4",
                                                    product.stock > 0 ? "border-transparent" : "opacity-40 cursor-not-allowed border-red-500/20",
                                                    idx === selectedIndex && product.stock > 0 ? "bg-purple-500/10 border-purple-500 ring-1 ring-inset ring-purple-500/10" : "hover:bg-white/[0.02]"
                                                )}
                                                onMouseEnter={() => product.stock > 0 && setSelectedIndex(idx)}
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
                                                <div className="flex-1 pr-6">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-white text-[15px] tracking-tight capitalize">
                                                            {product.name.toLowerCase()}
                                                        </p>
                                                        <span className="text-[9px] font-black text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-white/5 uppercase">
                                                            {product.unit}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {product.batchNumber && (
                                                            <span className="text-[9px] font-bold text-purple-400 flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40" />
                                                                {product.batchNumber}
                                                            </span>
                                                        )}
                                                        <p className="text-[10px] text-slate-600 font-mono italic">{product.barcode}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Stock</span>
                                                            <span className={clsx(
                                                                "text-[10px] font-black",
                                                                product.stock <= 5 ? "text-amber-500" : "text-emerald-500"
                                                            )}>
                                                                {Number(product.stock).toFixed(3)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Price</p>
                                                    <p className="text-[18px] font-black text-emerald-400 leading-tight">
                                                        {formatCurrency(product.sellingPrice)}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-500">
                                            No products found matching "{query}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card className="flex-1 flex flex-col justify-end p-5 md:p-8 border-white/10 bg-[#0f172a]/80 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-slate-500 font-medium tracking-tight">
                                <span className="text-xs uppercase tracking-[0.2em]">Subtotal</span>
                                <span className="text-sm font-mono">{formatCurrency(subTotal)}</span>
                            </div>
                            <div className="pt-5 border-t border-white/5 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-1">Final Amount</p>
                                    <h2 className="text-lg md:text-2xl font-black text-slate-300 tracking-tight">Total Bill</h2>
                                </div>
                                <div className="text-right">
                                    <span className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Input Mode Toggle */}
                            <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-xl">
                                <button
                                    onClick={() => { setCustomerInputMode('FLAT'); setFlatNumber(''); }}
                                    className={clsx(
                                        "flex-1 py-2 text-[10px] font-black tracking-widest uppercase rounded-lg transition-all",
                                        customerInputMode === 'FLAT' ? "bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-900/10" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    Flat / Room
                                </button>
                                <button
                                    onClick={() => { setCustomerInputMode('NAME'); setFlatNumber(''); }}
                                    className={clsx(
                                        "flex-1 py-2 text-[10px] font-black tracking-widest uppercase rounded-lg transition-all",
                                        customerInputMode === 'NAME' ? "bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-900/10" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    Customer Name
                                </button>
                            </div>

                            {/* Customer Input */}
                            <div className="relative group rounded-2xl border border-white/10 bg-white/[0.02] focus-within:bg-white/[0.05] focus-within:border-purple-500/50 transition-all">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-500 group-focus-within:text-purple-400 uppercase tracking-widest transition-colors">
                                        {customerInputMode}:
                                    </span>
                                </div>
                                <input
                                    ref={flatInputRef}
                                    placeholder={customerInputMode === 'FLAT' ? "E.G. A101" : "E.G. Gireesh Ks"}
                                    value={flatNumber}
                                    onChange={handleFlatChange}
                                    onKeyDown={handleFlatKeyDown}
                                    onFocus={() => flatNumber && setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className="w-full pl-24 pr-4 py-4 bg-transparent text-white placeholder:text-slate-700 outline-none text-sm font-bold tracking-wide"
                                    autoComplete="off"
                                />
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                    <div
                                        ref={customerSuggestionsRef}
                                        className="absolute bottom-full left-0 right-0 mb-2 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-auto py-1 animate-in slide-in-from-bottom-2"
                                    >
                                        {filteredSuggestions.map((item, i) => (
                                            <button
                                                key={i}
                                                className={`w-full text-left px-4 py-3 text-white text-sm font-bold border-l-4 transition-all ${i === suggestionSelectedIndex ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'border-transparent hover:bg-white/5'}`}
                                                onClick={() => selectFlat(item)}
                                                onMouseEnter={() => setSuggestionSelectedIndex(i)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{customerInputMode === 'FLAT' ? item.flatNumber : item.name}</span>
                                                    {item.phone && <span className="text-[10px] text-slate-500 font-mono">{item.phone}</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Number Entry */}
                            <div className="relative group rounded-2xl border border-white/10 bg-white/[0.02] focus-within:bg-white/[0.05] focus-within:border-emerald-500/50 transition-all">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-500 group-focus-within:text-emerald-400 uppercase tracking-widest transition-colors">
                                        Mobile:
                                    </span>
                                </div>
                                <input
                                    placeholder="Optional Mobile Number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="w-full pl-24 pr-4 py-4 bg-transparent text-white placeholder:text-slate-700 outline-none text-sm font-bold tracking-wide"
                                    autoComplete="off"
                                />
                            </div>

                            {/* Drafts / Hold Button */}
                            <Button
                                variant="secondary"
                                className="w-full bg-slate-800/40 border border-white/10 hover:bg-slate-700/60 text-slate-300 hover:text-white font-bold text-[10px] tracking-[0.2em] uppercase py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-inner"
                                onClick={() => {
                                    if (cart.length > 0) {
                                        const newDraft = { id: Math.random().toString(), items: [...cart], date: new Date().toISOString() }
                                        setDrafts([newDraft, ...drafts])
                                        setCart([])
                                    }
                                }}
                                disabled={cart.length === 0}
                            >
                                <RefreshCcw size={14} className={clsx(loading && "animate-spin")} />
                                HOLD / DRAFT BILL
                            </Button>

                            {/* Main Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    className="relative overflow-hidden h-14 bg-teal-600/90 hover:bg-teal-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                                    onClick={() => handleCheckout('CASH')}
                                    disabled={loading || cart.length === 0}
                                >
                                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Banknote size={20} className="group-hover:scale-110 transition-transform" />}
                                    <span className="text-[10px] tracking-widest uppercase">CASH</span>
                                </Button>

                                <Button
                                    className="relative overflow-hidden h-14 bg-blue-600/90 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                                    onClick={() => handleCheckout('CREDIT')}
                                    disabled={loading || cart.length === 0}
                                >
                                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <CreditCard size={20} className="group-hover:scale-110 transition-transform" />}
                                    <span className="text-[10px] tracking-widest uppercase">CREDIT</span>
                                </Button>

                                <Button
                                    className="col-span-2 relative overflow-hidden h-14 bg-gradient-to-r from-indigo-700 to-purple-800 hover:from-indigo-600 hover:to-purple-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 group"
                                    onClick={() => handleCheckout('UPI')}
                                    disabled={loading || cart.length === 0}
                                >
                                    {loading ? <RefreshCcw className="w-6 h-6 animate-spin" /> : (
                                        <>
                                            <QrCode size={22} className="group-hover:rotate-12 transition-transform" />
                                            <span className="text-[11px] tracking-[0.2em] uppercase">COMPLETE UPI / SCAN</span>
                                        </>
                                    )}
                                </Button>
                            </div>
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
