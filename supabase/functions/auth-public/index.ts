import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

// Wallet signature verification utilities
import { ethers } from 'https://esm.sh/ethers@6.8.1'

interface AuthRequest {
  address: string
  message: string
  signature: string
  timestamp: number
  clientInfo?: {
    userAgent: string
    platform: string
    version: string
  }
}

interface AuthResponse {
  success: boolean
  token?: string
  user?: UserProfile
  error?: string
}

interface UserProfile {
  id: string
  address: string
  ensName?: string
  basename?: string
  createdAt: string
  lastLoginAt: string
  isNewUser?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const body: AuthRequest = await req.json()
    const { address, message, signature, timestamp, clientInfo } = body

    // Validate required fields
    if (!address || !message || !signature) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: address, message, signature' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify wallet signature
    console.log('🔐 Verifying wallet signature for:', address)
    console.log('📝 Message to verify:', JSON.stringify(message))
    console.log('✍️ Signature to verify:', signature)
    console.log('📏 Message length:', message.length)
    const isValidSignature = await verifyWalletSignature(address, message, signature)
    
    if (!isValidSignature) {
      console.error('❌ Invalid signature for address:', address)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid wallet signature' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Signature verified for:', address)

    // Create Supabase client with service role
    // Use internal URL for Edge Functions (more reliable for service role access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://rpsfupahfggkpfstaxfx.supabase.co'
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      supabaseUrlLength: supabaseUrl.length,
      serviceRoleKeyLength: serviceRoleKey.length
    })
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if user exists or create new user
    const normalizedAddress = address.toLowerCase()
    
    // Use RPC call to bypass RLS issues with service role
    const { data: existingUsers, error: selectError } = await supabase
      .rpc('get_user_by_smart_account', { account_address: normalizedAddress })

    if (selectError) {
      console.error('Database error during user lookup:', {
        error: selectError,
        message: selectError.message,
        details: selectError.details,
        hint: selectError.hint,
        code: selectError.code
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error during authentication: ${selectError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let user: any
    let isNewUser = false

    if (existingUsers && existingUsers.length > 0) {
      // Existing user - update last login
      // Convert RPC result to user object format
      const existingUser = existingUsers[0]
      user = {
        id: existingUser.user_id,
        smart_account: existingUser.smart_account,
        card_id: existingUser.card_id,
        is_active: existingUser.is_active,
        created_at: existingUser.created_at,
        metadata: {}
      }
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          updated_at: new Date().toISOString(),
          metadata: {
            ...user.metadata,
            lastLoginAt: new Date().toISOString(),
            clientInfo
          }
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user login:', updateError)
      }

      console.log('🔄 Existing user authenticated:', user.id)
    } else {
      // New user - create account
      const { data: newUsers, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            smart_account: normalizedAddress,
            is_active: true,
            metadata: {
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              signupTimestamp: timestamp,
              clientInfo
            }
          }
        ])
        .select()

      if (insertError || !newUsers || newUsers.length === 0) {
        console.error('Error creating new user:', insertError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create user account' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      user = newUsers[0]
      isNewUser = true
      console.log('🎉 New user created:', user.id)
    }

    // Generate JWT token
    const jwtPayload = {
      sub: user.id,
      wallet_address: normalizedAddress,
      user_id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
      iss: 'pagent-auth',
      app_metadata: {
        provider: 'wallet',
        wallet_type: 'coinbase_smart_wallet'
      },
      user_metadata: {
        wallet_address: normalizedAddress,
        is_new_user: isNewUser
      }
    }

    // Sign JWT with custom JWT secret (not Supabase's built-in secret)
    const jwtSecret = Deno.env.get('JWT_SECRET') || 'super-secret-jwt-token-with-at-least-32-characters'
    if (!jwtSecret) {
      console.error('JWT secret not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication service misconfigured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = await generateJWT(jwtPayload, jwtSecret)

    // Prepare user profile response
    const userProfile: UserProfile = {
      id: user.id,
      address: normalizedAddress,
      createdAt: user.created_at,
      lastLoginAt: new Date().toISOString(),
      isNewUser
    }

    console.log('✅ Authentication successful for:', normalizedAddress, isNewUser ? '(new user)' : '(returning user)')

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: userProfile
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Authentication error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during authentication' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Verify wallet signature using ethers.js
 */
async function verifyWalletSignature(
  address: string, 
  message: string, 
  signature: string
): Promise<boolean> {
  try {
    console.log('🔍 Starting signature verification process...')
    console.log('📧 Input message:', message)
    console.log('✍️ Input signature:', signature)
    console.log('🏠 Expected address:', address)
    
    // Try standard ethers verification first
    let recoveredAddress: string
    try {
      recoveredAddress = ethers.verifyMessage(message, signature)
      console.log('✅ Standard verification recovered:', recoveredAddress)
    } catch (error) {
      console.log('❌ Standard verification failed:', error)
      
      // Try with EIP-191 prefix manually if standard fails
      try {
        const messageBytes = ethers.toUtf8Bytes(message)
        const messageHash = ethers.keccak256(messageBytes)
        recoveredAddress = ethers.recoverAddress(messageHash, signature)
        console.log('✅ Manual recovery with hash:', recoveredAddress)
      } catch (error2) {
        console.log('❌ Manual recovery also failed:', error2)
        throw error
      }
    }
    
    // Compare addresses (case insensitive)
    const normalizedExpected = address.toLowerCase()
    const normalizedRecovered = recoveredAddress.toLowerCase()
    const isValid = normalizedRecovered === normalizedExpected
    
    console.log('🎯 Signature verification result:', {
      expectedAddress: normalizedExpected,
      recoveredAddress: normalizedRecovered,
      isValid,
      addressMatch: normalizedRecovered === normalizedExpected
    })
    
    return isValid
  } catch (error) {
    console.error('💥 Signature verification error:', error)
    return false
  }
}

/**
 * Generate JWT token using Supabase-compatible format
 */
async function generateJWT(payload: any, secret: string): Promise<string> {
  // JWT header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  // Create signature
  const data = `${encodedHeader}.${encodedPayload}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[=]/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${data}.${encodedSignature}`
}