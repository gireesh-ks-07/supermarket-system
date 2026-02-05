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
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-400">
                            <Wallet size={32} />
                        </div>
                        Expense Management
                    </h1>
                    <p className="text-slate-400 mt-1 ml-16">Track and manage store expenses.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        onClick={() => setIsAddOpen(true)}
                        className="shadow-lg shadow-purple-500/20"
                    >
                        <Plus size={18} className="mr-2" /> Add Expense
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/80 border-slate-800/50 w-fit backdrop-blur-sm">
                {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${period === p
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}

                <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

                {period === 'daily' && (
                    <div className="relative flex items-center gap-2 px-4 py-2 rounded-md border-2 border-white/5 hover:border-white/10 bg-white/5">
                        <Calendar size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 outline-none text-white [color-scheme:dark]"
                        />
                    </div>
                )}

                {period === 'custom' && (
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center gap-2 px-4 py-2 rounded-md border-2 border-white/5 bg-white/5">
                            <span className="text-xs text-slate-500">From</span>
                            <input
                                type="date"
                                value={customDate.from}
                                onChange={(e) => setCustomDate({ ...customDate, from: e.target.value })}
                                className="bg-transparent border-none text-sm focus:ring-0 outline-none text-white [color-scheme:dark]"
                            />
                        </div>
                        <div className="relative flex items-center gap-2 px-4 py-2 rounded-md border-2 border-white/5 bg-white/5">
                            <span className="text-xs text-slate-500">To</span>
                            <input
                                type="date"
                                value={customDate.to}
                                onChange={(e) => setCustomDate({ ...customDate, to: e.target.value })}
                                className="bg-transparent border-none text-sm focus:ring-0 outline-none text-white [color-scheme:dark]"
                            />
                        </div>
                    </div>
                )}

                {period !== 'custom' && period !== 'daily' && (
                    // For simplicity, sticking to current date logic for week/month/year or add more complex pickers later
                    <div className="px-4 py-2 text-sm text-slate-500 italic">
                        Selected date context: {selectedDate}
                    </div>
                )}
            </Card>

            {/* Total Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-red-400">Total Expenses</h3>
                        <Wallet className="text-red-500/50" />
                    </div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {isLoading ? '...' : formatCurrency(data?.totalAmount || 0)}
                    </p>
                    <p className="text-sm text-slate-400 mt-1 capitalize">
                        Period: {period}
                    </p>
                </Card>
            </div>

            {/* List */}
            <Card className="overflow-hidden">
                <div className="text-sm text-slate-400 uppercase tracking-wider font-bold p-4 border-b border-white/5 flex gap-4">
                    <div className="flex-1">Expense Details</div>
                    <div className="w-32 text-right">Amount</div>
                    <div className="w-32 text-right hidden md:block">Date</div>
                    <div className="w-32 text-right hidden md:block">User</div>
                </div>

                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading expenses...</div>
                    ) : (data?.expenses || []).length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No expenses found for this period.</div>
                    ) : (data.expenses.map((expense: any) => (
                        <div key={expense.id} className="p-4 flex gap-4 items-center hover:bg-white/5 transition-colors group">
                            <div className="flex-1">
                                <h4 className="font-semibold text-white">{expense.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                        {expense.category}
                                    </span>
                                    {expense.note && <span>• {expense.note}</span>}
                                </div>
                            </div>
                            <div className="w-32 text-right font-bold text-red-400">
                                -{formatCurrency(Number(expense.amount))}
                            </div>
                            <div className="w-32 text-right text-sm text-slate-400 hidden md:block">
                                {new Date(expense.date).toLocaleDateString()}
                            </div>
                            <div className="w-32 text-right text-xs text-slate-500 hidden md:block">
                                {expense.user?.name || 'Unknown'}
                            </div>
                        </div>
                    )))}
                </div>
            </Card>

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
