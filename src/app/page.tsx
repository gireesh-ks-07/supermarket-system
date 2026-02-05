'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ShoppingCart } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        // cast to any or define proper type
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || 'Login failed')
            }

            // Redirect based on role? For now just dashboard.
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="flex justify-center mb-8">
                    <div className="p-4 rounded-full glass-panel bg-gradient-to-tr from-purple-500/20 to-blue-500/20">
                        <ShoppingCart size={48} className="text-purple-300" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-center mb-2 tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    BeNostra
                </h1>
                <p className="text-center text-slate-400 mb-8">Supermarket Management System</p>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                        <div className="space-y-2">
                            <Input name="username" placeholder="Username" required />
                            <Input name="password" type="password" placeholder="Password" required />
                        </div>

                        <Button type="submit" className="w-full justify-center mt-4" isLoading={loading}>
                            Sign In
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}
