"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { FiAlertTriangle } from "react-icons/fi"

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiAlertTriangle size={32} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Oops! Algo correu mal.
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            Pedimos desculpa pelo incómodo. Tente recarregar a página.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Recarregar Página
                            </button>
                            <button
                                onClick={() => this.setState({ hasError: false })}
                                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-6 text-left p-4 bg-gray-100 dark:bg-black rounded-lg overflow-auto max-h-48 text-xs font-mono text-red-600">
                                {this.state.error.toString()}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export { ErrorBoundary }
