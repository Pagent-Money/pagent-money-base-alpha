/**
 * SIWE (Sign-In with Ethereum) Authentication Implementation
 * Follows EIP-4361 standard with EIP-1271 support for Coinbase Smart Wallets
 */

import { SiweMessage } from 'siwe'
import { createClient } from '@supabase/supabase-js'
import { getAddress } from 'viem'

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rpsfupahfggkpfstaxfx.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const EDGE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL!

export interface SiweUser {
  id: string
  address: string
  chainId: number
  isNewUser: boolean
  createdAt: string
  lastLoginAt: string
}

export interface SiweSession {
  access_token: string
  user: SiweUser
  expires_at: number
}

/**
 * Generate a SIWE message for authentication
 */
export function createSiweMessage(
  address: string,
  chainId: number, // Chain ID will be provided by the caller
  nonce: string,
  // SIWE spec expects the RFC3986 host (no port). Use hostname instead of host to avoid :3000 in dev
  domain: string = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
): SiweMessage {
  // Normalize address to proper EIP-55 checksum format
  let normalizedAddress: string
  try {
    normalizedAddress = getAddress(address)
    console.log('📍 Address normalized:', { original: address, normalized: normalizedAddress })
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
      console.log('✅ Address fixed and normalized:', { original: address, fixed: fixedAddress, normalized: normalizedAddress })
    } catch (fixError) {
      console.error('❌ Could not fix address format:', address, fixError)
      throw new Error(`Invalid Ethereum address format: ${address}. Please check your wallet connection.`)
    }
  }

  const message = new SiweMessage({
    domain,
    address: normalizedAddress,
    statement: 'Sign in to Pagent Credits with your wallet.',
    uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    version: '1',
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
  })

  return message
}

/**
 * Authenticate with SIWE message and signature
 */
export async function authenticateWithSiwe(
  message: string,
  signature: string
): Promise<{
  success: boolean
  session?: SiweSession
  error?: string
}> {
  try {
    console.log('🔐 Authenticating with SIWE...')
    
    // Parse the SIWE message
    const siweMessage = new SiweMessage(message)
    
    console.log('📝 SIWE Message:', {
      domain: siweMessage.domain,
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      nonce: siweMessage.nonce
    })
    
    // Enhanced debugging information
    console.log('🧪 DEBUG: Authentication request details:')
    console.log('=====================================')
    console.log('Message length:', message.length)
    console.log('Signature length:', signature.length)
    console.log('Address:', siweMessage.address)
    console.log('Chain ID:', siweMessage.chainId)
    console.log('Domain:', siweMessage.domain)
    console.log('Nonce:', siweMessage.nonce)
    console.log('Message preview:', message.substring(0, 100) + '...')
    console.log('Signature preview:', signature.substring(0, 20) + '...')
    console.log('=====================================')
    
    // Skip local verification for ERC-6492 signatures (Coinbase Smart Wallet)
    const isERC6492Signature = signature.length > 1000 && signature.startsWith('0x00000000')
    
    if (isERC6492Signature) {
      console.log('🏦 Detected ERC-6492 signature - skipping frontend verification')
      console.log('⚡ Sending directly to backend for specialized ERC-6492 verification')
    } else {
      // Test local verification for standard signatures only
      try {
        const localTest = await siweMessage.verify({ signature })
        console.log('🧪 Frontend local verification result:', localTest)
        if (localTest && (localTest === true || localTest.success)) {
          console.log('✅ Local verification passed - issue may be in backend')
        }
      } catch (localError) {
        console.log('🧪 Frontend local verification error:', localError.message)
        console.log('⚠️ This may indicate a signature that needs backend EIP-1271 verification')
      }
    }

    // Send to our Edge Function for verification and user management
    let response: Response
    try {
      response = await fetch(`${EDGE_FUNCTIONS_URL}/siwe-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message,
          signature,
          timestamp: Date.now(),
          clientInfo: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
            platform: 'coinbase-wallet',
            version: '1.0.0'
          }
        }),
      })
    } catch (networkError) {
      console.error('🌐 Network error during authentication:', networkError)
      throw new Error(
        'Network connection failed. Please check your internet connection and try again.\n' +
        'If the problem persists, the authentication service may be temporarily unavailable.'
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('🚨 SIWE auth request failed:', response.status, errorText)
      
      // Parse error details if available
      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = errorJson.error || errorText
      } catch (e) {
        // Keep original text if not JSON
      }
      
      // Provide specific error messages for common issues
      if (response.status === 401 && errorDetails.includes('Invalid signature')) {
        throw new Error(
          'Signature verification failed. This may be due to:\n' +
          '• Coinbase Smart Wallet compatibility issues\n' +
          '• Network connectivity problems\n' +
          '• Please try again or contact support if the issue persists.'
        )
      } else if (response.status === 404) {
        throw new Error('Authentication service not available. Please try again later.')
      } else if (response.status === 400) {
        throw new Error(`Invalid request: ${errorDetails}`)
      } else {
        throw new Error(`Authentication failed (${response.status}): ${errorDetails}`)
      }
    }

    const result = await response.json()
    console.log('✅ SIWE auth response received:', { 
      success: result.success, 
      hasToken: !!result.token,
      hasUser: !!result.user,
      isNewUser: result.user?.isNewUser
    })
    
    if (!result.success) {
      throw new Error(result.error || 'Authentication failed')
    }

    // Create session object
    const session: SiweSession = {
      access_token: result.token,
      user: {
        id: result.user.id,
        address: result.user.address,
        chainId: siweMessage.chainId,
        isNewUser: result.user.isNewUser,
        createdAt: result.user.createdAt,
        lastLoginAt: result.user.lastLoginAt
      },
      expires_at: Date.now() + (60 * 60 * 1000) // 1 hour from now
    }

    return {
      success: true,
      session
    }

  } catch (error) {
    console.error('❌ SIWE authentication failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

/**
 * Generate a secure nonce for SIWE
 * SIWE nonce should be at least 8 characters and alphanumeric
 */
export function generateNonce(): string {
  // Generate a shorter, alphanumeric nonce that meets SIWE requirements
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(16) // 16 bytes for good randomness
    window.crypto.getRandomValues(array)
    for (let i = 0; i < array.length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Fallback for server-side
    for (let i = 0; i < 16; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  
  return result
}

/**
 * Store SIWE session in browser storage
 */
export function storeSiweSession(session: SiweSession): void {
  if (typeof window === 'undefined') return
  
  try {
    // Use localStorage instead of sessionStorage for persistence across tabs/refreshes
    localStorage.setItem('pagent-siwe-token', session.access_token)
    localStorage.setItem('pagent-siwe-user', JSON.stringify(session.user))
    localStorage.setItem('pagent-siwe-expires', session.expires_at.toString())
  } catch (error) {
    console.error('Error storing SIWE session:', error)
  }
}

/**
 * Get stored SIWE session
 */
export function getStoredSiweSession(): SiweSession | null {
  if (typeof window === 'undefined') return null
  
  try {
    const token = localStorage.getItem('pagent-siwe-token')
    const userStr = localStorage.getItem('pagent-siwe-user')
    const expiresStr = localStorage.getItem('pagent-siwe-expires')
    
    if (!token || !userStr || !expiresStr) return null
    
    const expires_at = parseInt(expiresStr)
    const now = Date.now()
    
    // Check if session is expired
    if (now > expires_at) {
      clearSiweSession()
      return null
    }
    
    const user = JSON.parse(userStr)
    
    return {
      access_token: token,
      user,
      expires_at
    }
  } catch (error) {
    console.error('Error reading stored SIWE session:', error)
    return null
  }
}

/**
 * Clear stored SIWE session
 */
export function clearSiweSession(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('pagent-siwe-token')
    localStorage.removeItem('pagent-siwe-user')
    localStorage.removeItem('pagent-siwe-expires')
  } catch (error) {
    console.error('Error clearing SIWE session:', error)
  }
}

/**
 * Create an authenticated Supabase client with SIWE session
 */
export function createAuthenticatedSupabaseClient(session: SiweSession) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  })
}
