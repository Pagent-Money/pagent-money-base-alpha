'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error but don't spam console with known extension errors
    if (!error.message.includes('data-atm-ext-installed') && 
        !error.message.includes('Failed to fetch')) {
      console.warn('Pagent Error Boundary caught an error:', error, errorInfo)
    }
  }

  public render() {
    if (this.state.hasError) {
      // Return fallback UI or children if error is non-critical
      const isCriticalError = this.state.error && 
        !this.state.error.message.includes('data-atm-ext-installed') &&
        !this.state.error.message.includes('Failed to fetch') &&
        !this.state.error.message.includes('Analytics SDK')
      
      if (!isCriticalError) {
        // Non-critical error, continue rendering children
        return this.props.children
      }
      
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-6 max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              Please refresh the page and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Client-side error handler for unhandled promise rejections
export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Ignore known extension and analytics errors
      if (
        event.reason?.message?.includes('data-atm-ext-installed') ||
        event.reason?.message?.includes('Failed to fetch') ||
        event.reason?.message?.includes('Analytics SDK') ||
        event.reason?.message?.includes('cca-lite.coinbase.com')
      ) {
        event.preventDefault() // Prevent console error
        return
      }
      
      console.warn('Unhandled promise rejection:', event.reason)
    })

    // Handle other errors
    window.addEventListener('error', (event) => {
      // Ignore known extension errors
      if (
        event.message?.includes('data-atm-ext-installed') ||
        event.message?.includes('Analytics SDK') ||
        event.error?.message?.includes('cca-lite.coinbase.com')
      ) {
        event.preventDefault()
        return
      }
    })
  }
}
