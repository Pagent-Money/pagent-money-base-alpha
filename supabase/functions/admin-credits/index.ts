import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface AssignCreditsRequest {
  userWalletAddress: string
  creditType: 'recurring' | 'topup' | 'one-time'
  amount: number
  periodSeconds?: number // For recurring credits
  description?: string
  metadata?: Record<string, any>
}

interface RecurringCreditConfig {
  id: string
  user_id: string
  amount: number
  period_seconds: number
  next_assignment: string
  status: 'active' | 'paused' | 'cancelled'
  description: string
  metadata: Record<string, any>
}

interface CreditAssignment {
  id: string
  user_id: string
  amount: number
  credit_type: 'recurring' | 'topup' | 'one-time'
  assigned_at: string
  expires_at?: string
  status: 'active' | 'used' | 'expired'
  description: string
  metadata: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin authorization (in production, implement proper admin auth)
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

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const body: AssignCreditsRequest = await req.json()
      const { userWalletAddress, creditType, amount, periodSeconds, description, metadata } = body

      if (!userWalletAddress || !creditType || !amount) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: userWalletAddress, creditType, amount' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get user by wallet address
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, smart_account')
        .eq('smart_account', userWalletAddress.toLowerCase())
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

      let result: any = {}

      if (creditType === 'recurring') {
        result = await assignRecurringCredits(supabase, user.id, amount, periodSeconds || 30 * 24 * 60 * 60, description, metadata)
      } else if (creditType === 'topup') {
        result = await assignTopUpCredits(supabase, user.id, amount, description, metadata)
      } else if (creditType === 'one-time') {
        result = await assignOneTimeCredits(supabase, user.id, amount, description, metadata)
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credit type. Must be: recurring, topup, or one-time' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (result.error) {
        return new Response(
          JSON.stringify({ success: false, error: result.error }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result.data,
          message: `${creditType} credits assigned successfully`
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (req.method === 'GET') {
      // Get credit assignments and recurring configurations
      const url = new URL(req.url)
      const userWalletAddress = url.searchParams.get('userWalletAddress')

      if (!userWalletAddress) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing userWalletAddress parameter' }),
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
        .eq('smart_account', userWalletAddress.toLowerCase())
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

      // Get credit assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('credit_assignments')
        .select('*')
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })

      // Get recurring credit configurations
      const { data: recurringConfigs, error: recurringError } = await supabase
        .from('recurring_credit_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (assignmentsError || recurringError) {
        console.error('Error fetching credit data:', { assignmentsError, recurringError })
        return new Response(
          JSON.stringify({ success: false, error: 'Error fetching credit data' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            assignments: assignments || [],
            recurringConfigs: recurringConfigs || []
          }
        }),
        { 
          status: 200, 
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
    console.error('Admin Credits API error:', error)
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
 * Assign recurring credits to a user
 */
async function assignRecurringCredits(
  supabase: any, 
  userId: string, 
  amount: number, 
  periodSeconds: number,
  description?: string,
  metadata?: Record<string, any>
) {
  try {
    // Create recurring credit configuration
    const nextAssignment = new Date(Date.now() + periodSeconds * 1000)
    
    const { data: recurringConfig, error: configError } = await supabase
      .from('recurring_credit_configs')
      .insert([
        {
          user_id: userId,
          amount: amount,
          period_seconds: periodSeconds,
          next_assignment: nextAssignment.toISOString(),
          status: 'active',
          description: description || `Recurring credits: $${amount} every ${Math.floor(periodSeconds / 86400)} days`,
          metadata: metadata || {}
        }
      ])
      .select()
      .single()

    if (configError) {
      console.error('Error creating recurring config:', configError)
      return { error: 'Failed to create recurring credit configuration' }
    }

    // Assign initial credits
    const initialAssignment = await assignOneTimeCredits(
      supabase, 
      userId, 
      amount, 
      `Initial recurring credit assignment: ${description || 'Recurring credits'}`,
      { ...metadata, recurring_config_id: recurringConfig.id, is_recurring: true }
    )

    if (initialAssignment.error) {
      return initialAssignment
    }

    return {
      data: {
        recurringConfig,
        initialAssignment: initialAssignment.data
      }
    }
  } catch (error) {
    console.error('Error in assignRecurringCredits:', error)
    return { error: 'Failed to assign recurring credits' }
  }
}

/**
 * Assign top-up credits to a user (adds to existing active permission)
 */
async function assignTopUpCredits(
  supabase: any, 
  userId: string, 
  amount: number,
  description?: string,
  metadata?: Record<string, any>
) {
  try {
    // Get user's active permission
    const { data: activePermission, error: permissionError } = await supabase
      .from('permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (permissionError) {
      console.error('Error fetching active permission:', permissionError)
      return { error: 'Failed to fetch active permission' }
    }

    let topUpResult: any = {}

    if (activePermission && activePermission.length > 0) {
      const permission = activePermission[0]
      
      // Update the permission cap amount
      const newCapAmount = parseFloat(permission.cap_amount) + amount
      
      const { data: updatedPermission, error: updateError } = await supabase
        .from('permissions')
        .update({ cap_amount: newCapAmount })
        .eq('id', permission.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating permission cap:', updateError)
        return { error: 'Failed to update permission cap amount' }
      }

      // Update credit usage total limit
      const { error: usageUpdateError } = await supabase
        .from('credit_usage')
        .update({ total_limit: newCapAmount })
        .eq('permission_id', permission.id)

      if (usageUpdateError) {
        console.error('Error updating credit usage limit:', usageUpdateError)
        // Don't fail the request, just log the error
      }

      topUpResult.updatedPermission = updatedPermission
    }

    // Record the credit assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('credit_assignments')
      .insert([
        {
          user_id: userId,
          amount: amount,
          credit_type: 'topup',
          assigned_at: new Date().toISOString(),
          status: 'active',
          description: description || `Top-up credits: $${amount}`,
          metadata: { ...metadata, is_topup: true }
        }
      ])
      .select()
      .single()

    if (assignmentError) {
      console.error('Error recording credit assignment:', assignmentError)
      return { error: 'Failed to record credit assignment' }
    }

    topUpResult.assignment = assignment

    return { data: topUpResult }
  } catch (error) {
    console.error('Error in assignTopUpCredits:', error)
    return { error: 'Failed to assign top-up credits' }
  }
}

/**
 * Assign one-time credits to a user
 */
async function assignOneTimeCredits(
  supabase: any, 
  userId: string, 
  amount: number,
  description?: string,
  metadata?: Record<string, any>
) {
  try {
    // Create a new spend permission for the credits
    const startTimestamp = new Date()
    const endTimestamp = new Date(startTimestamp.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days default

    const { data: newPermission, error: permissionError } = await supabase
      .from('permissions')
      .insert([
        {
          user_id: userId,
          token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
          cap_amount: amount,
          period_seconds: 30 * 24 * 60 * 60, // 30 days
          start_timestamp: startTimestamp.toISOString(),
          end_timestamp: endTimestamp.toISOString(),
          spender_address: '0x0000000000000000000000000000000000000000', // Placeholder
          permission_signature: '0x0000000000000000000000000000000000000000000000000000000000000000', // Placeholder
          status: 'active'
        }
      ])
      .select()
      .single()

    if (permissionError) {
      console.error('Error creating permission:', permissionError)
      return { error: 'Failed to create spend permission' }
    }

    // Initialize credit usage tracking
    const { error: usageError } = await supabase
      .from('credit_usage')
      .insert([
        {
          user_id: userId,
          permission_id: newPermission.id,
          period_start: startTimestamp.toISOString(),
          period_end: endTimestamp.toISOString(),
          total_limit: amount,
          used_amount: 0,
          transaction_count: 0
        }
      ])

    if (usageError) {
      console.error('Error initializing credit usage:', usageError)
      // Don't fail the request, just log the error
    }

    // Record the credit assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('credit_assignments')
      .insert([
        {
          user_id: userId,
          amount: amount,
          credit_type: 'one-time',
          assigned_at: new Date().toISOString(),
          expires_at: endTimestamp.toISOString(),
          status: 'active',
          description: description || `One-time credits: $${amount}`,
          metadata: { ...metadata, permission_id: newPermission.id }
        }
      ])
      .select()
      .single()

    if (assignmentError) {
      console.error('Error recording credit assignment:', assignmentError)
      return { error: 'Failed to record credit assignment' }
    }

    return {
      data: {
        permission: newPermission,
        assignment: assignment
      }
    }
  } catch (error) {
    console.error('Error in assignOneTimeCredits:', error)
    return { error: 'Failed to assign one-time credits' }
  }
}
