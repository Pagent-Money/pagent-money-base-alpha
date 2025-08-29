#!/usr/bin/env node

/**
 * Debug SIWE message parsing
 */

// Typical SIWE message format
const sampleMessage = `localhost wants you to sign in with your Ethereum account:
0x747A20C301B9D4e6Ec9fb0079EA1Ae66DAd38cb4

Test message

URI: http://localhost:3000
Version: 1
Chain ID: 8453
Nonce: abc123def456
Issued At: 2025-08-16T19:30:00.000Z`

console.log('🧪 Testing SIWE Message Parsing')
console.log('===============================')
console.log('Sample message:')
console.log(sampleMessage)
console.log('')

function parseSiweMessage(message) {
  try {
    const lines = message.split('\n')
    console.log('Lines:', lines.length)
    lines.forEach((line, i) => {
      console.log(`  ${i}: "${line}"`)
    })
    
    if (lines.length < 4) {
      return { success: false, error: 'Message too short' }
    }

    // Extract address from first line - more flexible pattern
    const firstLine = lines[0]
    console.log('First line:', firstLine)
    
    // Try multiple patterns
    let addressMatch = firstLine.match(/0x[a-fA-F0-9]{40}/)
    if (!addressMatch) {
      // Try looking in the second line
      const secondLine = lines[1] || ''
      console.log('Second line:', secondLine)
      addressMatch = secondLine.match(/0x[a-fA-F0-9]{40}/)
    }
    
    if (!addressMatch) {
      // Try looking in all lines
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/0x[a-fA-F0-9]{40}/)
        if (match) {
          addressMatch = match
          console.log(`Found address in line ${i}:`, match[0])
          break
        }
      }
    }
    
    if (!addressMatch) {
      return { success: false, error: 'No valid address found' }
    }

    const address = addressMatch[0]
    let domain = ''
    let chainId = 1
    let nonce = ''
    let issuedAt = ''

    // Parse other fields
    for (const line of lines) {
      if (line.startsWith('URI:')) {
        domain = line.replace('URI:', '').trim()
      } else if (line.startsWith('Chain ID:')) {
        chainId = parseInt(line.replace('Chain ID:', '').trim()) || 1
      } else if (line.startsWith('Nonce:')) {
        nonce = line.replace('Nonce:', '').trim()
      } else if (line.startsWith('Issued At:')) {
        issuedAt = line.replace('Issued At:', '').trim()
      }
    }

    return {
      success: true,
      data: {
        address,
        domain,
        chainId,
        nonce,
        issuedAt
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

const result = parseSiweMessage(sampleMessage)
console.log('\nParsing result:', result)

// Test with a real Coinbase Wallet message format
const coinbaseMessage = `localhost wants you to sign in with your Ethereum account:

0x747A20C301B9D4e6Ec9fb0079EA1Ae66DAd38cb4

URI: http://localhost:3000
Version: 1
Chain ID: 8453
Nonce: randomnonce123
Issued At: 2025-08-16T19:30:00.000Z`

console.log('\n🧪 Testing Coinbase Wallet Format')
console.log('==================================')
console.log('Coinbase message:')
console.log(coinbaseMessage)
console.log('')

const coinbaseResult = parseSiweMessage(coinbaseMessage)
console.log('Coinbase parsing result:', coinbaseResult)
