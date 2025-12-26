import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    wrapperClassName?: string
}

import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, className, wrapperClassName, ...props }, ref) => {
    return (
        <div className={cn("w-full mb-4", wrapperClassName)}>
            {label && <label className="label">{label}</label>}
            <input ref={ref} className={cn("input", className)} {...props} />
        </div>
    )
})

Input.displayName = 'Input'
