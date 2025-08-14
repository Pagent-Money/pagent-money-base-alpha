#!/usr/bin/env node

/**
 * SIWE Authentication Test Script
 * Tests the complete SIWE authentication lifecycle locally
 */

const { SiweMessage } = require('siwe');
const { ethers } = require('ethers');
const fetch = require('node-fetch');

// Configuration
const EDGE_FUNCTION_URL = 'https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1/siwe-auth';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2Z1cGFoZmdna3Bmc3RheGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExMjk1NTQsImV4cCI6MjA0NjcwNTU1NH0.C9ZiPF0oZ9f5cHP8Jj2gu6iOuCQxKKhI3IC1z26yXDc';

// Test wallet (DON'T USE IN PRODUCTION - this is for testing only)
const TEST_PRIVATE_KEY = '0x' + '0'.repeat(63) + '1'; // Dummy key for testing
const TEST_CHAINS = [
  { id: 8453, name: 'Base Mainnet', rpc: 'https://mainnet.base.org' },
  { id: 84532, name: 'Base Sepolia', rpc: 'https://sepolia.base.org' }
];

async function createTestWallet() {
  const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
  console.log('🧪 Test Wallet Address:', wallet.address);
  return wallet;
}

function generateNonce() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function createSiweMessage(address, chainId, nonce) {
  const domain = 'localhost';
  const uri = 'http://localhost:3000';
  
  const siweMessage = new SiweMessage({
    domain,
    address,
    statement: 'Sign in to Pagent Credits with your wallet.',
    uri,
    version: '1',
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
  });

  return siweMessage;
}

async function signMessage(wallet, message) {
  try {
    const signature = await wallet.signMessage(message);
    console.log('✍️ Message signed successfully');
    console.log('📏 Signature length:', signature.length);
    console.log('🔗 Signature:', signature.substring(0, 20) + '...');
    return signature;
  } catch (error) {
    console.error('❌ Failed to sign message:', error.message);
    throw error;
  }
}

async function testEdgeFunction(message, signature) {
  console.log('\n🌐 Testing Edge Function...');
  console.log('📤 Sending request to:', EDGE_FUNCTION_URL);
  
  const payload = {
    message,
    signature,
    timestamp: Date.now(),
    clientInfo: {
      userAgent: 'Test Script',
      platform: 'nodejs',
      version: '1.0.0'
    }
  };

  console.log('📦 Payload size:', JSON.stringify(payload).length, 'bytes');

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Response status:', response.status);
    console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📨 Raw response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError.message);
      return { success: false, error: 'Invalid JSON response', raw: responseText };
    }

    return { ...result, status: response.status };
  } catch (error) {
    console.error('❌ Edge function request failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSiweVerificationLocally(siweMessage, signature) {
  console.log('\n🔍 Testing Local SIWE Verification...');
  
  try {
    // Test with the same SIWE version as backend
    const verificationResult = await siweMessage.verify({ signature });
    console.log('✅ Local SIWE verification result:', verificationResult);
    return verificationResult;
  } catch (error) {
    console.error('❌ Local SIWE verification failed:', error.message);
    return false;
  }
}

async function testManualVerification(siweMessage, signature, wallet) {
  console.log('\n🔧 Testing Manual Verification...');
  
  try {
    const messageToVerify = siweMessage.prepareMessage();
    console.log('📝 Message to verify:');
    console.log('=====================================');
    console.log(messageToVerify);
    console.log('=====================================');
    
    const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);
    console.log('🔍 Expected address:', wallet.address);
    console.log('🔍 Recovered address:', recoveredAddress);
    
    const isValid = recoveredAddress.toLowerCase() === wallet.address.toLowerCase();
    console.log('✅ Manual verification result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('❌ Manual verification failed:', error.message);
    return false;
  }
}

async function runFullTest(chainId) {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 TESTING SIWE AUTH FOR CHAIN ${chainId}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Create test wallet
    console.log('\n1️⃣ Creating test wallet...');
    const wallet = await createTestWallet();

    // Step 2: Create SIWE message
    console.log('\n2️⃣ Creating SIWE message...');
    const nonce = generateNonce();
    console.log('🎲 Generated nonce:', nonce);
    
    const siweMessage = await createSiweMessage(wallet.address, chainId, nonce);
    const messageToSign = siweMessage.prepareMessage();
    
    console.log('📝 SIWE Message created:');
    console.log('  Domain:', siweMessage.domain);
    console.log('  Address:', siweMessage.address);
    console.log('  Chain ID:', siweMessage.chainId);
    console.log('  Nonce:', siweMessage.nonce);
    console.log('  Message length:', messageToSign.length);

    // Step 3: Sign the message
    console.log('\n3️⃣ Signing message...');
    const signature = await signMessage(wallet, messageToSign);

    // Step 4: Test local SIWE verification
    console.log('\n4️⃣ Testing local verification...');
    const localResult = await testSiweVerificationLocally(siweMessage, signature);
    
    // Step 5: Test manual verification
    console.log('\n5️⃣ Testing manual verification...');
    const manualResult = await testManualVerification(siweMessage, signature, wallet);

    // Step 6: Test edge function
    console.log('\n6️⃣ Testing edge function...');
    const edgeResult = await testEdgeFunction(messageToSign, signature);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log('Local SIWE verification:', localResult ? '✅ PASS' : '❌ FAIL');
    console.log('Manual verification:', manualResult ? '✅ PASS' : '❌ FAIL');
    console.log('Edge function test:', edgeResult.success ? '✅ PASS' : '❌ FAIL');
    
    if (!edgeResult.success) {
      console.log('Edge function error:', edgeResult.error);
      console.log('Response status:', edgeResult.status);
    }

    return {
      chainId,
      localVerification: localResult,
      manualVerification: manualResult,
      edgeFunction: edgeResult
    };

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    return {
      chainId,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Starting SIWE Authentication Test Suite');
  console.log('==========================================');
  
  const results = [];
  
  // Test both chains
  for (const chain of TEST_CHAINS) {
    console.log(`\n🔗 Testing ${chain.name} (${chain.id})`);
    const result = await runFullTest(chain.id);
    results.push(result);
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('🏁 FINAL TEST RESULTS');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ Chain ${result.chainId}: ERROR - ${result.error}`);
    } else {
      console.log(`📊 Chain ${result.chainId}:`);
      console.log(`   Local verification: ${result.localVerification ? '✅' : '❌'}`);
      console.log(`   Manual verification: ${result.manualVerification ? '✅' : '❌'}`);
      console.log(`   Edge function: ${result.edgeFunction.success ? '✅' : '❌'}`);
      if (!result.edgeFunction.success) {
        console.log(`   Error: ${result.edgeFunction.error}`);
      }
    }
  });

  console.log('\n✨ Test suite completed!');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}