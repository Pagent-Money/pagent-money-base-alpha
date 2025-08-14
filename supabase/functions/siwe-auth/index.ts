import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { SiweMessage } from 'https://esm.sh/siwe@3.0.0'
import { verifyMessage, createPublicClient, http, isAddress } from 'https://esm.sh/viem@2.21.19'
import { base, baseSepolia } from 'https://esm.sh/viem@2.21.19/chains'

interface SiweAuthRequest {
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
    const body: SiweAuthRequest = await req.json()
    const { message, signature, timestamp, clientInfo } = body

    // Validate required fields
    if (!message || !signature) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: message, signature' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔐 Verifying SIWE message and signature...')
    console.log('📝 Message:', message)
    console.log('✍️ Signature:', signature)
    console.log('🕒 Timestamp:', timestamp)
    console.log('🌐 Client Info:', clientInfo)

    // Parse and validate SIWE message
    let siweMessage: SiweMessage
    try {
      siweMessage = new SiweMessage(message)
    } catch (parseError) {
      console.error('❌ Failed to parse SIWE message:', parseError)
      console.log('📝 Raw message that failed to parse:', message)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid SIWE message format: ${parseError.message}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('📋 Parsed SIWE:', {
      domain: siweMessage.domain,
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      nonce: siweMessage.nonce,
      issuedAt: siweMessage.issuedAt,
      expirationTime: siweMessage.expirationTime,
      statement: siweMessage.statement,
      uri: siweMessage.uri
    })

    // Validate message fields
    if (siweMessage.chainId !== 8453 && siweMessage.chainId !== 84532) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid chain ID. Must be Base (8453) or Base Sepolia (84532)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if message is expired
    if (siweMessage.expirationTime && new Date(siweMessage.expirationTime) < new Date()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SIWE message has expired' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify signature
    console.log('🔍 Starting signature verification for:', {
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      domain: siweMessage.domain,
      nonce: siweMessage.nonce,
      messageLength: message.length,
      signatureLength: signature.length
    })
    
    // ENHANCED DEBUG MODE: Can be enabled via environment variable for testing
    const SKIP_SIGNATURE_VERIFICATION = Deno.env.get('SKIP_SIGNATURE_VERIFICATION') === 'true'
    
    let isValidSignature = false
    if (SKIP_SIGNATURE_VERIFICATION) {
      console.log('⚠️ SKIPPING signature verification due to SKIP_SIGNATURE_VERIFICATION=true')
      console.log('⚠️ This should ONLY be used for debugging - NEVER in production!')
      isValidSignature = true
    } else {
      console.log('🔒 Performing signature verification...')
      isValidSignature = await verifySiweSignature(siweMessage, signature)
      console.log('🔒 Signature verification result:', isValidSignature)
    }
    
    if (!isValidSignature) {
      console.error('❌ Invalid SIWE signature for address:', siweMessage.address)
      console.error('🔍 Signature verification details:', {
        address: siweMessage.address,
        chainId: siweMessage.chainId,
        messageLength: message.length,
        signatureLength: signature.length,
        signatureStart: signature.substring(0, 10) + '...',
        messagePreview: message.substring(0, 100) + '...'
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid signature' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ SIWE signature verified for:', siweMessage.address)

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://rpsfupahfggkpfstaxfx.supabase.co'
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      serviceRoleKeyLength: serviceRoleKey.length,
      supabaseUrl: supabaseUrl
    })
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if user exists or create new user using upsert function
    const normalizedAddress = siweMessage.address.toLowerCase()
    
    const userMetadata = {
      lastLoginAt: new Date().toISOString(),
      signupTimestamp: timestamp,
      chainId: siweMessage.chainId,
      clientInfo
    }
    
    console.log('👤 Upserting user for address:', normalizedAddress)
    
    // Use upsert RPC function
    const { data: upsertResult, error: upsertError } = await supabase
      .rpc('upsert_siwe_user', { 
        account_address: normalizedAddress,
        user_metadata: userMetadata
      })

    if (upsertError) {
      console.error('Database error during user upsert:', upsertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error: ${upsertError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!upsertResult || upsertResult.length === 0) {
      console.error('No user data returned from upsert')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create or retrieve user account' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userData = upsertResult[0]
    const user = {
      id: userData.user_id,
      smart_account: userData.smart_account,
      card_id: userData.card_id,
      is_active: userData.is_active,
      created_at: userData.created_at,
    }
    const isNewUser = userData.is_new_user

    console.log(isNewUser ? '🎉 New user created:' : '🔄 Existing user authenticated:', user.id)

    // Generate Supabase-compatible JWT token
    const jwtPayload = {
      sub: user.id,
      wallet_address: normalizedAddress,
      user_id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
      iss: 'pagent-siwe-auth',
      app_metadata: {
        provider: 'siwe',
        wallet_type: 'coinbase_smart_wallet',
        chain_id: siweMessage.chainId
      },
      user_metadata: {
        wallet_address: normalizedAddress,
        is_new_user: isNewUser,
        chain_id: siweMessage.chainId
      }
    }

    // Sign JWT with Supabase JWT secret
    const jwtSecret = Deno.env.get('JWT_SECRET') || 'super-secret-jwt-token-with-at-least-32-characters'
    const token = await generateJWT(jwtPayload, jwtSecret)

    // Prepare user profile response
    const userProfile: UserProfile = {
      id: user.id,
      address: normalizedAddress,
      createdAt: user.created_at,
      lastLoginAt: new Date().toISOString(),
      isNewUser
    }

    console.log('✅ SIWE authentication successful for:', normalizedAddress, isNewUser ? '(new user)' : '(returning user)')

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
    console.error('❌ SIWE authentication error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error during SIWE authentication' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Verify SIWE signature using viem with support for both EOA and Smart Wallet (EIP-1271)
 * Enhanced for Coinbase Smart Wallet compatibility with ERC-6492 support
 */
async function verifySiweSignature(
  siweMessage: SiweMessage,
  signature: string
): Promise<boolean> {
  try {
    console.log('🔍 Starting viem SIWE signature verification...', {
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      signatureLength: signature.length
    })

    // Validate address format
    if (!isAddress(siweMessage.address)) {
      console.error('❌ Invalid address format:', siweMessage.address)
      return false
    }

    // Get the chain configuration
    const chain = siweMessage.chainId === 8453 ? base : baseSepolia
    const client = createPublicClient({
      chain,
      transport: http()
    })

    // Step 1: Try viem's built-in verifyMessage which handles both EOA and EIP-1271
    console.log('🧪 Step 1: Using viem verifyMessage for comprehensive verification...')
    try {
      const messageToVerify = siweMessage.prepareMessage()
      console.log('📝 Message being verified:', {
        length: messageToVerify.length,
        preview: messageToVerify.substring(0, 100) + '...'
      })

      const isValid = await verifyMessage(client, {
        address: siweMessage.address as `0x${string}`,
        message: messageToVerify,
        signature: signature as `0x${string}`,
      })

      console.log('🎯 Viem verification result:', isValid)
      
      if (isValid) {
        console.log('🎉 Viem SIWE verification succeeded!')
        return true
      }
    } catch (viemError) {
      console.log('🧪 Viem verification failed:', viemError.message)
    }

    // Step 2: Fallback to basic SIWE library verification for edge cases
    console.log('🔄 Step 2: Fallback to basic SIWE verification...')
    try {
      const basicResult = await siweMessage.verify({ signature })
      console.log('🧪 Basic SIWE verification result:', basicResult)
      
      // Handle different return types from SIWE library
      if (basicResult === true || (typeof basicResult === 'object' && basicResult.success)) {
        console.log('🎉 Fallback SIWE verification succeeded!')
        return true
      }
    } catch (basicError) {
      console.log('❌ Basic SIWE verification also failed:', basicError.message)
    }

    console.log('❌ All verification methods failed')
    return false

  } catch (error) {
    console.error('💥 SIWE signature verification error:', error)
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
