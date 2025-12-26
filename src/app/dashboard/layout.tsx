import React from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-[url('/bg-noise.png')]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    )
}
