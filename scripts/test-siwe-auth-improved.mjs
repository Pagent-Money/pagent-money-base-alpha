#!/usr/bin/env node

/**
 * Test script for improved SIWE authentication
 * Tests the new viem-based verification and RLS integration
 */

import { SiweMessage } from 'siwe'

// Configuration
const EDGE_FUNCTIONS_URL = 'https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2Z1cGFoZmdna3Bmc3RheGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Njk3NjEsImV4cCI6MjA0ODM0NTc2MX0.uqN0PFP4BfBWIWzCU5ltM7QLLrCbWCf5T8lJa4T8kNY'

// Test wallet addresses (these are example addresses for testing)
const TEST_ADDRESSES = [
  '0x1234567890123456789012345678901234567890', // EOA test address
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'  // Smart wallet test address
]

function generateNonce() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

function createTestSiweMessage(address, chainId = 8453) {
  const domain = 'localhost'
  const origin = `http://${domain}:3000`
  const nonce = generateNonce()
  
  return new SiweMessage({
    domain,
    address,
    statement: 'Sign in to Pagent Credits',
    uri: origin,
    version: '1',
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
  })
}

async function testSiweAuth(address, chainId = 8453) {
  console.log(`\n🧪 Testing SIWE Auth for ${address} on chain ${chainId}`)
  console.log('=' * 60)
  
  try {
    // Create SIWE message
    const siweMessage = createTestSiweMessage(address, chainId)
    const messageToSign = siweMessage.prepareMessage()
    
    console.log('📝 Created SIWE message:')
    console.log({
      domain: siweMessage.domain,
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      nonce: siweMessage.nonce.substring(0, 8) + '...',
      messageLength: messageToSign.length
    })
    
    // For testing, we'll create a mock signature
    // In real usage, this would come from the wallet
    const mockSignature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1c'
    
    console.log('✍️ Using mock signature for testing...')
    
    // Test the authentication endpoint
    const response = await fetch(`${EDGE_FUNCTIONS_URL}/siwe-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: messageToSign,
        signature: mockSignature,
        timestamp: Date.now(),
        clientInfo: {
          userAgent: 'Test Script',
          platform: 'test',
          version: '1.0.0'
        }
      }),
    })
    
    console.log(`📤 Response status: ${response.status}`)
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Authentication request successful!')
      console.log('📊 Response data:')
      console.log({
        success: result.success,
        hasToken: !!result.token,
        hasUser: !!result.user,
        userId: result.user?.id,
        userAddress: result.user?.address,
        isNewUser: result.user?.isNewUser
      })
      
      if (result.token) {
        console.log('🔑 JWT Token received (first 50 chars):', result.token.substring(0, 50) + '...')
        
        // Decode JWT to inspect payload
        try {
          const payload = JSON.parse(atob(result.token.split('.')[1]))
          console.log('🔍 JWT Payload:')
          console.log({
            sub: payload.sub,
            role: payload.role,
            wallet_address: payload.wallet_address,
            exp: new Date(payload.exp * 1000).toISOString()
          })
        } catch (e) {
          console.log('⚠️ Could not decode JWT payload')
        }
      }
    } else {
      console.log('❌ Authentication failed!')
      console.log('📊 Error response:')
      console.log(result)
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message)
  }
}

async function testRLSPolicies() {
  console.log('\n🔒 Testing RLS Policies')
  console.log('=' * 40)
  
  // Note: Full RLS testing would require actual authenticated sessions
  // This is a placeholder for documentation
  console.log('📋 RLS Policies to verify:')
  console.log('- Users can only view their own data')
  console.log('- Service role can access all data')
  console.log('- Policies enforce auth.uid() validation')
  console.log('\n💡 To fully test RLS:')
  console.log('1. Authenticate with a real wallet')
  console.log('2. Make database queries with the JWT token')
  console.log('3. Verify only user\'s own data is returned')
}

async function main() {
  console.log('🚀 Pagent SIWE Authentication Test Suite')
  console.log('Testing improved architecture with viem and RLS')
  console.log('=' * 60)
  
  // Test SIWE authentication with different addresses
  for (const address of TEST_ADDRESSES) {
    await testSiweAuth(address, 8453) // Base Mainnet
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
  }
  
  // Test RLS policies
  await testRLSPolicies()
  
  console.log('\n🎉 Test suite completed!')
  console.log('\n📝 Next steps:')
  console.log('1. Test with real wallet connection in browser')
  console.log('2. Verify RLS policies with authenticated requests')
  console.log('3. Test edge cases and error handling')
}

main().catch(console.error)
