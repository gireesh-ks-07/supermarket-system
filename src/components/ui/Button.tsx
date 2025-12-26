import React from 'react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger'
    isLoading?: boolean
}

export function Button({ children, className, variant = 'primary', isLoading, ...props }: ButtonProps) {
    const baseClass = 'btn'
    const variants = {
        primary: 'btn-primary',
        secondary: 'bg-slate-700 text-white hover:bg-slate-600',
        danger: 'bg-red-500 text-white hover:bg-red-600'
    }

    return (
        <button
            className={clsx(baseClass, variants[variant], isLoading && 'opacity-70 cursor-not-allowed', className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? '...' : children}
        </button>
    )
}
