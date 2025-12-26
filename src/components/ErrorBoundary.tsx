'use client'

import React from 'react'

interface ErrorBoundaryProps {
    children: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true }
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
                    <p className="text-slate-400 mb-4">The dashboard encountered an unexpected error.</p>
                    <button
                        onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
