#!/usr/bin/env node

/**
 * Check and Fix Address Format
 * 检查和修复地址格式
 */

const testAddress = '0x747A4168DB1693B5b3b2441d71e7e6b1E1F8cb4'

console.log('🔍 Address Format Analysis:')
console.log('=' .repeat(50))
console.log('Original address:', testAddress)
console.log('Length:', testAddress.length)
console.log('Expected length: 42 (0x + 40 hex characters)')
console.log('Actual length:', testAddress.length)
console.log('Missing characters:', 42 - testAddress.length)

// Check if it's a valid hex string
const hexPart = testAddress.slice(2) // Remove 0x
console.log('')
console.log('Hex part:', hexPart)
console.log('Hex part length:', hexPart.length)
console.log('Expected hex length: 40')

// Try to pad with zeros if needed
const paddedAddress = testAddress.length < 42 
  ? '0x' + hexPart.padStart(40, '0')
  : testAddress

console.log('')
console.log('Suggested fix:')
console.log('Padded address:', paddedAddress)
console.log('Padded length:', paddedAddress.length)

// Test with SIWE
console.log('')
console.log('🧪 Testing SIWE message creation with corrected address...')

try {
  const { SiweMessage } = await import('siwe')
  
  const message = new SiweMessage({
    domain: 'localhost',
    address: paddedAddress, // Use the padded address
    statement: 'Sign in to Pagent Credits with your wallet.',
    uri: 'http://localhost:3000',
    version: '1',
    chainId: 8453,
    nonce: 'test-nonce-123',
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })
  
  const messageText = message.prepareMessage()
  console.log('✅ SIWE message created successfully!')
  console.log('')
  console.log('Generated message:')
  console.log('=====================================')
  console.log(messageText)
  console.log('=====================================')
  
} catch (error) {
  console.error('❌ SIWE message creation failed:', error.message)
}

console.log('')
console.log('🔧 Recommended fix:')
console.log('Update your wallet connection to use the properly formatted address:')
console.log(`"${paddedAddress}"`)
console.log('')
console.log('Or check if your wallet is returning the correct address format.')
