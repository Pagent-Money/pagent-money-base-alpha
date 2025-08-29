/**
 * SIWE (Sign-In with Ethereum) Auth Hook
 * Implements proper EIP-4361 standard with EIP-1271 support for Coinbase Smart Wallets
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi'
import { useRouter } from 'next/navigation'
import { getAddress } from 'viem'
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
 const router = useRouter()



 // Auth state
 const [isLoading, setIsLoading] = useState(true)
 const [isAuthenticated, setIsAuthenticated] = useState(false)
 const [isConnecting, setIsConnecting] = useState(false)
 const [user, setUser] = useState<SiweUser | null>(null)
 const [session, setSession] = useState<SiweSession | null>(null)
 const [isNewUser, setIsNewUser] = useState(false)
 const [error, setError] = useState<string | null>(null)

 // Initialize auth state from stored session
 useEffect(() => {
  console.log('🚀 Component mounted, initializing auth...')
  initializeAuth()
 }, [])

 // Only check for wallet address mismatch when user actively switches wallets
 // Don't logout on page refresh or when wallet is temporarily disconnected
 useEffect(() => {
  // Skip checks during initial load
  if (isLoading) {
   console.log('⏳ Skipping wallet checks - initial load')
   return
  }
  
  // Skip if not authenticated
  if (!user || !isAuthenticated) {
   console.log('⏳ Skipping wallet checks - not authenticated')
   return
  }
  
  // Only check address mismatch if wallet is actually connected
  // AND we have both addresses to compare
  if (isConnected && address && user.address) {
   const connectedAddr = address.toLowerCase()
   const storedAddr = user.address.toLowerCase()
   
   if (connectedAddr !== storedAddr) {
    console.log('⚠️ Wallet address mismatch detected!')
    console.log('Connected:', address)
    console.log('Stored:', user.address)
    console.log('🔄 User switched wallets - clearing session...')
    logout()
   } else {
    console.log('✅ Wallet address matches stored session')
   }
  } else if (!isConnected && isAuthenticated) {
   // Wallet disconnected but session is valid - keep the session
   console.log('🔌 Wallet disconnected but session is valid - keeping session active')
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [isConnected, address]) // Only watch wallet connection changes, not auth state

 const initializeAuth = async () => {
  try {
   setIsLoading(true)
   
   console.log('🔄 Initializing SIWE auth state...')
   
   // Check localStorage contents with more detail
   const token = typeof window !== 'undefined' ? localStorage.getItem('pagent-siwe-token') : null
   const userStr = typeof window !== 'undefined' ? localStorage.getItem('pagent-siwe-user') : null
   const expiresStr = typeof window !== 'undefined' ? localStorage.getItem('pagent-siwe-expires') : null
   
   console.log('🔍 Current localStorage contents:', {
    token: token ? `exists (${token.substring(0, 20)}...)` : 'missing',
    user: userStr ? 'exists' : 'missing',
    expires: expiresStr ? `exists (${expiresStr})` : 'missing',
    isExpired: expiresStr ? Date.now() > parseInt(expiresStr) : 'N/A'
   })
   
   const storedSession = getStoredSiweSession()
   if (storedSession) {
    console.log('✅ Found stored SIWE session:', {
     address: storedSession.user.address,
     expires: new Date(storedSession.expires_at).toISOString(),
     isExpired: Date.now() > storedSession.expires_at,
     timeUntilExpiry: Math.round((storedSession.expires_at - Date.now()) / 1000 / 60) + ' minutes'
    })
    
    // Set Supabase auth token for RLS
    if (storedSession.access_token) {
     try {
      const supabaseAuth = await import('../lib/supabase-auth')
      await supabaseAuth.setSupabaseToken(storedSession.access_token)
      console.log('🔑 Supabase JWT token restored for RLS')
     } catch (tokenError) {
      console.error('⚠️ Failed to restore Supabase token:', tokenError)
     }
    }
    
    setSession(storedSession)
    setUser(storedSession.user)
    setIsAuthenticated(true)
    setIsNewUser(storedSession.user.isNewUser)
    console.log('🔄 Auth state updated: isAuthenticated = true')
   } else {
    console.log('ℹ️ No stored SIWE session found or session expired')
    setIsAuthenticated(false)
    setSession(null)
    setUser(null)
    console.log('🔄 Auth state updated: isAuthenticated = false')
   }
  } catch (error) {
   console.error('❌ SIWE auth initialization failed:', error)
   setError(error instanceof Error ? error.message : 'Authentication initialization failed')
   setIsAuthenticated(false)
   setSession(null)
   setUser(null)
  } finally {
   setIsLoading(false)
  }
 }

 const authenticate = async () => {
  console.log('🚀 authenticate() called')
  console.log('🔍 Pre-auth state:', { 
   address, 
   signMessageAsync: !!signMessageAsync, 
   activeChain: activeChain?.name,
   chainId 
  })
  
  if (!address || !signMessageAsync) {
   const errorMsg = 'Please connect your Coinbase Smart Wallet'
   console.error('❌ Pre-auth validation failed:', errorMsg)
   setError(errorMsg)
   return
  }

  // Normalize address to proper EIP-55 checksum format
  let normalizedAddress: string
  try {
   normalizedAddress = getAddress(address)
   console.log('📍 Address normalized for SIWE:', { original: address, normalized: normalizedAddress })
  } catch (error) {
   console.warn('⚠️ Address normalization failed, trying to fix:', address, error.message)
   
   // Try to fix common address format issues
   let fixedAddress = address
   
   // If address is too short, pad with zeros
   if (address.length < 42) {
    const hexPart = address.slice(2) // Remove 0x
    const paddedHex = hexPart.padStart(40, '0')
    fixedAddress = '0x' + paddedHex
    console.log('🔧 Padded short address:', { original: address, padded: fixedAddress })
   }
   
   try {
    normalizedAddress = getAddress(fixedAddress)
    console.log('✅ Address fixed and normalized for SIWE:', { original: address, fixed: fixedAddress, normalized: normalizedAddress })
   } catch (fixError) {
    const errorMsg = `Invalid wallet address format: ${address}. Please check your wallet connection.`
    console.error('❌ Could not fix address format:', fixError)
    setError(errorMsg)
    return
   }
  }

  // Use the active chain from the provider (which respects URL override)
  const supportedChainIds = [8453, 84532] // Base mainnet and Base Sepolia
  const currentChainId = activeChain.id // Use active chain from provider
  
  console.log('🔗 Chain validation:', { 
   currentChainId, 
   supportedChainIds, 
   isSupported: supportedChainIds.includes(currentChainId) 
  })
  
  if (!supportedChainIds.includes(currentChainId)) {
   const errorMsg = 'Please switch to Base network to continue'
   console.error('❌ Chain validation failed:', errorMsg)
   setError(errorMsg)
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
    address: normalizedAddress,
    chainId: currentChainId,
    chainName: activeChain.name,
    nonce: nonce.substring(0, 8) + '...'
   })
   
   const siweMessage = createSiweMessage(normalizedAddress, currentChainId, nonce)
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
    account: normalizedAddress as `0x${string}`
   })

   console.log('✍️ SIWE signature received:', signature.slice(0, 20) + '...')
   console.log('🔗 Full signature:', signature)
   console.log('📤 Authenticating with SIWE backend...')
   
   // Authenticate using our SIWE auth system
   console.log('🔗 Calling authenticateWithSiwe...')
   const result = await authenticateWithSiwe(messageToSign, signature)
   
   console.log('📥 SIWE auth result:', {
    success: result.success,
    hasSession: !!result.session,
    error: result.error,
    user: result.session?.user?.address
   })

   if (result.success && result.session) {
    console.log('✅ SIWE authentication successful!', result.session.user.isNewUser ? '(New user)' : '(Returning user)')
    
    // Set the Supabase auth token for RLS
    if (result.session.access_token) {
     const supabaseAuth = await import('../lib/supabase-auth')
     await supabaseAuth.setSupabaseToken(result.session.access_token)
     console.log('🔑 Supabase JWT token set for RLS')
    } else {
     console.error('⚠️ No access token in session:', result.session)
    }
    
    // Update state
    console.log('🔄 Updating auth state with session data...')
    setSession(result.session)
    setUser(result.session.user)
    setIsAuthenticated(true)
    setIsNewUser(result.session.user.isNewUser)
    
    // Store session in localStorage
    console.log('💾 Storing session in localStorage...')
    storeSiweSession(result.session)
    
    // Verify storage worked
    const storedSession = getStoredSiweSession()
    console.log('🔍 Verification - stored session:', storedSession ? 'exists' : 'missing')
    if (storedSession) {
     console.log('✅ Session storage verified:', {
      address: storedSession.user.address,
      hasToken: !!storedSession.access_token,
      expires: new Date(storedSession.expires_at).toISOString()
     })
    }
    
    if (result.session.user.isNewUser) {
     console.log('🎉 Welcome to Pagent Credits!')
    }
    
    // Don't redirect here - let the homepage handle the redirect
    console.log('✅ Authentication complete, state updated')
   } else {
    const errorMsg = result.error || 'SIWE authentication failed'
    console.error('❌ SIWE authentication failed:', errorMsg)
    console.error('❌ Full result:', result)
    throw new Error(errorMsg)
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
