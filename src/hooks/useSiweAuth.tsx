/**
 * SIWE (Sign-In with Ethereum) Auth Hook
 * Implements proper EIP-4361 standard with EIP-1271 support for Coinbase Smart Wallets
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi'
import { 
  createSiweMessage, 
  authenticateWithSiwe, 
  generateNonce,
  storeSiweSession,
  getStoredSiweSession,
  clearSiweSession,
  type SiweUser, 
  type SiweSession 
} from '../lib/siwe-auth'
import { useActiveChain } from '../app/chain-provider'

interface AuthContextType {
  // Auth state
  isLoading: boolean
  isAuthenticated: boolean
  isConnecting: boolean
  user: SiweUser | null
  session: SiweSession | null
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
    throw new Error('useAuth must be used within a SiweAuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function SiweAuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const { activeChain } = useActiveChain()

  // Check if we're in mockup mode (support both development and production demo)
  const [isMockupMode, setIsMockupMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return process.env.NEXT_PUBLIC_MOCKUP_WALLET === 'true' || 
           process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
           localStorage.getItem('pagent-demo-mode') === 'true'
  })

  // Auth state
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(isMockupMode)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState<SiweUser | null>(isMockupMode ? {
    id: 'mockup-user-123',
    address: '0x1234567890123456789012345678901234567890',
    chainId: 8453,
    isNewUser: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  } : null)
  const [session, setSession] = useState<SiweSession | null>(isMockupMode ? {
    access_token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 'mockup-user-123',
      address: '0x1234567890123456789012345678901234567890',
      chainId: 8453,
      isNewUser: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    },
    expires_at: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  } : null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from stored session
  useEffect(() => {
    initializeAuth()
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
      
      if (isMockupMode) {
        console.log('🎭 Mockup mode enabled - simulating authenticated user')
        setIsLoading(false)
        return
      }
      
      console.log('🔄 Initializing SIWE auth state...')
      
      const storedSession = getStoredSiweSession()
      if (storedSession) {
        console.log('✅ Found stored SIWE session')
        setSession(storedSession)
        setUser(storedSession.user)
        setIsAuthenticated(true)
        setIsNewUser(storedSession.user.isNewUser)
      } else {
        console.log('ℹ️ No stored SIWE session found')
      }
    } catch (error) {
      console.error('❌ SIWE auth initialization failed:', error)
      setError(error instanceof Error ? error.message : 'Authentication initialization failed')
    } finally {
      setIsLoading(false)
    }
  }

  const authenticate = async () => {
    if (isMockupMode) {
      console.log('🎭 Mockup authentication - simulating successful login')
      setIsConnecting(true)
      
      // Simulate a brief delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUser: SiweUser = {
        id: 'mockup-user-123',
        address: '0x1234567890123456789012345678901234567890',
        chainId: 8453,
        isNewUser: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }
      
      const mockSession: SiweSession = {
        access_token: 'mock-jwt-token-' + Date.now(),
        user: mockUser,
        expires_at: Date.now() + 24 * 60 * 60 * 1000
      }
      
      setSession(mockSession)
      setUser(mockUser)
      setIsAuthenticated(true)
      setIsNewUser(false)
      setIsConnecting(false)
      
      console.log('✅ Mockup authentication successful!')
      return
    }

    if (!address || !signMessageAsync) {
      setError('Please connect your Coinbase Smart Wallet')
      return
    }

    // Use the active chain from the provider (which respects URL override)
    const supportedChainIds = [8453, 84532] // Base mainnet and Base Sepolia
    const currentChainId = activeChain.id // Use active chain from provider
    
    if (!supportedChainIds.includes(currentChainId)) {
      setError('Please switch to Base network to continue')
      return
    }

    setIsConnecting(true)
    setError(null)

    // Check if wallet is on the correct chain
    if (chainId && chainId !== currentChainId) {
      console.log('🔄 Wallet on wrong chain, attempting to switch...', {
        walletChain: chainId,
        targetChain: currentChainId,
        chainName: activeChain.name
      })

      try {
        // Attempt to switch chain automatically
        if (switchChain) {
          setError(`Switching to ${activeChain.name}...`)
          await switchChain({ chainId: currentChainId })
          
          // Wait a moment for the chain to switch
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Clear the switching message
          setError(null)
          console.log('✅ Chain switched successfully to:', activeChain.name)
        } else {
          setError(`Please switch your wallet to ${activeChain.name} (Chain ID: ${currentChainId})`)
          setIsConnecting(false)
          return
        }
      } catch (switchError) {
        console.error('❌ Failed to switch chain:', switchError)
        setError(`Failed to switch to ${activeChain.name}. Please switch manually in your wallet.`)
        setIsConnecting(false)
        return
      }
    }

    console.log('🔐 Starting SIWE authentication for:', address, 'on chain:', currentChainId, '(', activeChain.name, ')')

    try {
      // Generate a secure nonce
      const nonce = generateNonce()
      
      // Create SIWE message
      console.log('🔧 Creating SIWE message with:', {
        address,
        chainId: currentChainId,
        chainName: activeChain.name,
        nonce: nonce.substring(0, 8) + '...'
      })
      
      const siweMessage = createSiweMessage(address, currentChainId, nonce)
      const messageToSign = siweMessage.prepareMessage()
      
      console.log('📝 SIWE message to sign:')
      console.log(messageToSign)
      console.log('📏 Message details:', {
        length: messageToSign.length,
        chainId: siweMessage.chainId,
        address: siweMessage.address,
        domain: siweMessage.domain
      })
      
      // Request signature from Coinbase Smart Wallet
      console.log('✍️ Requesting SIWE signature from wallet...')
      console.log('📋 Full message being signed:')
      console.log('=====================================')
      console.log(messageToSign)
      console.log('=====================================')
      
      const signature = await signMessageAsync({ 
        message: messageToSign,
        account: address as `0x${string}`
      })

      console.log('✍️ SIWE signature received:', signature.slice(0, 20) + '...')
      console.log('🔗 Full signature:', signature)
      console.log('📤 Authenticating with SIWE backend...')
      
      // Authenticate using our SIWE auth system
      const result = await authenticateWithSiwe(messageToSign, signature)

      if (result.success && result.session) {
        console.log('✅ SIWE authentication successful!', result.session.user.isNewUser ? '(New user)' : '(Returning user)')
        
        // Set the Supabase auth token for RLS
        if (result.session.token) {
          const supabaseAuth = await import('../lib/supabase-auth')
          await supabaseAuth.setSupabaseToken(result.session.token)
          console.log('🔑 Supabase JWT token set for RLS')
        }
        
        // Update state
        setSession(result.session)
        setUser(result.session.user)
        setIsAuthenticated(true)
        setIsNewUser(result.session.user.isNewUser)
        
        // Store session
        storeSiweSession(result.session)
        
        if (result.session.user.isNewUser) {
          console.log('🎉 Welcome to Pagent Credits!')
        }
      } else {
        throw new Error(result.error || 'SIWE authentication failed')
      }
    } catch (error) {
      console.error('❌ SIWE authentication failed:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Authentication failed'
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = 'Signature rejected. Please try again and approve the signature request.'
        } else if (error.message.includes('Invalid signature')) {
          errorMessage = 'Invalid signature. Please ensure you\'re using the correct wallet.'
        } else if (error.message.includes('expired')) {
          errorMessage = 'Authentication request expired. Please try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Signing out from SIWE...')
      
      // Clear Supabase token
      const supabaseAuth = await import('../lib/supabase-auth')
      supabaseAuth.clearSupabaseToken()
      
      // Clear session
      clearSiweSession()
      
      // Reset state
      setSession(null)
      setUser(null)
      setIsAuthenticated(false)
      setIsNewUser(false)
      
      console.log('✅ SIWE signed out successfully')
    } catch (error) {
      console.error('❌ SIWE logout failed:', error)
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
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
