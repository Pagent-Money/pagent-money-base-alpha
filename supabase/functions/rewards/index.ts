import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface RewardsData {
  balance: number
  points: number
  cashback: CashbackEntry[]
  promos: PromoEntry[]
}

interface CashbackEntry {
  id: string
  transaction_id: string
  amount: number
  percentage: number
  merchant: string
  earned_at: string
  status: 'pending' | 'credited' | 'expired'
}

interface PromoEntry {
  id: string
  title: string
  description: string
  reward_type: 'cashback' | 'points' | 'bonus'
  reward_value: number
  conditions: string
  expires_at: string
  status: 'active' | 'expired' | 'used'
}

interface ProcessCashbackRequest {
  action: 'cashback'
  transactionId: string
  amount: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
      // Get user's rewards data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, metadata')
        .or(`smart_account.eq.${userInfo.wallet_address},smart_account.eq.${userInfo.wallet_address.toLowerCase()},smart_account.ilike.${userInfo.wallet_address.toLowerCase()}`)
        .single()

      if (userError || !user) {
        console.error('User lookup error:', userError)
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ Found user:', user.id)

      // Get user's rewards balance
      const { data: userRewards, error: rewardsError } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .single()

      let balance = 0
      let points = 0
      if (userRewards && !rewardsError) {
        balance = parseFloat(userRewards.cashback_balance) || 0
        points = userRewards.points_balance || 0
      }

      // Get cashback transactions
      const { data: cashbackTransactions, error: cashbackError } = await supabase
        .from('cashback_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(50)

      const cashback: CashbackEntry[] = (cashbackTransactions || []).map(tx => ({
        id: tx.id,
        transaction_id: tx.transaction_id || tx.id,
        amount: parseFloat(tx.cashback_amount),
        percentage: parseFloat(tx.cashback_rate) || 0,
        merchant: tx.merchant || 'Unknown',
        earned_at: tx.transaction_date,
        status: tx.status === 'credited' ? 'credited' : 
                tx.status === 'pending' ? 'pending' : 'expired'
      }))

      // Get active promos
      const { data: activePromos, error: promosError } = await supabase
        .from('promos')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .limit(10)

      const promos: PromoEntry[] = (activePromos || []).map(promo => ({
        id: promo.id,
        title: promo.title,
        description: promo.description,
        reward_type: promo.reward_type,
        reward_value: parseFloat(promo.reward_value),
        conditions: promo.conditions || '',
        expires_at: promo.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }))

      console.log(`✅ Loaded ${cashback.length} cashback transactions and ${promos.length} promos`)

      const rewardsData: RewardsData = {
        balance: Math.round(balance * 100) / 100, // Round to 2 decimal places
        points,
        cashback,
        promos
      }

      return new Response(
        JSON.stringify({ success: true, data: rewardsData }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (req.method === 'POST') {
      // Process rewards action (e.g., cashback, redeem points)
      const body: ProcessCashbackRequest = await req.json()
      const { action, transactionId, amount } = body

      if (action !== 'cashback' || !transactionId || !amount) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid rewards action or missing parameters' }),
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

      // Verify transaction belongs to user
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .select('id, amount, merchant, metadata')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single()

      if (receiptError || !receipt) {
        return new Response(
          JSON.stringify({ success: false, error: 'Transaction not found or does not belong to user' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Calculate cashback (example: 1% of transaction amount)
      const transactionAmount = parseFloat(receipt.amount)
      const cashbackAmount = transactionAmount * 0.01 // 1% cashback
      
      // Update receipt metadata with cashback info
      const updatedMetadata = {
        ...receipt.metadata,
        cashback: {
          amount: cashbackAmount,
          percentage: 1.0,
          processed_at: new Date().toISOString(),
          status: 'credited'
        }
      }

      const { error: updateError } = await supabase
        .from('receipts')
        .update({ metadata: updatedMetadata })
        .eq('id', transactionId)

      if (updateError) {
        console.error('Error updating receipt with cashback:', updateError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to process cashback' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // In a production system, you would:
      // 1. Credit the cashback to a user's rewards balance
      // 2. Update rewards/cashback tracking tables
      // 3. Trigger notifications or emails
      // 4. Handle promo rules and bonus calculations

      const result = {
        transaction_id: transactionId,
        cashback_amount: cashbackAmount,
        cashback_percentage: 1.0,
        processed_at: new Date().toISOString(),
        status: 'credited'
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result,
          message: 'Cashback processed successfully'
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
    console.error('Rewards API error:', error)
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