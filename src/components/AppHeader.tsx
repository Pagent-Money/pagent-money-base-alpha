'use client'

import { useAuth } from '../hooks/useSiweAuth'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { Button } from './ui/Button'
import { Wallet, LogOut, User } from 'lucide-react'
import { useState } from 'react'

interface AppHeaderProps {
 title?: string
 subtitle?: string
 showBackButton?: boolean
 onBack?: () => void
}

/**
 * Standardized header component for all in-app pages
 * Shows wallet connection status and user info
 */
export function AppHeader({ title, subtitle, showBackButton = false, onBack }: AppHeaderProps) {
 const { isAuthenticated, user, logout, isConnecting, authenticate } = useAuth()
 const { address, isConnected } = useAccount()
 const [showUserMenu, setShowUserMenu] = useState(false)

 // Debug logging (only when state changes)
 // console.log('🎯 AppHeader state:', { 
 //  isAuthenticated, 
 //  isConnected, 
 //  userAddress: user?.address, 
 //  walletAddress: address,
 //  isConnecting 
 // })

 // Format wallet address to show only first 2 and last 4 characters
 const formatAddress = (addr: string) => {
  if (!addr) return ''
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
 }

 const handleLogout = async () => {
  setShowUserMenu(false)
  await logout()
 }

 return (
  <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
     {/* Left side - Title and back button */}
     <div className="flex items-center gap-4">
      {showBackButton && (
       <Button
        onClick={onBack}
        variant="outline"
        size="sm"
        className="p-2"
       >
        ←
       </Button>
      )}
      <div>
       {title && (
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
       )}
       {subtitle && (
        <p className="text-sm text-gray-500">{subtitle}</p>
       )}
      </div>
     </div>

     {/* Right side - Wallet connection status */}
     <div className="flex items-center gap-3">
      {isAuthenticated && user ? (
       /* Authenticated user menu */
       <div className="relative">
        <Button
         onClick={() => setShowUserMenu(!showUserMenu)}
         variant="outline"
         size="sm"
         className="flex items-center gap-2 px-3 py-2"
        >
         <User className="w-4 h-4" />
         <span className="font-mono text-sm">
          {formatAddress(user.address)}
         </span>
        </Button>

        {/* User dropdown menu */}
        {showUserMenu && (
         <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
           <p className="text-xs text-gray-500">Wallet Address</p>
           <p className="text-sm font-mono text-gray-900 break-all">
            {user.address}
           </p>
          </div>
          <div className="px-4 py-2 border-b border-gray-100">
           <p className="text-xs text-gray-500">Member Since</p>
           <p className="text-sm text-gray-900">
            {new Date(user.createdAt).toLocaleDateString()}
           </p>
          </div>
          <button
           onClick={handleLogout}
           className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
           <LogOut className="w-4 h-4" />
           Disconnect
          </button>
         </div>
        )}
       </div>
      ) : isConnected ? (
       /* Wallet connected but not authenticated */
       <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-amber-600 text-sm">
         <Wallet className="w-4 h-4" />
         <span>Connected</span>
        </div>
        <Button
         onClick={authenticate}
         size="sm"
         disabled={isConnecting}
         className="bg-gradient-to-r from-[#6B53FF] to-[#FEA611] hover:from-[#5B43EF] hover:to-[#E89501] text-white"
        >
         {isConnecting ? 'Signing...' : 'Sign In'}
        </Button>
       </div>
      ) : (
       /* Not connected */
       <ConnectWallet className="w-auto">
        <Button
         size="sm"
         variant="outline"
         className="flex items-center gap-2 px-3 py-2"
        >
         <Wallet className="w-4 h-4" />
         Connect Wallet
        </Button>
       </ConnectWallet>
      )}
     </div>
    </div>
   </div>

   {/* Click outside to close menu */}
   {showUserMenu && (
    <div
     className="fixed inset-0 z-40"
     onClick={() => setShowUserMenu(false)}
    />
   )}
  </header>
 )
}

/**
 * Hook to get formatted wallet address
 */
export function useFormattedAddress(address?: string) {
 if (!address) return ''
 return `${address.slice(0, 4)}...${address.slice(-4)}`
}
