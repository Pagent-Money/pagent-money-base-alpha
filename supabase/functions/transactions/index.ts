import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface TransactionsData {
  transactions: Transaction[]
  pagination: {
    limit: number
    offset: number
    total: number
    has_more: boolean
  }
}

interface Transaction {
  id: string
  user_id: string
  card_id?: string
  auth_id: string
  amount: number
  merchant: string
  chain_tx?: string
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  created_at: string
  updated_at: string
  metadata: any
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
      // Parse query parameters
      const url = new URL(req.url)
      const limitParam = url.searchParams.get('limit')
      const offsetParam = url.searchParams.get('offset')
      const statusFilter = url.searchParams.get('status')
      const merchantFilter = url.searchParams.get('merchant')

      const limit = limitParam ? parseInt(limitParam) : 20
      const offset = offsetParam ? parseInt(offsetParam) : 0

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

      // Build query for transactions (receipts table)
      let query = supabase
        .from('receipts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      if (merchantFilter) {
        query = query.ilike('merchant', `%${merchantFilter}%`)
      }

      const { data: receipts, error: receiptsError, count } = await query

      if (receiptsError) {
        console.error('Error fetching transactions:', receiptsError)
        return new Response(
          JSON.stringify({ success: false, error: 'Error fetching transactions' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Transform receipts to transactions
      const transactions: Transaction[] = (receipts || []).map(receipt => ({
        id: receipt.id,
        user_id: receipt.user_id,
        card_id: receipt.card_id,
        auth_id: receipt.auth_id,
        amount: parseFloat(receipt.amount),
        merchant: receipt.merchant,
        chain_tx: receipt.chain_tx,
        status: receipt.status,
        created_at: receipt.created_at,
        updated_at: receipt.updated_at,
        metadata: receipt.metadata
      }))

      const total = count || 0
      const has_more = offset + limit < total

      const transactionsData: TransactionsData = {
        transactions,
        pagination: {
          limit,
          offset,
          total,
          has_more
        }
      }

      return new Response(
        JSON.stringify({ success: true, data: transactionsData }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (req.method === 'POST') {
      // Create new transaction (receipt)
      const body = await req.json()
      const { authId, amount, merchant, cardId, chainTx, metadata } = body

      if (!authId || !amount || !merchant) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: authId, amount, merchant' }),
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

      // Create new receipt/transaction
      const { data: newReceipt, error: createError } = await supabase
        .from('receipts')
        .insert([
          {
            user_id: user.id,
            card_id: cardId,
            auth_id: authId,
            amount: amount,
            merchant: merchant,
            chain_tx: chainTx,
            status: 'pending',
            metadata: metadata || {}
          }
        ])
        .select()
        .single()

      if (createError || !newReceipt) {
        console.error('Error creating transaction:', createError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create transaction' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Update credit usage if applicable
      await updateCreditUsage(supabase, user.id, parseFloat(amount))

      const transaction: Transaction = {
        id: newReceipt.id,
        user_id: newReceipt.user_id,
        card_id: newReceipt.card_id,
        auth_id: newReceipt.auth_id,
        amount: parseFloat(newReceipt.amount),
        merchant: newReceipt.merchant,
        chain_tx: newReceipt.chain_tx,
        status: newReceipt.status,
        created_at: newReceipt.created_at,
        updated_at: newReceipt.updated_at,
        metadata: newReceipt.metadata
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { transaction },
          message: 'Transaction created successfully'
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
    console.error('Transactions API error:', error)
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
 * Update credit usage when a transaction occurs
 */
async function updateCreditUsage(supabase: any, userId: string, amount: number) {
  try {
    // Get active permission for user
    const { data: activePermission, error: permissionError } = await supabase
      .from('permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (permissionError || !activePermission || activePermission.length === 0) {
      console.log('No active permission found for user:', userId)
      return
    }

    const permission = activePermission[0]

    // Calculate current period
    const now = new Date()
    const periodStart = new Date(permission.start_timestamp)
    const periodEnd = new Date(permission.end_timestamp)

    // Use the database function to update credit usage
    const { error: updateError } = await supabase.rpc('update_credit_usage_on_charge', {
      p_user_id: userId,
      p_permission_id: permission.id,
      p_amount: amount,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
      p_total_limit: parseFloat(permission.cap_amount)
    })

    if (updateError) {
      console.error('Error updating credit usage:', updateError)
    } else {
      console.log('Credit usage updated successfully for user:', userId)
    }
  } catch (error) {
    console.error('Error in updateCreditUsage:', error)
  }
}

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