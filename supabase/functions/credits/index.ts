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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
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

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    // Simple JWT verification (in production, use proper JWT library)
    const [header, payload, signature] = token.split('.')
    
    if (!header || !payload || !signature) {
      return null
    }

    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return {
      wallet_address: decodedPayload.wallet_address,
      user_id: decodedPayload.sub || decodedPayload.user_id
    }
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}