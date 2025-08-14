/**
 * Enhanced Auth Hook with Supabase Auth Integration
 * Combines wallet signature authentication with Supabase Auth system
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { getAddress } from 'viem'
import { signInWithWallet, signOut, getSession, onAuthStateChange, type WalletUser } from '../lib/supabase-auth'

interface AuthContextType {
  // Auth state
  isLoading: boolean
  isAuthenticated: boolean
  isConnecting: boolean
  user: WalletUser | null
  session: any | null
  isNewUser: boolean
  error: string | null

  // Auth actions
  authenticate: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected, isConnecting: walletConnecting } = useAccount()
  const { signMessageAsync } = useSignMessage()

  // Auth state
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState<WalletUser | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from Supabase session
  useEffect(() => {
    initializeAuth()
  }, [])

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('🔄 Supabase auth state change:', event, session?.user?.id)
      
      if (session) {
        setSession(session)
        setUser(session.user as WalletUser)
        setIsAuthenticated(true)
        setIsNewUser(session.user?.user_metadata?.is_new_user || false)
      } else {
        setSession(null)
        setUser(null)
        setIsAuthenticated(false)
        setIsNewUser(false)
      }
      
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auto-logout when wallet disconnects
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      console.log('🔌 Wallet disconnected, logging out...')
      logout()
    }
  }, [isConnected, isAuthenticated])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Initializing Supabase Auth state...')
      
      const session = await getSession()
      if (session) {
        console.log('✅ Found existing Supabase Auth session')
        setSession(session)
        setUser(session.user as WalletUser)
        setIsAuthenticated(true)
        setIsNewUser(session.user?.user_metadata?.is_new_user || false)
      } else {
        console.log('ℹ️ No existing Supabase Auth session found')
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error)
      setError(error instanceof Error ? error.message : 'Authentication initialization failed')
    } finally {
      setIsLoading(false)
    }
  }

  const authenticate = async () => {
    if (!address || !signMessageAsync) {
      setError('Please connect your Coinbase Smart Wallet')
      return
    }

    setIsConnecting(true)
    setError(null)
    console.log('🔐 Starting Supabase Auth integration for:', getAddress(address))

    try {
      // Create authentication message
      const timestamp = Date.now()
      const nonce = Math.random().toString(36).substring(7)
      const message = createAuthMessage(address, timestamp, nonce)
      
      console.log('✍️ Requesting wallet signature...')
      
      // Request signature from Coinbase Smart Wallet
      const signature = await signMessageAsync({ 
        message,
        account: address as `0x${string}`
      })

      console.log('📤 Authenticating with Supabase Auth...')
      
      // Authenticate using Supabase Auth integration
      const result = await signInWithWallet(address, message, signature)

      if (result.success && result.user && result.session) {
        console.log('✅ Supabase Auth successful!', result.isNewUser ? '(New user)' : '(Returning user)')
        
        // State will be updated by the auth state change listener
        // But we can set loading states immediately
        setIsConnecting(false)
        
        if (result.isNewUser) {
          console.log('🎉 Welcome to Pagent Credits!')
        }
      } else {
        throw new Error(result.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error)
      setError(error instanceof Error ? error.message : 'Authentication failed')
      setIsConnecting(false)
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Signing out...')
      const result = await signOut()
      
      if (result.success) {
        console.log('✅ Signed out successfully')
        // State will be updated by auth state change listener
      } else {
        throw new Error(result.error || 'Sign out failed')
      }
    } catch (error) {
      console.error('❌ Logout failed:', error)
      setError(error instanceof Error ? error.message : 'Logout failed')
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value: AuthContextType = {
    isLoading,
    isAuthenticated,
    isConnecting,
    user,
    session,
    isNewUser,
    error,
    authenticate,
    logout,
    clearError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Helper function to create auth message
const createAuthMessage = (address: string, timestamp: number, nonce: string): string => {
  return `Welcome to Pagent Credits! 🎉

Please sign this message to securely authenticate your wallet.

🔐 Wallet: ${getAddress(address)}
⏰ Time: ${new Date(timestamp).toLocaleString()}
🎲 Nonce: ${nonce}

✅ This signature is safe and will not trigger any blockchain transaction or cost gas.

By signing, you agree to our Terms of Service.`
}


