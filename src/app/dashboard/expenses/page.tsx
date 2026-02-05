"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { Plus, Search, Calendar, Filter, X, Wallet, Tag } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function ExpensesPage() {
    const { user } = useUser()
    const [period, setPeriod] = useState('daily')
    const [customDate, setCustomDate] = useState({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    })
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    // Modal State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newExpense, setNewExpense] = useState({
        title: '',
        amount: '',
        category: 'Miscellaneous',
        date: new Date().toISOString().split('T')[0],
        note: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Construct API URL
    const getApiUrl = () => {
        let url = `/api/expenses?period=${period}`
        if (period === 'daily') url += `&date=${selectedDate}`
        if (period === 'custom') url += `&from=${customDate.from}&to=${customDate.to}`
        // Weekly/monthly/yearly usually default to current date in API if not passed, 
        // passing selectedDate ensures we can view past weeks/months if we implemented date picker for them.
        if (['weekly', 'monthly', 'yearly'].includes(period)) url += `&date=${selectedDate}`
        return url
    }

    const { data, mutate, isLoading } = useSWR(getApiUrl(), (url) => fetch(url).then(res => res.json()))

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newExpense.title || !newExpense.amount) return

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            })

            if (!res.ok) throw new Error('Failed to add expense')

            toast.success('Expense added successfully')
            setIsAddOpen(false)
            setNewExpense({
                title: '',
                amount: '',
                category: 'Miscellaneous',
                date: new Date().toISOString().split('T')[0],
                note: ''
            })
            mutate() // Refresh data
        } catch (error) {
            toast.error('Failed to add expense')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-400 shadow-lg shadow-red-900/10">
                        <Wallet size={28} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                            Expense Management
                        </h1>
                        <p className="text-sm md:text-sm text-slate-500 font-bold mt-0.5">Track and manage store costs</p>
                    </div>
                </div>

                <Button
                    variant="primary"
                    onClick={() => setIsAddOpen(true)}
                    className="shadow-xl shadow-purple-900/40 h-12 md:h-10 text-sm font-bold rounded-xl"
                >
                    <Plus size={18} className="mr-2" /> Add New Expense
                </Button>
            </div>

            {/* Filters */}
            <Card className="flex flex-wrap items-center gap-2 p-1 bg-slate-900/60 border-white/5 w-full md:w-fit backdrop-blur-md overflow-x-auto no-scrollbar">
                {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${period === p
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}

                <div className="w-px h-6 bg-white/10 mx-1 hidden md:block"></div>

                {period === 'daily' && (
                    <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5">
                        <Calendar size={14} className="text-slate-500" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-sm md:text-xs font-bold focus:ring-0 outline-none text-white [color-scheme:dark] cursor-pointer"
                        />
                    </div>
                )}
            </Card>

            {/* Total Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/20 shadow-xl shadow-red-900/10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-red-400">Total Outflow</span>
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <p className="text-4xl font-bold text-white tracking-tighter">
                        {isLoading ? '...' : formatCurrency(data?.totalAmount || 0)}
                    </p>
                    <div className="mt-4 pt-4 border-t border-red-500/10 flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-500">Context:</span>
                        <span className="text-sm font-bold text-slate-300">{period}</span>
                    </div>
                </Card>
            </div>

            {/* List */}
            <div className="flex-1 overflow-hidden">
                <Card className="p-0 overflow-hidden border-white/10 bg-slate-900/40">
                    <div className="hidden md:flex text-sm text-slate-500 font-bold p-4 border-b border-white/5 bg-white/5">
                        <div className="flex-1">Expense Details</div>
                        <div className="w-32 text-right">Amount</div>
                        <div className="w-32 text-right">Date</div>
                        <div className="w-32 text-right">User</div>
                    </div>

                    <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-12 text-center text-slate-500 font-bold text-xs">
                                <div className="inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p>Loading History...</p>
                            </div>
                        ) : (data?.expenses || []).length === 0 ? (
                            <div className="p-12 text-center text-slate-500 font-bold text-xs flex flex-col items-center gap-4">
                                <Search size={40} className="opacity-10" />
                                <p>No expenses recorded</p>
                            </div>
                        ) : (data.expenses.map((expense: any) => (
                            <div key={expense.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:bg-white/5 transition-all group border-b border-white/5 last:border-0">
                                <div className="flex-1 flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Tag size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm md:text-base leading-tight">{expense.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-white/5">
                                                {expense.category}
                                            </span>
                                            {expense.note && <span className="text-sm text-slate-500 font-medium truncate max-w-[200px]">/ {expense.note}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:block items-center justify-between pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                                    <div className="md:w-32 text-left md:text-right font-bold text-red-500 text-lg">
                                        -{formatCurrency(Number(expense.amount))}
                                    </div>
                                    <div className="md:hidden flex flex-col text-right">
                                        <span className="text-sm text-slate-500 font-bold">{new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                        <span className="text-[8px] text-slate-600 font-bold">{expense.user?.name || 'Admin'}</span>
                                    </div>
                                </div>

                                <div className="hidden md:block w-32 text-right text-xs font-bold text-slate-500">
                                    {new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="hidden md:block w-32 text-right text-sm font-bold text-slate-600 truncate">
                                    {expense.user?.name || 'Unknown'}
                                </div>
                            </div>
                        )))}
                    </div>
                </Card>
            </div>

            {/* Add Expense Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                            <h3 className="font-bold text-white">Add New Expense</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Shop Cleaning"
                                    value={newExpense.title}
                                    onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="0.00"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                                    <select
                                        value={['Rent', 'Electricity', 'Water', 'Salaries', 'Maintenance', 'Internet', 'Purchase', 'Transportation', 'Miscellaneous'].includes(newExpense.category) ? newExpense.category : 'Other'}
                                        onChange={e => {
                                            const val = e.target.value
                                            setNewExpense({ ...newExpense, category: val === 'Other' ? '' : val })
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    >
                                        {['Rent', 'Electricity', 'Water', 'Salaries', 'Maintenance', 'Internet', 'Purchase', 'Transportation', 'Miscellaneous', 'Other'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    {!['Rent', 'Electricity', 'Water', 'Salaries', 'Maintenance', 'Internet', 'Purchase', 'Transportation', 'Miscellaneous'].includes(newExpense.category) && (
                                        <input
                                            type="text"
                                            placeholder="Enter Custom Category"
                                            value={newExpense.category}
                                            onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                            className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Note (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={newExpense.note}
                                    onChange={e => setNewExpense({ ...newExpense, note: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Add Expense'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
