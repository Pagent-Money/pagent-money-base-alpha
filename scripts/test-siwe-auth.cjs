#!/usr/bin/env node

/**
 * Test script to verify SIWE authentication implementation
 */

const { SiweMessage } = require('siwe')
const { ethers } = require('ethers')
const fetch = require('node-fetch')

const SUPABASE_FUNCTIONS_URL = 'https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2Z1cGFoZmdna3Bmc3RheGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExMjk1NTQsImV4cCI6MjA0NjcwNTU1NH0.C9ZiPF0oZ9f5cHP8Jj2gu6iOuCQxKKhI3IC1z26yXDc'

function generateNonce() {
  const array = new Uint8Array(32)
  require('crypto').randomFillSync(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function testSiweAuthentication() {
  console.log('🧪 Testing SIWE Authentication Implementation\n')

  try {
    // Create a test wallet
    const wallet = ethers.Wallet.createRandom()
    const address = wallet.address
    console.log('📱 Test wallet address:', address)

    // Create SIWE message
    const nonce = generateNonce()
    const domain = 'localhost:3000'
    const chainId = 84532 // Base Sepolia
    
    const siweMessage = new SiweMessage({
      domain,
      address,
      statement: 'Sign in to Pagent Credits with your wallet.',
      uri: 'http://localhost:3000',
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    })

    const messageToSign = siweMessage.prepareMessage()
    
    console.log('\n📝 SIWE Message:')
    console.log('---')
    console.log(messageToSign)
    console.log('---')
    console.log('📏 Message length:', messageToSign.length)
    
    // Sign the message
    const signature = await wallet.signMessage(messageToSign)
    console.log('\n✍️ Signature:', signature.slice(0, 20) + '...')
    
    // Test local SIWE verification
    console.log('\n🔍 Local SIWE verification test...')
    try {
      const verificationResult = await siweMessage.verify({ signature })
      console.log('✅ Local SIWE verification successful!', verificationResult.success)
      console.log('   Data:', {
        address: verificationResult.data?.address,
        domain: verificationResult.data?.domain,
        chainId: verificationResult.data?.chainId
      })
    } catch (error) {
      console.log('❌ Local SIWE verification failed:', error.message)
      return
    }

    // Test with SIWE Edge Function
    console.log('\n📤 Testing with SIWE Edge Function...')
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/siwe-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: messageToSign,
        signature,
        timestamp: Date.now(),
        clientInfo: {
          userAgent: 'Node.js SIWE Test Script',
          platform: 'test',
          version: '1.0.0'
        }
      }),
    })

    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ SIWE Edge Function test successful!')
      console.log('🎫 JWT Token received:', result.token ? 'Yes' : 'No')
      console.log('👤 User created:', result.user ? 'Yes' : 'No')
      if (result.user) {
        console.log('   User ID:', result.user.id)
        console.log('   Address:', result.user.address)
        console.log('   Is new user:', result.user.isNewUser)
      }
    } else {
      console.log('❌ SIWE Edge Function test failed!')
      console.log('   Status:', response.status)
      console.log('   Error:', result.error)
      console.log('   Full response:', result)
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

// Run the test
testSiweAuthentication().then(() => {
  console.log('\n✨ SIWE test completed!')
  process.exit(0)
}).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
