import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface CreditsData {
  permissions: Permission[]
  activePermission: Permission | null
  allowanceCap: number // The recurring limit (only for recurring mode)
  availableAllowance: number // Current available amount to spend
  usedAmount: number
  totalLimit: number // Current total limit (cap_amount from active permission)
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
  mode: 'recurring' | 'topup' // New field to specify the mode
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

    try {
    // Get JWT token from Authorization header (required for RLS after disabling legacy keys)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing or invalid Authorization header. Bearer token required for RLS.' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔍 Received JWT token for RLS and custom auth:', token.substring(0, 50) + '...')
    
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
    
    console.log('✅ Custom JWT verified for user:', userInfo.wallet_address)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'GET') {
      // Get user's permissions and credit usage
      console.log('🔍 Looking for user with wallet address:', userInfo.wallet_address)
      
      // Try both exact match and case-insensitive match
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id, smart_account, eoa_wallet_address')
        .eq('smart_account', userInfo.wallet_address)
        .single()

      if (userError || !user) {
        console.log('❌ Exact match failed, trying case-insensitive match...')
        console.log('User error:', userError)
        
        // Try case-insensitive match
        const { data: userCaseInsensitive, error: userErrorCaseInsensitive } = await supabase
          .from('users')
          .select('id, smart_account, eoa_wallet_address')
          .ilike('smart_account', userInfo.wallet_address)
          .single()
        
        if (userErrorCaseInsensitive || !userCaseInsensitive) {
          console.log('❌ Case-insensitive match also failed')
          console.log('Case-insensitive error:', userErrorCaseInsensitive)
          
          // Try to get all users for debugging (limit to 5)
          const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('smart_account, eoa_wallet_address')
            .limit(5)
          
          console.log('Available users (first 5):', allUsers)
          console.log('All users error:', allUsersError)
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'User not found',
              debug: {
                searchedAddress: userInfo.wallet_address,
                exactMatchError: userError?.message,
                caseInsensitiveError: userErrorCaseInsensitive?.message,
                availableUsers: allUsers?.map(u => ({ 
                  smart_account: u.smart_account, 
                  eoa_wallet_address: u.eoa_wallet_address 
                }))
              }
            }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } else {
          user = userCaseInsensitive
          console.log('✅ Found user with case-insensitive match:', user)
        }
      } else {
        console.log('✅ Found user with exact match:', user)
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
      let totalLimit = 0
      let usedAmount = 0
      let availableAllowance = 0
      let allowanceCap = 0

      if (activePermission) {
        totalLimit = parseFloat(activePermission.cap_amount)

        // Get credit usage for active permission
        const { data: creditUsage, error: usageError } = await supabase
          .from('credit_usage')
          .select('used_amount, metadata')
          .eq('user_id', user.id)
          .eq('permission_id', activePermission.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (!usageError && creditUsage && creditUsage.length > 0) {
          usedAmount = parseFloat(creditUsage[0].used_amount)
          availableAllowance = totalLimit - usedAmount
          
          // For recurring mode, allowanceCap is the same as totalLimit
          // For top-up mode, allowanceCap is 0 (no recurring limit)
          const metadata = creditUsage[0].metadata || {}
          allowanceCap = metadata.mode === 'recurring' ? totalLimit : 0
        } else {
          availableAllowance = totalLimit
          // Default to recurring mode if no usage data
          allowanceCap = totalLimit
        }
      }

      const creditsData: CreditsData = {
        permissions: permissions || [],
        activePermission,
        allowanceCap,
        availableAllowance,
        usedAmount,
        totalLimit
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
      const { tokenAddress, capAmount, periodSeconds, spenderAddress, permissionSignature, mode } = body

      // Debug logging to see what we received
      console.log('🔍 Debug - Received request body:', {
        tokenAddress: tokenAddress || 'MISSING',
        capAmount: capAmount || 'MISSING',
        periodSeconds: periodSeconds || 'MISSING',
        spenderAddress: spenderAddress || 'MISSING',
        permissionSignature: permissionSignature ? 'Present' : 'MISSING',
        mode: mode || 'MISSING',
        bodyKeys: Object.keys(body),
        fullBody: JSON.stringify(body)
      })

      if (!tokenAddress || !capAmount || !periodSeconds || !spenderAddress || !permissionSignature) {
        console.log('❌ Validation failed - missing fields:', {
          tokenAddress: !!tokenAddress,
          capAmount: !!capAmount,
          periodSeconds: !!periodSeconds,
          spenderAddress: !!spenderAddress,
          permissionSignature: !!permissionSignature
        })
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: tokenAddress, capAmount, periodSeconds, spenderAddress, permissionSignature' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Backward compatibility: if mode is not provided, default to 'recurring'
      const finalMode = mode || 'recurring'
      console.log(`🔄 Mode: ${finalMode} (${mode ? 'provided' : 'defaulted'})`)

      if (finalMode !== 'recurring' && finalMode !== 'topup') {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid mode. Must be "recurring" or "topup"' }),
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

      console.log(`🔄 Processing ${finalMode} mode for user ${user.id}`)

      // Get current active permission and credit usage
      const { data: currentPermission } = await supabase
        .from('permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const { data: currentUsage } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let finalCapAmount = capAmount
      let currentUsedAmount = 0

      if (currentUsage) {
        currentUsedAmount = parseFloat(currentUsage.used_amount) || 0
      }

      // Handle different modes
      if (finalMode === 'recurring') {
        console.log(`🔄 Recurring mode: Resetting to new amount ${capAmount}`)
        // Recurring mode: Reset to new amount regardless of current balance
        finalCapAmount = capAmount
        
        // Revoke all existing active permissions
        if (currentPermission) {
          await supabase
            .from('permissions')
            .update({ status: 'revoked' })
            .eq('user_id', user.id)
            .eq('status', 'active')
          console.log(`✅ Revoked existing active permissions for recurring mode`)
        }
      } else if (finalMode === 'topup') {
        console.log(`💰 Top-up mode: Adding ${capAmount} to existing balance`)
        // Top-up mode: Add to current remaining balance
        const currentLimit = currentPermission ? parseFloat(currentPermission.cap_amount) : 0
        const remainingAmount = currentLimit - currentUsedAmount
        finalCapAmount = remainingAmount + capAmount
        
        console.log(`📊 Current limit: ${currentLimit}, Used: ${currentUsedAmount}, Remaining: ${remainingAmount}, New total: ${finalCapAmount}`)
        
        // Revoke existing permission since we're creating a new one with updated amount
        if (currentPermission) {
          await supabase
            .from('permissions')
            .update({ status: 'revoked' })
            .eq('user_id', user.id)
            .eq('status', 'active')
          console.log(`✅ Revoked existing permission for top-up mode`)
        }
      }

      // Calculate permission period
      const startTimestamp = new Date()
      const endTimestamp = new Date(startTimestamp.getTime() + (periodSeconds * 1000))

      // Create new permission with calculated amount
      const { data: newPermission, error: createError } = await supabase
        .from('permissions')
        .insert([
          {
            user_id: user.id,
            token_address: tokenAddress.toLowerCase(),
            cap_amount: finalCapAmount,
            period_seconds: periodSeconds,
            start_timestamp: startTimestamp.toISOString(),
            end_timestamp: endTimestamp.toISOString(),
            spender_address: spenderAddress.toLowerCase(),
            permission_signature: permissionSignature,
            status: 'active',
            metadata: {
              mode: finalMode,
              original_request_amount: capAmount,
              previous_used_amount: currentUsedAmount
            }
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

      console.log(`✅ Created new permission with final amount: ${finalCapAmount}`)

      // Initialize credit usage tracking
      // For top-up mode, carry over the used amount; for recurring mode, start fresh
      const initialUsedAmount = finalMode === 'topup' ? currentUsedAmount : 0
      
      const { error: usageError } = await supabase
        .from('credit_usage')
        .insert([
          {
            user_id: user.id,
            permission_id: newPermission.id,
            period_start: startTimestamp.toISOString(),
            period_end: endTimestamp.toISOString(),
            total_limit: finalCapAmount,
            used_amount: initialUsedAmount,
            transaction_count: 0,
            metadata: {
              mode: finalMode,
              carried_over_usage: currentUsedAmount
            }
          }
        ])

      if (usageError) {
        console.error('Error initializing credit usage:', usageError)
        // Don't fail the request, just log the error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { 
            permission: newPermission,
            mode: finalMode,
            finalAmount: finalCapAmount,
            requestedAmount: capAmount,
            previousUsedAmount: currentUsedAmount,
            remainingAmount: finalCapAmount - initialUsedAmount
          },
          message: `${finalMode === 'recurring' ? 'Recurring credits' : 'Top-up credits'} assigned successfully`
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
}, {
  verify_jwt: false
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