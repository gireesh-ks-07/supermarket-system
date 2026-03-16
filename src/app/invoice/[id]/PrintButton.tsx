'use client'

import { Printer } from 'lucide-react'

export function PrintReceiptButton() {
    return (
        <button 
            onClick={() => window.print()}
            className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white font-bold tracking-widest uppercase text-sm py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
        >
            <Printer size={18} /> Print Receipt
        </button>
    )
}
