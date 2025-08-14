import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CardAuthWebhook {
  card_id: string
  auth_id: string
  amount: number
  merchant: string
  timestamp: string
  status: 'authorized' | 'declined'
  metadata?: Record<string, any>
}

/**
 * Card vendor webhook handler for authorization events
 * 卡供应商授权事件的 webhook 处理程序
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // For API testing, allow both JWT and API key authentication
    const authHeader = req.headers.get('authorization')
    const apikey = req.headers.get('apikey')
    
    // Use service role for backend operations, but validate request
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify webhook signature (implement based on card vendor specs)
    const signature = req.headers.get('x-webhook-signature')
    const payload = await req.text()
    
    // TODO: Implement signature verification
    // const isValid = await verifyWebhookSignature(payload, signature)
    // if (!isValid) {
    //   return new Response('Invalid signature', { status: 401 })
    // }

    const webhookData: CardAuthWebhook = JSON.parse(payload)
    
    console.log('Received card auth webhook:', webhookData)

    // Find user by card_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, smart_account')
      .eq('card_id', webhookData.card_id)
      .single()

    if (userError || !user) {
      console.error('User not found for card_id:', webhookData.card_id)
      return new Response('User not found', { status: 404 })
    }

    // Check for duplicate auth_id (idempotency)
    const { data: existingReceipt } = await supabase
      .from('receipts')
      .select('id')
      .eq('auth_id', webhookData.auth_id)
      .single()

    if (existingReceipt) {
      console.log('Duplicate auth_id, skipping:', webhookData.auth_id)
      return new Response('Already processed', { status: 200 })
    }

    if (webhookData.status === 'declined') {
      // Store declined transaction for analytics
      await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          card_id: webhookData.card_id,
          auth_id: webhookData.auth_id,
          amount: webhookData.amount,
          merchant: webhookData.merchant,
          status: 'failed',
          metadata: { 
            decline_reason: 'card_declined',
            ...webhookData.metadata 
          }
        })

      return new Response('Decline recorded', { status: 200 })
    }

    // Create pending receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        card_id: webhookData.card_id,
        auth_id: webhookData.auth_id,
        amount: webhookData.amount,
        merchant: webhookData.merchant,
        status: 'pending',
        metadata: webhookData.metadata
      })
      .select()
      .single()

    if (receiptError) {
      console.error('Failed to create receipt:', receiptError)
      return new Response('Database error', { status: 500 })
    }

    // Get active spend permission for this user
    const { data: permission, error: permissionError } = await supabase
      .from('permissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('end_timestamp', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (permissionError || !permission) {
      console.error('No active permission found for user:', user.id)
      
      // Update receipt to failed
      await supabase
        .from('receipts')
        .update({ 
          status: 'failed',
          metadata: { error: 'no_active_permission' }
        })
        .eq('id', receipt.id)

      return new Response('No active permission', { status: 400 })
    }

    // Execute spend permission charge
    try {
      const spendResult = await executeSpendPermission({
        user: user.smart_account,
        permission,
        amount: webhookData.amount,
        authId: webhookData.auth_id,
        merchant: webhookData.merchant
      })

      // Update receipt with transaction hash
      await supabase
        .from('receipts')
        .update({
          status: 'completed',
          chain_tx: spendResult.transactionHash,
          metadata: {
            ...webhookData.metadata,
            gas_used: spendResult.gasUsed,
            block_number: spendResult.blockNumber
          }
        })
        .eq('id', receipt.id)

      // Update credit usage tracking
      const periodStart = new Date(permission.start_timestamp)
      const periodEnd = new Date(permission.end_timestamp)
      
      await supabase.rpc('update_credit_usage_on_charge', {
        p_user_id: user.id,
        p_permission_id: permission.id,
        p_amount: webhookData.amount,
        p_period_start: periodStart.toISOString(),
        p_period_end: periodEnd.toISOString(),
        p_total_limit: permission.cap_amount
      })

      console.log('Charge completed successfully:', spendResult.transactionHash)

      return new Response(JSON.stringify({
        success: true,
        receipt_id: receipt.id,
        transaction_hash: spendResult.transactionHash
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })

    } catch (error) {
      console.error('Spend execution failed:', error)
      
      // Update receipt to failed
      await supabase
        .from('receipts')
        .update({
          status: 'failed',
          metadata: {
            ...webhookData.metadata,
            error: error.message || 'spend_execution_failed'
          }
        })
        .eq('id', receipt.id)

      return new Response(JSON.stringify({
        success: false,
        error: 'Spend execution failed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

/**
 * Execute spend permission on-chain
 * 在链上执行支出权限
 */
async function executeSpendPermission({
  user,
  permission,
  amount,
  authId,
  merchant
}: {
  user: string
  permission: any
  amount: number
  authId: string
  merchant: string
}) {
  // This would integrate with the actual spend permission contracts
  // For now, we simulate the transaction
  // 这将与实际的支出权限合约集成
  // 现在我们模拟交易
  
  console.log('Executing spend permission:', {
    user,
    amount,
    authId,
    merchant,
    permission: permission.id
  })

  // TODO: Implement actual blockchain transaction
  // 1. Prepare spend call data using permission manager SDK
  // 2. Submit transaction to PagentSettlementSpender contract
  // 3. Return transaction result
  
  // Simulated response for development
  return {
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    gasUsed: 150000,
    blockNumber: Math.floor(Math.random() * 1000000) + 18000000
  }
}

/* global Deno */
