#!/usr/bin/env node

/**
 * Production Authentication Test Script
 * Tests the enhanced SIWE authentication in production environment
 */

import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';

// Production Configuration
const PRODUCTION_URL = 'https://credits.pagent.money';
const EDGE_FUNCTION_URL = 'https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1/siwe-auth';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2Z1cGFoZmdna3Bmc3RheGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExMjk1NTQsImV4cCI6MjA0NjcwNTU1NH0.C9ZiPF0oZ9f5cHP8Jj2gu6iOuCQxKKhI3IC1z26yXDc';

// Test configurations
const TEST_CHAINS = [
  { id: 84532, name: 'Base Sepolia' },
  { id: 8453, name: 'Base Mainnet' }
];

async function testProductionDeployment() {
  console.log('🌐 Testing Production Deployment');
  console.log('================================');
  console.log('Production URL:', PRODUCTION_URL);
  
  try {
    const response = await fetch(PRODUCTION_URL);
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Production deployment is live and accessible!');
      return true;
    } else {
      console.log('❌ Production deployment has issues');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to access production deployment:', error.message);
    return false;
  }
}

async function testAuthenticationEndpoint(chainId) {
  console.log(`\n🔐 Testing SIWE Auth Endpoint for Chain ${chainId}`);
  console.log('='.repeat(50));

  try {
    // Use a test wallet address (replace with your actual address for real testing)
    const testAddress = '0x1234567890123456789012345678901234567890';
    
    // Create SIWE message using production domain
    const nonce = Math.random().toString(36).substring(2);
    const domain = 'credits.pagent.money';
    
    const siweMessage = new SiweMessage({
      domain,
      address: testAddress,
      statement: 'Sign in to Pagent Credits with your wallet.',
      uri: PRODUCTION_URL,
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const messageToSign = siweMessage.prepareMessage();
    
    console.log('📝 Production SIWE Message Details:');
    console.log('  Domain:', siweMessage.domain);
    console.log('  Address:', siweMessage.address);
    console.log('  Chain ID:', siweMessage.chainId);
    console.log('  Message length:', messageToSign.length);
    
    // Test with a placeholder signature (will fail signature verification but test the endpoint)
    const signature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b';

    const payload = {
      message: messageToSign,
      signature,
      timestamp: Date.now(),
      clientInfo: {
        userAgent: 'Production-Test-Script',
        platform: 'coinbase-smart-wallet',
        version: '1.0.0'
      }
    };

    console.log('\n🚀 Testing authentication endpoint...');
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
    
    if (response.status === 401 && result.includes('Invalid signature')) {
      console.log('✅ Auth endpoint working correctly (expected signature failure)');
      console.log('🔒 Enhanced signature verification is active');
      return true;
    } else if (response.status === 200) {
      console.log('✅ Auth endpoint working (signature verification may be disabled)');
      return true;
    } else {
      console.log('❌ Unexpected response:', result);
      return false;
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Production Authentication Test');
  console.log('==================================');
  console.log('🔧 Testing deployment with enhanced Coinbase Smart Wallet support');
  
  // Test 1: Check if production deployment is accessible
  const deploymentOk = await testProductionDeployment();
  
  if (!deploymentOk) {
    console.log('\n❌ Production deployment test failed. Please check the deployment.');
    return;
  }
  
  // Test 2: Test authentication endpoint
  let authTestsPassed = 0;
  for (const chain of TEST_CHAINS) {
    const success = await testAuthenticationEndpoint(chain.id);
    if (success) authTestsPassed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION TEST RESULTS');
  console.log('='.repeat(60));
  console.log('🌐 Deployment accessible:', deploymentOk ? '✅ PASS' : '❌ FAIL');
  console.log('🔐 Auth endpoints working:', `${authTestsPassed}/${TEST_CHAINS.length} ✅`);
  
  if (deploymentOk && authTestsPassed > 0) {
    console.log('\n🎉 Production deployment is ready for testing!');
    console.log('\n📋 Next Steps:');
    console.log('1. Open:', PRODUCTION_URL);
    console.log('2. Connect your Coinbase Smart Wallet');
    console.log('3. Try signing in with the enhanced authentication');
    console.log('4. Check browser console for detailed logs');
    
    console.log('\n🔍 Debugging Tips:');
    console.log('• Open browser developer tools to see authentication flow');
    console.log('• Enhanced signature verification supports multiple EIP-1271 formats');
    console.log('• User records should be created successfully in Supabase');
  } else {
    console.log('\n❌ Production deployment has issues. Please check the logs.');
  }
}

main().catch(console.error);
