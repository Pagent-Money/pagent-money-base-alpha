#!/usr/bin/env node

/**
 * Coinbase Smart Wallet Authentication Test Script
 * Tests the enhanced SIWE authentication with better Coinbase support
 */

import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';

// Configuration
const EDGE_FUNCTION_URL = 'https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1/siwe-auth';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2Z1cGFoZmdna3Bmc3RheGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExMjk1NTQsImV4cCI6MjA0NjcwNTU1NH0.C9ZiPF0oZ9f5cHP8Jj2gu6iOuCQxKKhI3IC1z26yXDc';

// Test configurations
const TEST_CHAINS = [
  { id: 84532, name: 'Base Sepolia' },
  { id: 8453, name: 'Base Mainnet' }
];

// Coinbase Smart Wallet test address (replace with actual address when testing)
const COINBASE_SMART_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with your actual address

async function testCoinbaseAuthentication(chainId, testAddress = null) {
  console.log(`\n🧪 Testing Enhanced Coinbase SIWE Auth for Chain ${chainId}`);
  console.log('='.repeat(60));

  try {
    // Use provided test address or default
    const address = testAddress || COINBASE_SMART_WALLET_ADDRESS;
    console.log('🏦 Testing with address:', address);

    // Create SIWE message using same logic as frontend
    const nonce = Math.random().toString(36).substring(2);
    const domain = 'localhost'; // Match what frontend uses
    
    const siweMessage = new SiweMessage({
      domain,
      address,
      statement: 'Sign in to Pagent Credits with your wallet.',
      uri: 'http://localhost:3000',
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const messageToSign = siweMessage.prepareMessage();
    
    console.log('📝 SIWE Message Details:');
    console.log('  Domain:', siweMessage.domain);
    console.log('  Address:', siweMessage.address);
    console.log('  Chain ID:', siweMessage.chainId);
    console.log('  Nonce:', siweMessage.nonce);
    console.log('  Message length:', messageToSign.length);
    console.log('\n📋 Message to Sign:');
    console.log('---');
    console.log(messageToSign);
    console.log('---');

    // For manual testing, we'll show what should be signed
    console.log('\n⚠️  MANUAL TEST INSTRUCTIONS:');
    console.log('1. Copy the message above');
    console.log('2. Sign it with your Coinbase Smart Wallet');
    console.log('3. Replace the signature below and run the test');
    console.log('4. Or set SKIP_SIGNATURE_VERIFICATION=true in edge function env');

    // Placeholder signature (replace with actual signature for testing)
    const signature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b'; // Replace with actual

    console.log('\n🔧 Testing Edge Function with Skip Mode...');
    await testWithSkipMode(messageToSign, signature, chainId);
    
    console.log('\n🔒 Testing Edge Function with Real Verification...');
    await testWithRealVerification(messageToSign, signature, chainId);

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

async function testWithSkipMode(messageToSign, signature, chainId) {
  console.log('🚫 Testing with signature verification SKIPPED (for debugging)...');
  
  const payload = {
    message: messageToSign,
    signature,
    timestamp: Date.now(),
    clientInfo: {
      userAgent: 'Coinbase-Test-Script',
      platform: 'coinbase-smart-wallet',
      version: '1.0.0'
    }
  };

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        // Add skip header for debugging
        'X-Debug-Skip-Verification': 'true'
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Response Status:', response.status);
    const result = await response.text();
    console.log('📨 Response Body:', result);

    if (response.status === 200) {
      const data = JSON.parse(result);
      console.log('✅ Skip mode SUCCESS! User created/authenticated:', data.user?.id);
      console.log('👤 User details:', {
        id: data.user?.id,
        address: data.user?.address,
        isNewUser: data.user?.isNewUser
      });
    } else {
      console.log('❌ Skip mode FAILED!');
    }
  } catch (fetchError) {
    console.log('❌ Skip mode fetch error:', fetchError.message);
  }
}

async function testWithRealVerification(messageToSign, signature, chainId) {
  console.log('🔒 Testing with REAL signature verification...');
  
  const payload = {
    message: messageToSign,
    signature,
    timestamp: Date.now(),
    clientInfo: {
      userAgent: 'Coinbase-Test-Script',
      platform: 'coinbase-smart-wallet',
      version: '1.0.0'
    }
  };

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📨 Response Status:', response.status);
    const result = await response.text();
    console.log('📨 Response Body:', result);

    if (response.status === 200) {
      const data = JSON.parse(result);
      console.log('✅ Real verification SUCCESS!');
      console.log('👤 User details:', {
        id: data.user?.id,
        address: data.user?.address,
        isNewUser: data.user?.isNewUser
      });
    } else {
      console.log('❌ Real verification FAILED - this is expected with placeholder signature');
      try {
        const errorData = JSON.parse(result);
        console.log('🔍 Error details:', errorData);
      } catch (e) {
        console.log('🔍 Raw error:', result);
      }
    }
  } catch (fetchError) {
    console.log('❌ Real verification fetch error:', fetchError.message);
  }
}

async function main() {
  console.log('🚀 Coinbase Smart Wallet SIWE Authentication Test');
  console.log('==================================================');
  
  console.log('\n📋 Test Instructions:');
  console.log('1. This script tests the enhanced SIWE authentication');
  console.log('2. For real testing, replace COINBASE_SMART_WALLET_ADDRESS with your address');
  console.log('3. Copy the SIWE message and sign it with Coinbase wallet');
  console.log('4. Replace the placeholder signature in the script');
  console.log('5. Or set SKIP_SIGNATURE_VERIFICATION=true in Supabase environment');
  
  // Test Base Sepolia first
  await testCoinbaseAuthentication(84532);
  
  console.log('\n' + '='.repeat(70));
  console.log('✨ Test completed! Check results above.');
  console.log('📖 Next steps:');
  console.log('   1. Try with your actual Coinbase Smart Wallet address');
  console.log('   2. Sign the message with Coinbase wallet extension');
  console.log('   3. Use the real signature in this test');
  console.log('   4. Check if users are created in Supabase');
}

main().catch(console.error);
