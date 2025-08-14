import { createClient } from './supabase'
import { createPaymentIntent } from './stripe'

/**
 * Payment Processing Utilities
 * Handles the flow between Pagent Cards, Credit Limits, and external payment processors
 */

export interface PaymentRequest {
  userAddress: string
  cardId: string
  amount: number // Amount in cents
  currency?: string
  merchant: string
  merchantCategory?: string
  description?: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  paymentIntentId?: string
  clientSecret?: string
  error?: string
  requiresAction?: boolean
}

/**
 * Process a payment request through Pagent Card system
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  const supabase = createClient()
  
  try {
    // 1. Validate card and check limits
    const cardValidation = await validateCardForPayment(supabase, request)
    if (!cardValidation.success) {
      return { success: false, error: cardValidation.error }
    }

    const { card } = cardValidation

    // 2. Check credit permissions
    const creditCheck = await validateCreditPermissions(supabase, request.userAddress, request.amount)
    if (!creditCheck.success) {
      return { success: false, error: creditCheck.error }
    }

    // 3. Create transaction record (pending)
    const transactionId = crypto.randomUUID()
    const transaction = {
      id: transactionId,
      card_id: request.cardId,
      user_address: request.userAddress.toLowerCase(),
      amount: request.amount,
      currency: request.currency || 'USD',
      merchant: request.merchant,
      merchant_category: request.merchantCategory || 'general',
      transaction_type: 'purchase',
      status: 'pending',
      metadata: request.metadata || {},
      created_at: new Date().toISOString()
    }

    const { error: txError } = await supabase
      .from('card_transactions')
      .insert([transaction])

    if (txError) {
      throw new Error(`Failed to create transaction: ${txError.message}`)
    }

    // 4. Create payment intent with Stripe
    const paymentIntent = await createPaymentIntent({
      amount: request.amount,
      currency: request.currency?.toLowerCase() || 'usd',
      cardId: request.cardId,
      userAddress: request.userAddress,
      merchantName: request.merchant,
      merchantCategory: request.merchantCategory,
      description: request.description
    })

    if (!paymentIntent.success) {
      // Mark transaction as failed
      await supabase
        .from('card_transactions')
        .update({ 
          status: 'failed',
          metadata: { ...request.metadata, error: paymentIntent.error }
        })
        .eq('id', transactionId)

      return { success: false, error: paymentIntent.error }
    }

    // 5. Update transaction with payment intent ID
    await supabase
      .from('card_transactions')
      .update({ 
        external_transaction_id: paymentIntent.paymentIntentId,
        metadata: { ...request.metadata, stripe_payment_intent: paymentIntent.paymentIntentId }
      })
      .eq('id', transactionId)

    return {
      success: true,
      transactionId,
      paymentIntentId: paymentIntent.paymentIntentId,
      clientSecret: paymentIntent.clientSecret
    }

  } catch (error) {
    console.error('Payment processing error:', error)
    return {
      success: false,
      error: error.message || 'Payment processing failed'
    }
  }
}

/**
 * Validate card eligibility for payment
 */
async function validateCardForPayment(supabase: any, request: PaymentRequest) {
  try {
    const { data: card, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .eq('id', request.cardId)
      .eq('user_address', request.userAddress.toLowerCase())
      .single()

    if (error || !card) {
      return { success: false, error: 'Card not found or access denied' }
    }

    if (card.status !== 'active') {
      return { success: false, error: 'Card is not active' }
    }

    // Check if transaction would exceed credit limit
    const newBalance = card.balance + request.amount
    if (newBalance > card.credit_limit) {
      return { 
        success: false, 
        error: `Transaction would exceed credit limit. Available: $${(card.credit_limit - card.balance) / 100}` 
      }
    }

    return { success: true, card }
  } catch (error) {
    return { success: false, error: 'Card validation failed' }
  }
}

/**
 * Validate credit permissions for the transaction
 */
async function validateCreditPermissions(supabase: any, userAddress: string, amount: number) {
  try {
    // Get active spend permission
    const { data: permission, error } = await supabase
      .from('spend_permissions')
      .select('*')
      .eq('user_address', userAddress.toLowerCase())
      .eq('status', 'active')
      .single()

    if (error || !permission) {
      return { success: false, error: 'No active spend permission found' }
    }

    // Check if permission has expired
    const now = new Date()
    const endTime = new Date(permission.end_timestamp)
    if (now > endTime) {
      return { success: false, error: 'Spend permission has expired' }
    }

    // Get current period usage
    const periodStart = new Date(permission.start_timestamp)
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_address', userAddress.toLowerCase())
      .eq('permission_id', permission.id)
      .eq('status', 'completed')
      .gte('created_at', periodStart.toISOString())

    const currentUsage = transactions?.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) || 0
    
    // Check if transaction would exceed spend limit
    if (currentUsage + amount > permission.cap_amount) {
      const available = permission.cap_amount - currentUsage
      return { 
        success: false, 
        error: `Transaction would exceed spend limit. Available: $${available / 100}` 
      }
    }

    return { success: true, permission }
  } catch (error) {
    return { success: false, error: 'Credit permission validation failed' }
  }
}

/**
 * Complete a payment after successful processing
 */
export async function completePayment(transactionId: string, paymentIntentId: string) {
  const supabase = createClient()
  
  try {
    // Update transaction status
    const { data: transaction, error: txError } = await supabase
      .from('card_transactions')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single()

    if (txError || !transaction) {
      throw new Error('Failed to update transaction status')
    }

    // Update card balance
    const { data: card } = await supabase
      .from('virtual_cards')
      .select('balance')
      .eq('id', transaction.card_id)
      .single()

    if (card) {
      await supabase
        .from('virtual_cards')
        .update({
          balance: card.balance + transaction.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.card_id)
    }

    // Record credit usage
    await recordCreditUsage(supabase, transaction)

    // Process cashback
    await processCashbackReward(supabase, transaction)

    return { success: true, transaction }
  } catch (error) {
    console.error('Payment completion error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Record credit usage against spend permission
 */
async function recordCreditUsage(supabase: any, transaction: any) {
  try {
    // Get active permission
    const { data: permission } = await supabase
      .from('spend_permissions')
      .select('id')
      .eq('user_address', transaction.user_address)
      .eq('status', 'active')
      .single()

    if (!permission) return

    // Create credit transaction record
    const creditTransaction = {
      id: crypto.randomUUID(),
      user_address: transaction.user_address,
      permission_id: permission.id,
      amount: transaction.amount,
      description: `Card transaction: ${transaction.merchant}`,
      merchant: transaction.merchant,
      transaction_hash: transaction.external_transaction_id,
      status: 'completed',
      metadata: {
        card_transaction_id: transaction.id,
        source: 'card_purchase'
      },
      created_at: transaction.created_at,
      completed_at: new Date().toISOString()
    }

    await supabase
      .from('credit_transactions')
      .insert([creditTransaction])

  } catch (error) {
    console.error('Credit usage recording error:', error)
  }
}

/**
 * Process cashback rewards for completed transaction
 */
async function processCashbackReward(supabase: any, transaction: any) {
  try {
    // Get user's loyalty tier
    const { data: loyaltyTier } = await supabase
      .from('loyalty_tiers')
      .select('multiplier')
      .eq('user_address', transaction.user_address)
      .single()

    const multiplier = loyaltyTier?.multiplier || 1.0
    const pgtAmount = Math.floor((transaction.amount / 100) * 100 * multiplier) // 1:1 cashback with multiplier

    // Create cashback record
    const cashbackRecord = {
      id: crypto.randomUUID(),
      user_address: transaction.user_address,
      transaction_id: transaction.id,
      source: 'card_purchase',
      amount: transaction.amount,
      pgt_amount: pgtAmount,
      multiplier: multiplier,
      created_at: new Date().toISOString()
    }

    await supabase
      .from('cashback_history')
      .insert([cashbackRecord])

    // Update PGT balance
    await supabase.rpc('increment_pgt_balance', {
      user_addr: transaction.user_address,
      amount: pgtAmount
    })

    console.log(`Cashback processed: ${pgtAmount} PGT for user ${transaction.user_address}`)

  } catch (error) {
    console.error('Cashback processing error:', error)
    // Don't fail the transaction if cashback fails
  }
}