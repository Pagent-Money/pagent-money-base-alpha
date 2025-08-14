'use client'

import { useAuth } from '../hooks/useSiweAuth'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { Button } from './ui/Button'
import { AlertCircle, CheckCircle, Loader2, Wallet as WalletIcon } from 'lucide-react'
import { MockupWallet, useMockupAccount } from './MockupWallet'

interface AuthStatusProps {
  showDetails?: boolean
  className?: string
}

export function AuthStatus({ showDetails = false, className = '' }: AuthStatusProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    isConnecting,
    error, 
    user, 
    isNewUser,
    authenticate, 
    logout,
    clearError 
  } = useAuth()
  
  // Use mockup account data if in mockup mode, otherwise use real wallet
  const isMockupMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCKUP_WALLET === 'true'
  const mockupAccount = useMockupAccount()
  const realAccount = useAccount()
  
  const { isConnected, address } = isMockupMode ? mockupAccount : realAccount

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-sm text-gray-600">Initializing...</span>
      </div>
    )
  }

  // Not connected to wallet
  if (!isConnected) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-amber-600">
          <WalletIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Connect Wallet to Continue</span>
        </div>
{isMockupMode ? (
          <MockupWallet 
            text="Connect Mockup Wallet"
            className="w-full bg-gradient-to-r from-[#6B53FF] to-[#FEA611] hover:from-[#5B43EF] hover:to-[#E89501] text-white py-3 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
          />
        ) : (
          <ConnectWallet
            text="Connect Wallet"
            className="w-full bg-gradient-to-r from-[#6B53FF] to-[#FEA611] hover:from-[#5B43EF] hover:to-[#E89501] text-white py-3 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
          />
        )}
        {showDetails && (
          <p className="text-xs text-gray-500 text-center">
            🔐 Your wallet stays secure - we only request a signature for authentication
          </p>
        )}
      </div>
    )
  }

  // Wallet connected but not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Error state */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700 font-medium">Authentication Failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-600 hover:text-red-800 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Auth prompt */}
        <div className="flex items-center justify-end gap-2 text-blue-600 w-full">
          <span className="text-sm font-medium">Wallet Connected</span>
          <img src="/coinbase-wallet.svg" alt="Coinbase Wallet" className="h-5 w-5" />
        </div>
        
        <Button
          onClick={authenticate}
          disabled={isConnecting}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Authenticating...
            </>
          ) : (
            <>
              Connect Wallet
            </>
          )}
        </Button>

        {showDetails && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>🔐 We'll ask you to sign a message to verify wallet ownership</p>
            <p>⛽ No gas fees required - this is just a signature</p>
            <p>🚀 One-time setup for seamless experience</p>
          </div>
        )}
      </div>
    )
  }

  // Authenticated state
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Success state */}
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isNewUser ? '🎉 Welcome to Pagent!' : '👋 Welcome back!'}
        </span>
      </div>

      {/* User info */}
      {showDetails && user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono text-green-700">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
            {user.ensName && (
              <div className="flex justify-between">
                <span className="text-gray-600">ENS:</span>
                <span className="text-green-700">{user.ensName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Member since:</span>
              <span className="text-green-700">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full mt-3 text-xs text-gray-600 hover:text-gray-800 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}