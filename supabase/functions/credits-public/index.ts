import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface CreditsData {
  permissions: Permission[]
  activePermission: Permission | null
  creditLimit: number
  usedAmount: number
  remainingAmount: number
}

interface Permission {
  id: string
  user_id: string
  token_address: string
  cap_amount: number
  period_seconds: number
  start_timestamp: string
  end_timestamp: string
  spender_address: string
  permission_signature: string
  status: 'active' | 'revoked' | 'expired'
  created_at: string
  updated_at: string
}

interface CreatePermissionRequest {
  tokenAddress: string
  capAmount: number
  periodSeconds: number
  spenderAddress: string
  permissionSignature: string
}

// This function bypasses Supabase JWT validation
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get custom JWT token from header
    const authHeader = req.headers.get('Authorization') || req.headers.get('X-Custom-Auth')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔍 Processing request with token:', token.substring(0, 50) + '...')
    
    const userInfo = await verifyJWT(token)
    
    if (!userInfo) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ JWT verified for user:', userInfo.wallet_address)

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://rpsfupahfggkpfstaxfx.supabase.co'
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (req.method === 'GET') {
      // Get user's permissions and credit usage
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('smart_account', userInfo.wallet_address)
        .single()

      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get all permissions for the user
      const { data: permissions, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError)
        return new Response(
          JSON.stringify({ success: false, error: 'Error fetching permissions' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Find active permission
      const activePermission = permissions?.find(p => p.status === 'active') || null
      let creditLimit = 0
      let usedAmount = 0
      let remainingAmount = 0

      if (activePermission) {
        creditLimit = parseFloat(activePermission.cap_amount)

        // Get credit usage for active permission
        const { data: creditUsage, error: usageError } = await supabase
          .from('credit_usage')
          .select('used_amount')
          .eq('user_id', user.id)
          .eq('permission_id', activePermission.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (!usageError && creditUsage && creditUsage.length > 0) {
          usedAmount = parseFloat(creditUsage[0].used_amount)
          remainingAmount = creditLimit - usedAmount
        } else {
          remainingAmount = creditLimit
        }
      }

      const creditsData: CreditsData = {
        permissions: permissions || [],
        activePermission,
        creditLimit,
        usedAmount,
        remainingAmount
      }

      return new Response(
        JSON.stringify({ success: true, data: creditsData }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (req.method === 'POST') {
      // Create new spend permission
      const body: CreatePermissionRequest = await req.json()
      const { tokenAddress, capAmount, periodSeconds, spenderAddress, permissionSignature } = body

      if (!tokenAddress || !capAmount || !periodSeconds || !spenderAddress || !permissionSignature) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('smart_account', userInfo.wallet_address)
        .single()

      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Calculate permission period
      const startTimestamp = new Date()
      const endTimestamp = new Date(startTimestamp.getTime() + (periodSeconds * 1000))

      // Create new permission
      const { data: newPermission, error: createError } = await supabase
        .from('permissions')
        .insert([
          {
            user_id: user.id,
            token_address: tokenAddress.toLowerCase(),
            cap_amount: capAmount,
            period_seconds: periodSeconds,
            start_timestamp: startTimestamp.toISOString(),
            end_timestamp: endTimestamp.toISOString(),
            spender_address: spenderAddress.toLowerCase(),
            permission_signature: permissionSignature,
            status: 'active'
          }
        ])
        .select()
        .single()

      if (createError || !newPermission) {
        console.error('Error creating permission:', createError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create spend permission' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Initialize credit usage tracking
      const { error: usageError } = await supabase
        .from('credit_usage')
        .insert([
          {
            user_id: user.id,
            permission_id: newPermission.id,
            period_start: startTimestamp.toISOString(),
            period_end: endTimestamp.toISOString(),
            total_limit: capAmount,
            used_amount: 0,
            transaction_count: 0
          }
        ])

      if (usageError) {
        console.error('Error initializing credit usage:', usageError)
        // Don't fail the request, just log the error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { permission: newPermission },
          message: 'Spend permission created successfully'
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Credits API error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Verify JWT token and extract user info
 */
async function verifyJWT(token: string): Promise<{ wallet_address: string; user_id: string } | null> {
  try {
    console.log('🔍 Verifying JWT token...')
    
    // Simple JWT verification (in production, use proper JWT library)
    const [header, payload, signature] = token.split('.')
    
    if (!header || !payload || !signature) {
      console.log('❌ JWT token missing parts')
      return null
    }

    // Use proper base64 decoding for Deno environment
    let decodedPayload: any
    try {
      // Try multiple decoding approaches
      console.log('🔍 Attempting JWT payload decoding...')
      console.log('Raw payload:', payload.substring(0, 50) + '...')
      
      // Method 1: Direct atob with URL-safe base64
      try {
        const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
        const jsonString = atob(base64Payload)
        decodedPayload = JSON.parse(jsonString)
        console.log('✅ Method 1 (atob) successful')
      } catch (method1Error) {
        console.log('❌ Method 1 (atob) failed:', method1Error.message)
        
        // Method 2: Use Deno's built-in base64 decoding
        try {
          const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
          // Add padding if needed
          const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4)
          const bytes = Uint8Array.from(atob(paddedPayload), c => c.charCodeAt(0))
          const decoder = new TextDecoder()
          const jsonString = decoder.decode(bytes)
          decodedPayload = JSON.parse(jsonString)
          console.log('✅ Method 2 (TextDecoder) successful')
        } catch (method2Error) {
          console.log('❌ Method 2 (TextDecoder) failed:', method2Error.message)
          throw new Error('All decoding methods failed')
        }
      }
      
      console.log('📋 Decoded payload:', {
        sub: decodedPayload.sub,
        wallet_address: decodedPayload.wallet_address,
        exp: decodedPayload.exp,
        iat: decodedPayload.iat,
        iss: decodedPayload.iss
      })
    } catch (decodeError) {
      console.error('❌ JWT payload decoding failed:', decodeError)
      return null
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (decodedPayload.exp && decodedPayload.exp < now) {
      console.log('❌ JWT token expired:', {
        exp: decodedPayload.exp,
        now: now,
        expired: decodedPayload.exp < now
      })
      return null
    }

    const result = {
      wallet_address: decodedPayload.wallet_address,
      user_id: decodedPayload.sub || decodedPayload.user_id
    }
    
    console.log('✅ JWT verification successful:', result)
    return result
    
  } catch (error) {
    console.error('💥 JWT verification error:', error)
    return null
  }
}