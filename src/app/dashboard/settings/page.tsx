'use client'

import React, { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Store, Save, Shield, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function SettingsPage() {
    const { user, isAdmin } = useUser()
    const { data: settings, isLoading } = useSWR('/api/settings', fetcher)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: ''
    })

    useEffect(() => {
        if (settings) {
            setFormData({
                name: settings.name || '',
                address: settings.address || '',
                phone: settings.phone || ''
            })
        }
    }, [settings])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        const toastId = toast.loading('Saving settings...')

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success('Settings updated successfully')
                mutate('/api/settings')
            } else {
                toast.error('Failed to update settings')
            }
        } catch (e) {
            toast.error('Network error')
        } finally {
            toast.dismiss(toastId)
            setSubmitting(false)
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
                <Shield size={48} className="mb-4 text-slate-600" />
                <h2 className="text-xl font-bold text-slate-300">Access Denied</h2>
                <p>Only Administrators can modify system settings.</p>
            </div>
        )
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                    <Store size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">System Settings</h1>
                    <p className="text-sm text-slate-400">Manage store profile and configurations</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Store Profile Card */}
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                        <Store size={18} className="text-slate-400" />
                        <h3 className="font-bold text-white">Store Profile</h3>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Supermarket Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="My Supermarket"
                                required
                            />
                            <Input
                                label="Contact Phone"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 999 999 9999"
                            />
                        </div>

                        <Input
                            label="Store Address"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 MAIN ST, CITY, STATE"
                        />

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" isLoading={submitting} className="min-w-[120px]">
                                <Save size={16} className="mr-2" /> Save Changes
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* System Info Card */}
                <Card className="overflow-hidden bg-slate-900/40 border-slate-800">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                        <Info size={18} className="text-slate-400" />
                        <h3 className="font-bold text-white">Application Info</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Version</p>
                            <p className="text-sm font-mono text-white">v1.0.0-alpha</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Environment</p>
                            <p className="text-sm font-mono text-emerald-400">Production</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Database</p>
                            <p className="text-sm font-mono text-blue-400">PostgreSQL</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
