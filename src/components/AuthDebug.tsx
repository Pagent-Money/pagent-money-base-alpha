'use client'

import { useAuth } from '../hooks/useSiweAuth'
import { useAccount } from 'wagmi'

export function AuthDebug() {
 const auth = useAuth()
 const { address, isConnected } = useAccount()

 if (process.env.NODE_ENV !== 'development') {
  return null
 }

 return (
  <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
   <h3 className="font-bold mb-2">🔍 Auth Debug</h3>
   <div className="space-y-1">
    <div><strong>Wallet:</strong> {isConnected ? '✅' : '❌'} {address?.slice(0, 6)}...</div>
    <div><strong>Loading:</strong> {auth.isLoading ? '⏳' : '✅'}</div>
    <div><strong>Authenticated:</strong> {auth.isAuthenticated ? '✅' : '❌'}</div>
    <div><strong>Connecting:</strong> {auth.isConnecting ? '⏳' : '✅'}</div>
    <div><strong>User ID:</strong> {auth.user?.id ? `${auth.user.id.slice(0, 8)}...` : 'None'}</div>
    <div><strong>Session:</strong> {auth.session ? '✅' : '❌'}</div>
    <div><strong>New User:</strong> {auth.isNewUser ? '✅' : '❌'}</div>
    {auth.error && (
     <div className="text-red-400"><strong>Error:</strong> {auth.error}</div>
    )}
   </div>
  </div>
 )
}

