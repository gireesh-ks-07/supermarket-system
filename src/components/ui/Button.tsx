import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    isLoading?: boolean
}

export function Button({ children, className, variant = 'primary', isLoading, ...props }: ButtonProps) {
    const baseClass = 'btn'
    const variants = {
        primary: 'btn-primary',
        secondary: 'bg-slate-700 text-white hover:bg-slate-600',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white'
    }

    return (
        <button
            className={cn(baseClass, variants[variant], isLoading && 'opacity-70 cursor-not-allowed', className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? '...' : children}
        </button>
    )
}
