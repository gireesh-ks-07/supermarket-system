import React from 'react'
import clsx from 'clsx'

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <div className={clsx('glass-panel p-6', className)}>{children}</div>
}
