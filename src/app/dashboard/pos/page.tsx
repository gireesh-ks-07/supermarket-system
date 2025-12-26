'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Trash, Plus, Minus, Search, CreditCard, Banknote, QrCode, RefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

type Product = {
    id: string
    name: string
    sellingPrice: number
    barcode: string
    taxPercent: number
    unit: string
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
    const tax = subTotal * 0.1 // Approx for demo
    const total = subTotal + tax

    const handleCheckout = async (mode: string) => {
        if (cart.length === 0) return
        setLoading(true)
        try {
            await fetch('/api/sales', {
                method: 'POST',
                body: JSON.stringify({ items: cart, paymentMode: mode })
            })
            setCart([])
            // Show success
        } catch (e) {
            alert('Error')
        } finally {
            setLoading(false)
        }
    }

    const [drafts, setDrafts] = useState<{ id: string, items: CartItem[], date: string }[]>([])
    const [showDrafts, setShowDrafts] = useState(false)

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
                <h1 className="text-2xl font-bold">Billing Terminal</h1>
                <div className="flex items-center gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDrafts(true)}
                        className="relative"
                    >
                        Drafts {drafts.length > 0 && <span className="ml-1 bg-purple-500 text-white text-[10px] px-1.5 rounded-full">{drafts.length}</span>}
                    </Button>
                    <div className="text-slate-400 text-sm">Shift ID: #8823 • Cashier: You</div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden">
                {/* Left: Cart */}
                <Card className="flex-[2] flex flex-col p-0 overflow-hidden min-h-[400px]">
                    <div className="p-4 bg-white/5 border-b border-white/5 grid grid-cols-12 gap-2 lg:gap-4 font-semibold text-slate-300 text-xs lg:text-sm">
                        <div className="col-span-1 hidden sm:block">#</div>
                        <div className="col-span-6 sm:col-span-5">Item</div>
                        <div className="col-span-2 text-center hidden sm:block">Price</div>
                        <div className="col-span-3 sm:col-span-2 text-center">Qty</div>
                        <div className="col-span-3 sm:col-span-2 text-right">Total</div>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-2">
                        {cart.map((item, idx) => (
                            <div key={item.cartId} className="group grid grid-cols-12 gap-2 lg:gap-4 items-center p-2 lg:p-3 rounded-lg hover:bg-white/5 transition-colors text-xs lg:text-sm">
                                <div className="col-span-1 text-slate-500 hidden sm:block">{idx + 1}</div>
                                <div className="col-span-6 sm:col-span-5">
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 lg:gap-2">
                                        <p className="font-medium truncate max-w-[120px] lg:max-w-none">{item.name}</p>
                                        <span className="text-[10px] px-1 lg:px-1.5 py-0.5 rounded bg-white/10 text-slate-300 w-fit">{item.unit}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 hidden sm:block">{item.barcode}</p>
                                    <p className="text-[10px] text-slate-500 sm:hidden">{formatCurrency(item.sellingPrice)}</p>
                                </div>
                                <div className="col-span-2 text-center text-slate-400 hidden sm:block">{formatCurrency(item.sellingPrice)}</div>
                                <div className="col-span-3 sm:col-span-2 flex items-center justify-center gap-1 sm:gap-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white/10 rounded"><Minus size={12} /></button>
                                    <span className="w-4 sm:w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white/10 rounded"><Plus size={12} /></button>
                                </div>
                                <div className="col-span-3 sm:col-span-2 text-right font-bold text-green-400 flex items-center justify-end gap-1 sm:gap-2">
                                    {formatCurrency(item.total)}
                                    <button onClick={() => removeItem(item.id)} className="text-red-400 lg:opacity-50 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"><Trash size={12} /></button>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-12">
                                <Search size={48} className="mb-4" />
                                <p className="text-sm">Scan barcode or search product</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right: Actions */}
                <div className="w-full lg:w-96 flex flex-col gap-4">
                    <Card className="p-4 relative z-20">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={20} />
                            <Input
                                ref={searchInputRef}
                                wrapperClassName="mb-0"
                                className="pl-10 h-10 bg-white/10 border-transparent focus:bg-white/20 text-white placeholder:text-slate-500"
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
                                            className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex justify-between items-center"
                                            onClick={() => {
                                                addToCart(product)
                                                setQuery('')
                                                setSearchResults([])
                                                searchInputRef.current?.focus()
                                            }}
                                        >
                                            <div>
                                                <p className="font-medium text-white text-sm">
                                                    {product.name}
                                                    <span className="ml-2 text-[10px] font-normal text-slate-400 bg-white/10 px-1 rounded">{product.unit}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-400">{product.barcode} • {formatCurrency(product.sellingPrice)}</p>
                                            </div>
                                            <Plus size={16} className="text-green-400" />
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

                    <Card className="flex flex-col justify-end p-4 lg:p-6">
                        <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6 text-slate-300 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (10%)</span>
                                <span>{formatCurrency(tax)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-3 lg:pt-4 border-t border-white/10">
                                <span className="text-base lg:text-lg">Total Payable</span>
                                <span className="text-2xl lg:text-4xl font-bold text-white">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-2 lg:mb-3">
                            <Button variant="secondary" onClick={saveDraft} disabled={cart.length === 0} className="col-span-2 justify-center py-2 lg:py-3 border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-white text-xs lg:text-sm">
                                + Hold Bill / New
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 lg:gap-3">
                            <Button variant="secondary" className="justify-center py-3 lg:py-4 bg-green-600 hover:bg-green-500 text-white text-xs lg:text-sm" onClick={() => handleCheckout('CASH')}>
                                <Banknote className="mr-2" size={18} /> CASH
                            </Button>
                            <Button variant="secondary" className="justify-center py-3 lg:py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs lg:text-sm" onClick={() => handleCheckout('CARD')}>
                                <CreditCard className="mr-2" size={18} /> CARD
                            </Button>
                            <Button variant="secondary" className="justify-center py-3 lg:py-4 col-span-2 bg-purple-600 hover:bg-purple-500 text-white text-xs lg:text-sm" onClick={() => handleCheckout('UPI')}>
                                <QrCode className="mr-2" size={18} /> UPI / QR
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
        </div>
    )
}
