/**
 * SIWE (Sign-In with Ethereum) Authentication Implementation
 * Follows EIP-4361 standard with EIP-1271 support for Coinbase Smart Wallets
 */

import { SiweMessage } from 'siwe'
import { createClient } from '@supabase/supabase-js'

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
  const message = new SiweMessage({
    domain,
    address,
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
    
    // Test local verification to help diagnose issues
    try {
      const localTest = await siweMessage.verify({ signature })
      console.log('🧪 Frontend local verification result:', localTest)
      if (localTest && (localTest === true || localTest.success)) {
        console.log('✅ Local verification passed - issue may be in backend')
      }
    } catch (localError) {
      console.log('🧪 Frontend local verification error:', localError.message)
      console.log('⚠️ This may indicate a Coinbase Smart Wallet signature that needs EIP-1271 verification')
    }

    // Send to our Edge Function for verification and user management
    const response = await fetch(`${EDGE_FUNCTIONS_URL}/siwe-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
 */
export function generateNonce(): string {
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Fallback for server-side
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Store SIWE session in browser storage
 */
export function storeSiweSession(session: SiweSession): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.setItem('pagent-siwe-token', session.access_token)
    sessionStorage.setItem('pagent-siwe-user', JSON.stringify(session.user))
    sessionStorage.setItem('pagent-siwe-expires', session.expires_at.toString())
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
    const token = sessionStorage.getItem('pagent-siwe-token')
    const userStr = sessionStorage.getItem('pagent-siwe-user')
    const expiresStr = sessionStorage.getItem('pagent-siwe-expires')
    
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
    sessionStorage.removeItem('pagent-siwe-token')
    sessionStorage.removeItem('pagent-siwe-user')
    sessionStorage.removeItem('pagent-siwe-expires')
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
