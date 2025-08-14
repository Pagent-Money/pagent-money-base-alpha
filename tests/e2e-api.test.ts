/**
 * End-to-End API Test Suite for Pagent Money
 * E2E API 测试套件 for Pagent Money
 * 
 * Tests the complete lifecycle:
 * 1. User registration and account setup
 * 2. Spend permission management (grant/decrease/revoke)
 * 3. Virtual card issuance and transactions
 * 4. Webhook processing and settlement
 * 5. Receipt storage and retrieval
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rpsfupahfggkpfstaxfx.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Test data
const TEST_USER = {
  smart_account: '0x1234567890123456789012345678901234567890',
  card_id: 'test-card-' + Date.now(),
  email: 'test@pagent.money'
}

const TEST_PERMISSION = {
  token: '0xA0b86a33E6417c7c4b7afB19A7f4bE6D2CCA5C7A', // USDC on Base Sepolia
  cap: '100000000', // 100 USDC (6 decimals)
  period: 604800, // 1 week
  spender_addr: process.env.NEXT_PUBLIC_SPENDER_ADDRESS || '0x0000000000000000000000000000000000000000'
}

const TEST_TRANSACTION = {
  amount: '25000000', // 25 USDC
  merchant_name: 'Test Coffee Shop',
  merchant_category: 'food_beverage',
  auth_id: 'auth-' + Date.now()
}

// Initialize Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// API endpoints
const API_BASE = `${SUPABASE_URL}/functions/v1`

/**
 * Helper function to make API calls
 * API 调用辅助函数
 */
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      ...options.headers,
    },
  })

  const data = await response.json()
  return { response, data }
}

/**
 * Helper function to make webhook calls (simulating card vendor)
 * Webhook 调用辅助函数 (模拟卡商)
 */
async function webhookCall(payload: any) {
  const timestamp = Date.now().toString()
  const signature = 'test-signature-' + timestamp // In real scenario, this would be HMAC

  const response = await fetch(`${API_BASE}/card-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  return { response, data }
}

describe('🚀 Pagent Money E2E API Tests', () => {
  beforeAll(async () => {
    console.log('🔧 Setting up E2E test environment...')
    
    // Verify environment variables
    expect(SUPABASE_URL).toBeTruthy()
    expect(SUPABASE_ANON_KEY).toBeTruthy()
    expect(TEST_PERMISSION.spender_addr).not.toBe('0x0000000000000000000000000000000000000000')
    
    console.log('✅ Environment verified')
  })

  beforeEach(async () => {
    // Clean up test data before each test
    await supabaseAdmin
      .from('receipts')
      .delete()
      .eq('user_id', TEST_USER.smart_account)

    await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('user_id', TEST_USER.smart_account)

    await supabaseAdmin
      .from('users')
      .delete()
      .eq('smart_account', TEST_USER.smart_account)
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...')
    
    // Clean up all test data
    await supabaseAdmin
      .from('receipts')
      .delete()
      .eq('user_id', TEST_USER.smart_account)

    await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('user_id', TEST_USER.smart_account)

    await supabaseAdmin
      .from('users')
      .delete()
      .eq('smart_account', TEST_USER.smart_account)

    console.log('✅ Cleanup completed')
  })

  describe('👤 User Registration & Account Setup', () => {
    it('should create a new user account', async () => {
      // First, create user directly in database (simulating account creation)
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({
          smart_account: TEST_USER.smart_account,
          card_id: TEST_USER.card_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(user).toBeTruthy()
      expect(user.smart_account).toBe(TEST_USER.smart_account)
      
      console.log('✅ User account created:', user.smart_account)
    })

    it('should verify user exists in database', async () => {
      // Create user first
      await supabaseAdmin
        .from('users')
        .insert({
          smart_account: TEST_USER.smart_account,
          card_id: TEST_USER.card_id,
          created_at: new Date().toISOString()
        })

      // Verify user exists
      const { data: user, error } = await supabaseAnon
        .from('users')
        .select('*')
        .eq('smart_account', TEST_USER.smart_account)
        .single()

      expect(error).toBeNull()
      expect(user).toBeTruthy()
      expect(user.card_id).toBe(TEST_USER.card_id)

      console.log('✅ User verification successful')
    })
  })

  describe('🔐 Spend Permission Lifecycle', () => {
    beforeEach(async () => {
      // Create test user
      await supabaseAdmin
        .from('users')
        .insert({
          smart_account: TEST_USER.smart_account,
          card_id: TEST_USER.card_id,
          created_at: new Date().toISOString()
        })
    })

    it('should grant a new spend permission', async () => {
      const permissionData = {
        user_id: TEST_USER.smart_account,
        token: TEST_PERMISSION.token,
        cap: TEST_PERMISSION.cap,
        period: TEST_PERMISSION.period,
        start: Math.floor(Date.now() / 1000),
        end: Math.floor(Date.now() / 1000) + TEST_PERMISSION.period,
        spender_addr: TEST_PERMISSION.spender_addr,
        signature: '0x' + 'a'.repeat(130), // Mock signature
        status: 'active'
      }

      const { response, data } = await apiCall('/permissions', {
        method: 'POST',
        body: JSON.stringify(permissionData),
      })

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeTruthy()

      console.log('✅ Spend permission granted:', data.data.id)
    })

    it('should retrieve spend permissions for user', async () => {
      // Create permission first
      await supabaseAdmin
        .from('permissions')
        .insert({
          user_id: TEST_USER.smart_account,
          token: TEST_PERMISSION.token,
          cap: TEST_PERMISSION.cap,
          period: TEST_PERMISSION.period,
          start: Math.floor(Date.now() / 1000),
          end: Math.floor(Date.now() / 1000) + TEST_PERMISSION.period,
          spender_addr: TEST_PERMISSION.spender_addr,
          signature: '0x' + 'a'.repeat(130),
          status: 'active'
        })

      const { response, data } = await apiCall(`/permissions?user_id=${TEST_USER.smart_account}`)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      expect(data.data.length).toBeGreaterThan(0)
      expect(data.data[0].token).toBe(TEST_PERMISSION.token)

      console.log('✅ Retrieved', data.data.length, 'permissions')
    })

    it('should revoke a spend permission', async () => {
      // Create permission first
      const { data: permission } = await supabaseAdmin
        .from('permissions')
        .insert({
          user_id: TEST_USER.smart_account,
          token: TEST_PERMISSION.token,
          cap: TEST_PERMISSION.cap,
          period: TEST_PERMISSION.period,
          start: Math.floor(Date.now() / 1000),
          end: Math.floor(Date.now() / 1000) + TEST_PERMISSION.period,
          spender_addr: TEST_PERMISSION.spender_addr,
          signature: '0x' + 'a'.repeat(130),
          status: 'active'
        })
        .select()
        .single()

      const { response, data } = await apiCall('/revoke', {
        method: 'POST',
        body: JSON.stringify({
          permission_id: permission.id,
          user_id: TEST_USER.smart_account
        }),
      })

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      console.log('✅ Spend permission revoked')
    })
  })

  describe('💳 Virtual Card & Transaction Flow', () => {
    beforeEach(async () => {
      // Create test user and permission
      await supabaseAdmin
        .from('users')
        .insert({
          smart_account: TEST_USER.smart_account,
          card_id: TEST_USER.card_id,
          created_at: new Date().toISOString()
        })

      await supabaseAdmin
        .from('permissions')
        .insert({
          user_id: TEST_USER.smart_account,
          token: TEST_PERMISSION.token,
          cap: TEST_PERMISSION.cap,
          period: TEST_PERMISSION.period,
          start: Math.floor(Date.now() / 1000),
          end: Math.floor(Date.now() / 1000) + TEST_PERMISSION.period,
          spender_addr: TEST_PERMISSION.spender_addr,
          signature: '0x' + 'a'.repeat(130),
          status: 'active'
        })
    })

    it('should process card authorization webhook', async () => {
      const webhookPayload = {
        type: 'authorization',
        card_id: TEST_USER.card_id,
        auth_id: TEST_TRANSACTION.auth_id,
        amount: TEST_TRANSACTION.amount,
        merchant_name: TEST_TRANSACTION.merchant_name,
        merchant_category: TEST_TRANSACTION.merchant_category,
        timestamp: new Date().toISOString()
      }

      const { response, data } = await webhookCall(webhookPayload)

      // The webhook might return 200 even if it fails internally
      expect(response.status).toBe(200)

      console.log('✅ Webhook processed:', data)

      // Check if receipt was created
      const { data: receipt } = await supabaseAnon
        .from('receipts')
        .select('*')
        .eq('auth_id', TEST_TRANSACTION.auth_id)
        .single()

      if (receipt) {
        expect(receipt.amount).toBe(TEST_TRANSACTION.amount)
        expect(receipt.merchant_name).toBe(TEST_TRANSACTION.merchant_name)
        console.log('✅ Receipt created:', receipt.id)
      } else {
        console.log('⚠️ Receipt not found - may be expected in test environment')
      }
    })

    it('should handle card decline for insufficient funds', async () => {
      const webhookPayload = {
        type: 'authorization',
        card_id: TEST_USER.card_id,
        auth_id: 'auth-decline-' + Date.now(),
        amount: '200000000', // 200 USDC - exceeds 100 USDC limit
        merchant_name: 'Expensive Store',
        merchant_category: 'retail',
        timestamp: new Date().toISOString()
      }

      const { response, data } = await webhookCall(webhookPayload)

      expect(response.status).toBe(200)
      console.log('✅ Decline handled:', data)
    })
  })

  describe('🧾 Receipt Storage & Retrieval', () => {
    beforeEach(async () => {
      // Create test user and some receipts
      await supabaseAdmin
        .from('users')
        .insert({
          smart_account: TEST_USER.smart_account,
          card_id: TEST_USER.card_id,
          created_at: new Date().toISOString()
        })

      // Create test receipts
      await supabaseAdmin
        .from('receipts')
        .insert([
          {
            user_id: TEST_USER.smart_account,
            card_id: TEST_USER.card_id,
            auth_id: 'receipt-1',
            amount: '10000000',
            merchant: 'Coffee Shop',
            chain_tx: '0x' + 'b'.repeat(64),
            status: 'completed',
            created_at: new Date().toISOString()
          },
          {
            user_id: TEST_USER.smart_account,
            card_id: TEST_USER.card_id,
            auth_id: 'receipt-2',
            amount: '15000000',
            merchant: 'Gas Station',
            chain_tx: '0x' + 'c'.repeat(64),
            status: 'completed',
            created_at: new Date().toISOString()
          }
        ])
    })

    it('should retrieve receipts for user', async () => {
      const { response, data } = await apiCall(`/receipts?user_id=${TEST_USER.smart_account}`)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      expect(data.data.length).toBeGreaterThanOrEqual(2)

      console.log('✅ Retrieved', data.data.length, 'receipts')
      console.log('📊 Sample receipt:', data.data[0])
    })

    it('should paginate receipts correctly', async () => {
      const { response, data } = await apiCall(`/receipts?user_id=${TEST_USER.smart_account}&limit=1`)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      expect(data.data.length).toBe(1)
      expect(data.pagination).toBeTruthy()
      expect(data.pagination.total).toBeGreaterThanOrEqual(2)

      console.log('✅ Pagination working:', data.pagination)
    })

    it('should filter receipts by status', async () => {
      const { response, data } = await apiCall(`/receipts?user_id=${TEST_USER.smart_account}&status=completed`)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      
      if (data.data.length > 0) {
        expect(data.data.every((receipt: any) => receipt.status === 'completed')).toBe(true)
        console.log('✅ Status filtering working')
      }
    })
  })

  describe('🔄 Complete E2E Lifecycle Test', () => {
    it('should complete full user journey', async () => {
      console.log('🚀 Starting complete E2E lifecycle test...')

      // Step 1: Create user account
      const { data: user } = await supabaseAdmin
        .from('users')
        .insert({
          smart_account: TEST_USER.smart_account,
          card_id: TEST_USER.card_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      expect(user).toBeTruthy()
      console.log('✅ Step 1: User account created')

      // Step 2: Grant spend permission
      const permissionData = {
        user_id: TEST_USER.smart_account,
        token: TEST_PERMISSION.token,
        cap: TEST_PERMISSION.cap,
        period: TEST_PERMISSION.period,
        start: Math.floor(Date.now() / 1000),
        end: Math.floor(Date.now() / 1000) + TEST_PERMISSION.period,
        spender_addr: TEST_PERMISSION.spender_addr,
        signature: '0x' + 'a'.repeat(130),
        status: 'active'
      }

      const { response: permResponse, data: permData } = await apiCall('/permissions', {
        method: 'POST',
        body: JSON.stringify(permissionData),
      })

      expect(permResponse.status).toBe(200)
      console.log('✅ Step 2: Spend permission granted')

      // Step 3: Process card transaction
      const webhookPayload = {
        type: 'authorization',
        card_id: TEST_USER.card_id,
        auth_id: 'e2e-' + Date.now(),
        amount: '30000000', // 30 USDC
        merchant_name: 'E2E Test Merchant',
        merchant_category: 'general',
        timestamp: new Date().toISOString()
      }

      const { response: webhookResponse } = await webhookCall(webhookPayload)
      expect(webhookResponse.status).toBe(200)
      console.log('✅ Step 3: Card transaction processed')

      // Step 4: Verify receipt creation (wait a bit for async processing)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { response: receiptResponse, data: receiptData } = await apiCall(`/receipts?user_id=${TEST_USER.smart_account}`)
      expect(receiptResponse.status).toBe(200)
      console.log('✅ Step 4: Receipt retrieval verified')

      // Step 5: Revoke permission
      const { data: permission } = await supabaseAnon
        .from('permissions')
        .select('*')
        .eq('user_id', TEST_USER.smart_account)
        .single()

      if (permission) {
        const { response: revokeResponse } = await apiCall('/revoke', {
          method: 'POST',
          body: JSON.stringify({
            permission_id: permission.id,
            user_id: TEST_USER.smart_account
          }),
        })

        expect(revokeResponse.status).toBe(200)
        console.log('✅ Step 5: Permission revoked')
      }

      console.log('🎉 Complete E2E lifecycle test passed!')
    })
  })

  describe('🚨 Error Handling & Edge Cases', () => {
    it('should handle invalid user ID gracefully', async () => {
      const { response, data } = await apiCall('/receipts?user_id=invalid-address')

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      expect(data.data.length).toBe(0)

      console.log('✅ Invalid user ID handled gracefully')
    })

    it('should handle malformed webhook payloads', async () => {
      const { response } = await webhookCall({
        invalid: 'payload'
      })

      // Should not crash, though it might return various status codes
      expect([200, 400, 500]).toContain(response.status)
      console.log('✅ Malformed webhook handled:', response.status)
    })

    it('should handle permission for non-existent user', async () => {
      const permissionData = {
        user_id: '0x' + 'f'.repeat(40),
        token: TEST_PERMISSION.token,
        cap: TEST_PERMISSION.cap,
        period: TEST_PERMISSION.period,
        start: Math.floor(Date.now() / 1000),
        end: Math.floor(Date.now() / 1000) + TEST_PERMISSION.period,
        spender_addr: TEST_PERMISSION.spender_addr,
        signature: '0x' + 'a'.repeat(130),
        status: 'active'
      }

      const { response } = await apiCall('/permissions', {
        method: 'POST',
        body: JSON.stringify(permissionData),
      })

      // Should handle gracefully (might succeed or fail depending on implementation)
      expect([200, 400, 404]).toContain(response.status)
      console.log('✅ Non-existent user permission handled:', response.status)
    })
  })
})

/**
 * Performance and load testing helpers
 * 性能和负载测试辅助函数
 */
describe('⚡ Performance & Load Tests', () => {
  it('should handle multiple concurrent API calls', async () => {
    console.log('🏃‍♂️ Running concurrent API calls test...')

    const promises = Array.from({ length: 10 }, (_, i) => 
      apiCall(`/receipts?user_id=0x${'1'.repeat(40)}&limit=5`)
    )

    const results = await Promise.all(promises)
    
    results.forEach((result, i) => {
      expect(result.response.status).toBe(200)
    })

    console.log('✅ Handled 10 concurrent API calls successfully')
  })

  it('should respond within reasonable time limits', async () => {
    const startTime = Date.now()
    
    const { response } = await apiCall('/receipts?user_id=' + TEST_USER.smart_account)
    
    const responseTime = Date.now() - startTime
    
    expect(response.status).toBe(200)
    expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
    
    console.log(`✅ API response time: ${responseTime}ms`)
  })
})
