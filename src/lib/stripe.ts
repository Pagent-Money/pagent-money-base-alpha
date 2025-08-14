import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export default stripe

/**
 * Create a payment intent for a Pagent Card transaction
 */
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  cardId,
  userAddress,
  merchantName,
  merchantCategory,
  description
}: {
  amount: number // Amount in cents
  currency?: string
  cardId: string
  userAddress: string
  merchantName?: string
  merchantCategory?: string
  description?: string
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: description || `Pagent Card Transaction - ${merchantName || 'Purchase'}`,
      metadata: {
        card_id: cardId,
        user_address: userAddress,
        merchant_name: merchantName || '',
        merchant_category: merchantCategory || 'general',
        source: 'pagent_card'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create a setup intent for saving payment methods
 */
export async function createSetupIntent(customerId?: string) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    }
  } catch (error) {
    console.error('Error creating setup intent:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer({
  userAddress,
  email,
  name
}: {
  userAddress: string
  email?: string
  name?: string
}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name: name || `Pagent User ${userAddress.slice(0, 8)}`,
      metadata: {
        user_address: userAddress,
        source: 'pagent'
      }
    })

    return {
      success: true,
      customerId: customer.id,
      customer
    }
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Process a refund for a transaction
 */
export async function processRefund({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer'
}: {
  paymentIntentId: string
  amount?: number // Partial refund amount in cents, omit for full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
}) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason
    })

    return {
      success: true,
      refund
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Retrieve payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      success: true,
      paymentIntent
    }
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * List all charges for a customer
 */
export async function getCustomerCharges(customerId: string, limit = 20) {
  try {
    const charges = await stripe.charges.list({
      customer: customerId,
      limit
    })

    return {
      success: true,
      charges: charges.data
    }
  } catch (error) {
    console.error('Error retrieving customer charges:', error)
    return {
      success: false,
      error: error.message
    }
  }
}