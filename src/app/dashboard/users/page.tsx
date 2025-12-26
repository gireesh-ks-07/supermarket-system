'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Plus, Edit2, Trash2, Shield, Key, X } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

type UserType = {
    id: string
    name: string
    username: string
    role: string
    pin: string | null
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserType[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Form
    const [formData, setFormData] = useState({
        name: '', username: '', password: '', role: 'BILLING_STAFF', pin: ''
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        const res = await fetch('/api/users')
        if (res.ok) setUsers(await res.json())
    }

    const resetForm = () => {
        setFormData({ name: '', username: '', password: '', role: 'BILLING_STAFF', pin: '' })
        setEditingId(null)
        setIsModalOpen(false)
    }

    const openEdit = (user: UserType) => {
        setEditingId(user.id)
        setFormData({
            name: user.name,
            username: user.username,
            password: '', // Don't show hash
            role: user.role,
            pin: user.pin || ''
        })
        setIsModalOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const url = editingId ? `/api/users/${editingId}` : '/api/users'
        const method = editingId ? 'PUT' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success(editingId ? 'User updated' : 'User created')
                resetForm()
                fetchUsers()
            } else {
                const json = await res.json()
                toast.error(json.error || 'Operation failed')
            }
        } catch { toast.error('Failed to save user') }
        finally { setSubmitting(false) }
    }

    const executeDelete = async () => {
        if (!deleteId) return
        try {
            await fetch(`/api/users/${deleteId}`, { method: 'DELETE' })
            toast.success('User deleted')
            fetchUsers()
            setDeleteId(null)
        } catch {
            toast.error('Failed to delete user')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        User Management
                    </h1>
                    <p className="text-sm text-slate-400">Manage staff access and roles</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
                    <Plus size={18} /> Add New User
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {users.map(user => (
                    <Card key={user.id} className="group hover:border-purple-500/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                                user.role === 'STOCK_MANAGER' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-green-500/10 text-green-400'
                                }`}>
                                {user.role === 'ADMIN' ? <Shield size={24} /> : <User size={24} />}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(user)} className="p-2 hover:bg-white/10 rounded">
                                    <Edit2 size={16} className="text-slate-400" />
                                </button>
                                <button onClick={() => setDeleteId(user.id)} className="p-2 hover:bg-red-500/10 rounded">
                                    <Trash2 size={16} className="text-red-400" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{user.name}</h3>
                        <p className="text-sm text-slate-400 mb-4">@{user.username}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="text-xs px-2 py-1 rounded bg-white/5 text-slate-300">
                                {user.role.replace('_', ' ')}
                            </span>
                            {user.pin && (
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Key size={12} /> PIN Active
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <Card className="w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'Edit User' : 'Add New User'}
                            </h2>
                            <button onClick={resetForm}><X size={24} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <Input
                                label="Full Name"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Username"
                                    required={!editingId}
                                    disabled={!!editingId} // Usually username is immutable or needs special handling
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                                <div className="mb-4 w-full">
                                    <label className="label">Role</label>
                                    <select
                                        className="input w-full appearance-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="stock_manager">Stock Manager</option>
                                        <option value="BILLING_STAFF">Billing Staff</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={editingId ? "New Password (Optional)" : "Password"}
                                    type="password"
                                    required={!editingId}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                                <Input
                                    label="Quick PIN (4 digits)"
                                    maxLength={4}
                                    value={formData.pin}
                                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                                <Button type="submit" isLoading={submitting}>Save User</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={executeDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                confirmText="Delete User"
            />
        </div>
    )
}
