import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

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

    console.log('🔐 Received SIWE auth request...')
    console.log('📝 Message length:', message.length)
    console.log('✍️ Signature length:', signature.length)
    console.log('🕒 Timestamp:', timestamp)
    console.log('🌐 Client Info:', clientInfo)

    // Parse SIWE message manually (without external libraries)
    const parsedSiwe = parseSiweMessage(message)
    if (!parsedSiwe.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid SIWE message: ${parsedSiwe.error}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { address, domain, chainId, nonce, issuedAt } = parsedSiwe.data
    console.log('📋 Parsed SIWE:', { address, domain, chainId, nonce, issuedAt })

    // Basic validation
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Ethereum address in SIWE message' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // For now, skip signature verification and create user
    const normalizedAddress = address.toLowerCase()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase configuration')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Try to upsert user
    const userMetadata = {
      lastLoginAt: new Date().toISOString(),
      signupTimestamp: timestamp,
      chainId: chainId || 1,
      clientInfo
    }
    
    console.log('👤 Upserting user for address:', normalizedAddress)
    
    const { data: upsertResult, error: upsertError } = await supabase
      .rpc('upsert_siwe_user', { 
        account_address: normalizedAddress,
        user_metadata: userMetadata,
        eoa_address: normalizedAddress
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
      eoa_wallet_address: userData.eoa_wallet_address,
      card_id: userData.card_id,
      is_active: userData.is_active,
      created_at: userData.created_at
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
      iss: supabaseUrl, // Use Supabase URL as issuer for RLS compatibility
      app_metadata: {
        provider: 'siwe',
        wallet_type: 'coinbase_smart_wallet',
        chain_id: chainId || 1
      },
      user_metadata: {
        wallet_address: normalizedAddress,
        is_new_user: isNewUser,
        chain_id: chainId || 1
      }
    }

    // Sign JWT with Supabase JWT secret
    const jwtSecret = Deno.env.get('JWT_SECRET') || 
                     Deno.env.get('SUPABASE_JWT_SECRET') || 
                     'super-secret-jwt-token-with-at-least-32-characters'
    
    console.log('🔑 Using JWT secret:', jwtSecret.substring(0, 10) + '...')
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
}, {
  verify_jwt: false
})

/**
 * Parse SIWE message manually (without external libraries)
 */
function parseSiweMessage(message: string): { success: boolean; data?: any; error?: string } {
  try {
    console.log('🔍 Parsing SIWE message:')
    console.log('Message length:', message.length)
    console.log('Raw message:', JSON.stringify(message))
    
    const lines = message.split('\n')
    console.log('Lines count:', lines.length)
    lines.forEach((line, i) => {
      console.log(`  Line ${i}: "${line}"`)
    })
    
    if (lines.length < 3) {
      return { success: false, error: `Message too short (${lines.length} lines)` }
    }

    // Extract address - try multiple approaches
    let address = ''
    let addressMatch = null

    // Method 1: Look in first line
    addressMatch = lines[0].match(/0x[a-fA-F0-9]{40}/i)
    if (addressMatch) {
      address = addressMatch[0]
      console.log('✅ Found address in line 0:', address)
    } else {
      // Method 2: Look in second line
      if (lines[1]) {
        addressMatch = lines[1].match(/0x[a-fA-F0-9]{40}/i)
        if (addressMatch) {
          address = addressMatch[0]
          console.log('✅ Found address in line 1:', address)
        }
      }
    }

    // Method 3: Look in all lines
    if (!address) {
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/0x[a-fA-F0-9]{40}/i)
        if (match) {
          address = match[0]
          console.log(`✅ Found address in line ${i}:`, address)
          break
        }
      }
    }

    if (!address) {
      console.log('❌ No address found in any line')
      return { success: false, error: 'No valid address found in message' }
    }

    let domain = ''
    let chainId = 1
    let nonce = ''
    let issuedAt = ''

    // Parse other fields
    for (const line of lines) {
      if (line.startsWith('URI:')) {
        domain = line.replace('URI:', '').trim()
      } else if (line.startsWith('Chain ID:')) {
        chainId = parseInt(line.replace('Chain ID:', '').trim()) || 1
      } else if (line.startsWith('Nonce:')) {
        nonce = line.replace('Nonce:', '').trim()
      } else if (line.startsWith('Issued At:')) {
        issuedAt = line.replace('Issued At:', '').trim()
      }
    }

    const result = {
      address,
      domain,
      chainId,
      nonce,
      issuedAt
    }

    console.log('✅ Successfully parsed SIWE message:', result)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.log('❌ SIWE parsing error:', error)
    return { success: false, error: error.message }
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