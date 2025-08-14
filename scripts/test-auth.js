#!/usr/bin/env node

/**
 * Test script for Pagent authentication flow
 * Tests wallet signature verification and JWT generation
 */

import { ethers } from 'ethers';

const EDGE_FUNCTIONS_URL = 'https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2Z1cGFoZmdna3Bmc3RheGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExMjk1NTQsImV4cCI6MjA0NjcwNTU1NH0.C9ZiPF0oZ9f5cHP8Jj2gu6iOuCQxKKhI3IC1z26yXDc';

async function testAuthentication() {
  console.log('🧪 Testing Pagent Authentication Flow\n');

  try {
    // Step 1: Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${EDGE_FUNCTIONS_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData.status);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }

    // Step 2: Create a test wallet
    console.log('\n2️⃣ Creating test wallet...');
    const wallet = ethers.Wallet.createRandom();
    console.log('📱 Wallet address:', wallet.address);

    // Step 3: Create and sign authentication message
    console.log('\n3️⃣ Creating authentication message...');
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    const message = `Welcome to Pagent Credits! 🎉

Please sign this message to securely authenticate your wallet.

🔐 Wallet: ${wallet.address}
⏰ Time: ${new Date(timestamp).toLocaleString()}
🎲 Nonce: ${nonce}

✅ This signature is safe and will not trigger any blockchain transaction or cost gas.

By signing, you agree to our Terms of Service.`;

    console.log('📝 Message to sign:', message.substring(0, 100) + '...');

    // Step 4: Sign the message
    console.log('\n4️⃣ Signing message with wallet...');
    const signature = await wallet.signMessage(message);
    console.log('✍️ Signature:', signature.substring(0, 66) + '...');

    // Step 5: Authenticate with Edge Function
    console.log('\n5️⃣ Calling auth-public Edge Function...');
    const authResponse = await fetch(`${EDGE_FUNCTIONS_URL}/auth-public`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: wallet.address,
        message: message,
        signature: signature,
        timestamp: timestamp,
        clientInfo: {
          userAgent: 'TestScript/1.0',
          platform: 'node',
          version: '1.0.0'
        }
      })
    });

    const authData = await authResponse.json();
    
    if (authData.success) {
      console.log('✅ Authentication successful!');
      console.log('🎫 JWT Token:', authData.token ? authData.token.substring(0, 50) + '...' : 'N/A');
      console.log('👤 User ID:', authData.user?.id);
      console.log('🆕 Is new user:', authData.user?.isNewUser);
      
      // Step 6: Test authenticated endpoint
      if (authData.token) {
        console.log('\n6️⃣ Testing authenticated endpoint (cards)...');
        const cardsResponse = await fetch(`${EDGE_FUNCTIONS_URL}/cards`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          console.log('✅ Cards endpoint accessible');
          console.log('💳 Active cards:', cardsData.data?.activeCards || 0);
        } else {
          console.log('❌ Cards endpoint failed:', cardsResponse.status);
        }
      }
    } else {
      console.log('❌ Authentication failed:', authData.error);
    }

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAuthentication().catch(console.error);