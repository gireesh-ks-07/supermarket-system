import React from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

type ConfirmationModalProps = {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    isLoading?: boolean
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-sm p-0 overflow-hidden border border-white/10 shadow-2xl">
                <div className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/20 text-red-500' :
                            variant === 'warning' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'
                        }`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        {message}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                            {cancelText}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            isLoading={isLoading}
                            className={
                                variant === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white' :
                                    variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
