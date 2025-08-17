'use client'

import { useAccount, useChainId } from 'wagmi'
import { useActiveChain } from '../app/chain-provider'
import { useAuth } from '../hooks/useSiweAuth'
import { useEffect } from 'react'

export function DebugChainInfo() {
 const { address, isConnected, chainId: walletChainId } = useAccount()
 const configChainId = useChainId()
 const { activeChain, isUrlOverride, isOverrideAllowed } = useActiveChain()
 const { isAuthenticated, isConnecting, error } = useAuth()

 // Log chain information on mount and changes
 useEffect(() => {
  console.log('🔍 Chain Debug Info:', {
   activeChain: {
    name: activeChain.name,
    id: activeChain.id,
   },
   walletChainId,
   configChainId,
   isUrlOverride,
   isOverrideAllowed,
   isConnected,
   address,
   urlParams: window.location.search,
  })
 }, [activeChain, walletChainId, configChainId, isUrlOverride, isOverrideAllowed, isConnected, address])

 // Only show in development
 if (process.env.NODE_ENV !== 'development') {
  return null
 }

 return (
  <div className="fixed bottom-4 left-4 p-3 bg-black/80 text-white text-xs rounded-lg font-mono max-w-sm">
   <div className="text-green-400 mb-2">🔍 Chain Debug</div>
   <div>Active: {activeChain.name} ({activeChain.id})</div>
   <div>Wallet Chain: {walletChainId || 'Not connected'}</div>
   <div>URL Override: {isUrlOverride ? 'Yes' : 'No'}</div>
   <div>Override Allowed: {isOverrideAllowed ? 'Yes' : 'No'}</div>
   <div>Auth Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
   {isConnecting && <div className="text-blue-400">🔄 Connecting...</div>}
   {error && <div className="text-red-400">❌ {error}</div>}
   {walletChainId && walletChainId !== activeChain.id && (
    <div className="text-yellow-400 mt-2">
     ⚠️ Wallet on different chain!
    </div>
   )}
  </div>
 )
}