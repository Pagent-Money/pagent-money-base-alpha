#!/usr/bin/env node

/**
 * Simple SIWE Authentication Test Script
 * Uses ES modules and can run directly
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

// Generate a test private key (DON'T USE IN PRODUCTION)
const TEST_PRIVATE_KEY = '0x' + Array(64).fill('0').join('').slice(0, -1) + '1';

async function runQuickTest(chainId) {
  console.log(`\n🧪 Testing SIWE Auth for Chain ${chainId}`);
  console.log('='.repeat(50));

  try {
    // Create test wallet
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
    console.log('👤 Test address:', wallet.address);

    // Create SIWE message
    const nonce = Math.random().toString(36).substring(2);
    const siweMessage = new SiweMessage({
      domain: 'localhost',
      address: wallet.address,
      statement: 'Sign in to Pagent Credits with your wallet.',
      uri: 'http://localhost:3000',
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const messageToSign = siweMessage.prepareMessage();
    console.log('📝 Message length:', messageToSign.length);
    console.log('🎲 Nonce:', nonce);

    // Sign message
    const signature = await wallet.signMessage(messageToSign);
    console.log('✍️ Signature length:', signature.length);

    // Test local verification
    console.log('\n🔍 Local verification...');
    try {
      const localResult = await siweMessage.verify({ signature });
      console.log('✅ Local SIWE result:', localResult);
    } catch (localError) {
      console.log('❌ Local SIWE error:', localError.message);
    }

    // Test manual verification
    console.log('\n🔧 Manual verification...');
    try {
      const recovered = ethers.verifyMessage(messageToSign, signature);
      const isValid = recovered.toLowerCase() === wallet.address.toLowerCase();
      console.log('✅ Manual result:', isValid);
      console.log('   Expected:', wallet.address);
      console.log('   Recovered:', recovered);
    } catch (manualError) {
      console.log('❌ Manual error:', manualError.message);
    }

    // Test edge function
    console.log('\n🌐 Edge function test...');
    const payload = {
      message: messageToSign,
      signature,
      timestamp: Date.now(),
      clientInfo: {
        userAgent: 'Test Script',
        platform: 'nodejs',
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

      console.log('📨 Status:', response.status);
      const result = await response.text();
      console.log('📨 Response:', result);

      if (response.status === 200) {
        console.log('✅ Edge function SUCCESS!');
      } else {
        console.log('❌ Edge function FAILED!');
      }
    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Quick SIWE Auth Test');
  console.log('=======================');
  
  // Test Sepolia first
  await runQuickTest(84532);
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test completed! Check results above.');
}

main().catch(console.error);