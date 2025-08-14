/**
 * Supabase Auth integration for Coinbase Wallet signatures
 * This integrates custom wallet authentication with Supabase Auth system
 */

import { createClient } from '@supabase/supabase-js'
import { authenticateWallet } from './secure-auth'

// Supabase client for auth operations
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rpsfupahfggkpfstaxfx.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disable since we're using custom auth
    }
  }
)

export interface WalletUser {
  id: string
  email?: string
  user_metadata: {
    wallet_address: string
    is_new_user?: boolean
    last_login_at?: string
  }
  app_metadata: {
    provider: 'wallet'
    wallet_type: 'coinbase_smart_wallet'
  }
}

/**
 * Sign up or sign in a user using wallet signature
 * This creates a Supabase Auth session using a hybrid approach
 */
export async function signInWithWallet(
  address: string,
  message: string,
  signature: string
): Promise<{
  success: boolean
  user?: WalletUser
  session?: any
  error?: string
  isNewUser?: boolean
}> {
  try {
    console.log('🔐 Authenticating wallet with Supabase Auth integration...')
    
    // First verify the wallet signature using our existing system
    const authResult = await authenticateWallet(address, message, signature)
    
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error
      }
    }

    console.log('✅ Wallet signature verified, creating Supabase Auth session...')

    // Use anonymous sign-in with custom user metadata
    // This is the cleanest approach for wallet-based auth
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          wallet_address: address.toLowerCase(),
          provider: 'wallet',
          wallet_type: 'coinbase_smart_wallet',
          is_new_user: authResult.user?.isNewUser || false,
          last_login_at: new Date().toISOString(),
          wallet_verified: true,
          signature_hash: signature.slice(0, 16) // Store part of signature for verification
        }
      }
    })

    if (anonError) {
      console.error('❌ Supabase anonymous auth failed:', anonError)
      return {
        success: false,
        error: `Session creation failed: ${anonError.message}`
      }
    }

    if (!anonData.user || !anonData.session) {
      return {
        success: false,
        error: 'Failed to create authentication session'
      }
    }

    console.log('✅ Supabase Auth session created successfully')
    
    // Create a properly typed user object
    const walletUser: WalletUser = {
      ...anonData.user,
      user_metadata: {
        wallet_address: address.toLowerCase(),
        is_new_user: authResult.user?.isNewUser || false,
        last_login_at: new Date().toISOString()
      },
      app_metadata: {
        provider: 'wallet',
        wallet_type: 'coinbase_smart_wallet'
      }
    } as WalletUser

    return {
      success: true,
      user: walletUser,
      session: anonData.session,
      isNewUser: authResult.user?.isNewUser || false
    }

  } catch (error) {
    console.error('💥 Wallet authentication error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}



/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed'
    }
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Session error:', error)
    return null
  }
  return session
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

export { supabase }
