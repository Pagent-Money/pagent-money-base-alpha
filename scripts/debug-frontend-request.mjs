#!/usr/bin/env node

/**
 * Debug what the frontend is actually sending
 */

const SUPABASE_URL = 'https://rpsfupahfggkpfstaxfx.supabase.co'
const TOKEN = process.env.PAGENT_TOKEN

if (!TOKEN) {
  console.error('❌ Please set PAGENT_TOKEN environment variable')
  process.exit(1)
}

console.log('🔍 Debugging Frontend Request')
console.log('=============================')
console.log('')

// Test what happens when we send incomplete data (like the frontend might be doing)
async function testIncompleteRequest() {
  console.log('📊 Testing: Incomplete Request (simulating frontend issue)')
  console.log('--------------------------------------------------------')
  
  // Test with missing mode field
  const incompleteData = {
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    capAmount: 5000,
    periodSeconds: 2592000,
    spenderAddress: '0x0000000000000000000000000000000000000000',
    permissionSignature: '0xtest_signature'
    // Missing 'mode' field
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'PagentApp/1.0 (Coinbase-Wallet-Mini-App)',
      },
      body: JSON.stringify(incompleteData)
    })

    console.log('Status:', response.status)
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.status === 400) {
      console.log('✅ EXPECTED - Missing mode field correctly rejected')
    } else {
      console.log('❌ UNEXPECTED - Should have returned 400')
    }
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message)
  }
  
  console.log('')
}

// Test with empty body
async function testEmptyRequest() {
  console.log('📊 Testing: Empty Request')
  console.log('-------------------------')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({})
    })

    console.log('Status:', response.status)
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message)
  }
  
  console.log('')
}

// Test with null values
async function testNullValues() {
  console.log('📊 Testing: Null/Undefined Values')
  console.log('---------------------------------')
  
  const nullData = {
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    capAmount: 5000,
    periodSeconds: 2592000,
    spenderAddress: '0x0000000000000000000000000000000000000000',
    permissionSignature: null, // null value
    mode: undefined // undefined value
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(nullData)
    })

    console.log('Status:', response.status)
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message)
  }
  
  console.log('')
}

// Test correct format
async function testCorrectRequest() {
  console.log('📊 Testing: Correct Request Format')
  console.log('----------------------------------')
  
  const correctData = {
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    capAmount: 5000,
    periodSeconds: 2592000,
    spenderAddress: '0x0000000000000000000000000000000000000000',
    permissionSignature: '0xtest_signature_correct',
    mode: 'recurring'
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(correctData)
    })

    console.log('Status:', response.status)
    
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.status === 201) {
      console.log('✅ PASS - Correct format works')
    } else {
      console.log('❌ FAIL - Correct format failed')
    }
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message)
  }
  
  console.log('')
}

async function runDebugTests() {
  console.log('🎯 Running debug tests to identify frontend issue...')
  console.log('')
  
  await testEmptyRequest()
  await testIncompleteRequest()
  await testNullValues()
  await testCorrectRequest()
  
  console.log('🔧 Analysis:')
  console.log('- If empty/incomplete requests fail with 400, the API validation is working')
  console.log('- If correct request works, the issue is in frontend data construction')
  console.log('- Check browser network tab to see what the frontend is actually sending')
  console.log('- The frontend might be sending undefined/null values or missing fields')
}

runDebugTests().catch(console.error)
