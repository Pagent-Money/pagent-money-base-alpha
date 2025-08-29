'use client'

import { useAuth } from '../hooks/useSiweAuth'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { getStoredSiweSession } from '../lib/siwe-auth'

/**
 * Debug panel to help diagnose authentication issues
 */
export function AuthDebugPanel() {
 const { isAuthenticated, user, isLoading, isConnecting, session, error } = useAuth()
 const { address, isConnected, isConnecting: walletConnecting } = useAccount()
 const [storedSession, setStoredSession] = useState<any>(null)
 const [localStorageData, setLocalStorageData] = useState<any>({})

 useEffect(() => {
  // Check stored session
  const stored = getStoredSiweSession()
  setStoredSession(stored)

  // Check localStorage directly
  if (typeof window !== 'undefined') {
   setLocalStorageData({
    token: localStorage.getItem('pagent-siwe-token'),
    user: localStorage.getItem('pagent-siwe-user'),
    expires: localStorage.getItem('pagent-siwe-expires')
   })
  }
 }, [])

 return (
  <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md text-xs font-mono z-50">
   <h3 className="font-bold text-sm mb-2 text-gray-800">🔍 Auth Debug Panel</h3>
   
   <div className="space-y-2">
    <div>
     <strong>Hook State:</strong>
     <div className="ml-2 text-gray-600">
      <div>isAuthenticated: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{String(isAuthenticated)}</span></div>
      <div>isLoading: <span className={isLoading ? 'text-yellow-600' : 'text-gray-600'}>{String(isLoading)}</span></div>
      <div>isConnecting: <span className={isConnecting ? 'text-yellow-600' : 'text-gray-600'}>{String(isConnecting)}</span></div>
      <div>user: {user ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'null'}</div>
      <div>error: <span className="text-red-600">{error || 'none'}</span></div>
     </div>
    </div>

    <div>
     <strong>Wallet State:</strong>
     <div className="ml-2 text-gray-600">
      <div>isConnected: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>{String(isConnected)}</span></div>
      <div>walletConnecting: <span className={walletConnecting ? 'text-yellow-600' : 'text-gray-600'}>{String(walletConnecting)}</span></div>
      <div>address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'null'}</div>
     </div>
    </div>

    <div>
     <strong>Stored Session:</strong>
     <div className="ml-2 text-gray-600">
      <div>exists: <span className={storedSession ? 'text-green-600' : 'text-red-600'}>{String(!!storedSession)}</span></div>
      {storedSession && (
       <>
        <div>address: {storedSession.user?.address?.slice(0, 6)}...{storedSession.user?.address?.slice(-4)}</div>
        <div>expires: {new Date(storedSession.expires_at).toLocaleTimeString()}</div>
        <div>valid: <span className={Date.now() < storedSession.expires_at ? 'text-green-600' : 'text-red-600'}>
         {String(Date.now() < storedSession.expires_at)}
        </span></div>
       </>
      )}
     </div>
    </div>

    <div>
     <strong>LocalStorage:</strong>
     <div className="ml-2 text-gray-600">
      <div>token: <span className={localStorageData.token ? 'text-green-600' : 'text-red-600'}>
       {localStorageData.token ? 'exists' : 'none'}
      </span></div>
      <div>user: <span className={localStorageData.user ? 'text-green-600' : 'text-red-600'}>
       {localStorageData.user ? 'exists' : 'none'}
      </span></div>
      <div>expires: <span className={localStorageData.expires ? 'text-green-600' : 'text-red-600'}>
       {localStorageData.expires ? 'exists' : 'none'}
      </span></div>
     </div>
    </div>

    <div>
     <strong>Address Match:</strong>
     <div className="ml-2 text-gray-600">
      {address && storedSession?.user?.address ? (
       <span className={address.toLowerCase() === storedSession.user.address.toLowerCase() ? 'text-green-600' : 'text-red-600'}>
        {address.toLowerCase() === storedSession.user.address.toLowerCase() ? 'Match ✓' : 'Mismatch ✗'}
       </span>
      ) : (
       <span className="text-gray-400">N/A</span>
      )}
     </div>
    </div>
   </div>

   <button
    onClick={() => {
     localStorage.clear()
     window.location.reload()
    }}
    className="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
   >
    Clear & Reload
   </button>
  </div>
 )
}
