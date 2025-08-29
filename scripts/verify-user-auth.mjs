#!/usr/bin/env node

/**
 * Script to verify user authentication records in Supabase
 * Usage: node scripts/verify-user-auth.mjs [wallet_address]
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyUserAuth(walletAddress) {
  console.log('🔍 Checking authentication records...\n')
  
  try {
    // Check users table
    console.log('📊 Querying users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .ilike('smart_account', walletAddress ? `%${walletAddress.toLowerCase()}%` : '%')
      .order('created_at', { ascending: false })
      .limit(10)

    if (usersError) {
      console.error('❌ Error querying users:', usersError.message)
      return
    }

    if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} user record(s):`)
      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Wallet Address: ${user.smart_account}`)
        console.log(`   Card ID: ${user.card_id || 'Not issued'}`)
        console.log(`   Active: ${user.is_active}`)
        console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
        console.log(`   Updated: ${new Date(user.updated_at).toLocaleString()}`)
        
        if (user.metadata && Object.keys(user.metadata).length > 0) {
          console.log(`   Metadata:`)
          if (user.metadata.lastLoginAt) {
            console.log(`     Last Login: ${new Date(user.metadata.lastLoginAt).toLocaleString()}`)
          }
          if (user.metadata.chainId) {
            console.log(`     Chain ID: ${user.metadata.chainId}`)
          }
          if (user.metadata.clientInfo) {
            console.log(`     Platform: ${user.metadata.clientInfo.platform || 'Unknown'}`)
          }
        }
      })
    } else {
      console.log('❌ No user records found')
      if (walletAddress) {
        console.log(`   Searched for wallet address containing: ${walletAddress}`)
      }
    }

    // Check waitlist table for comparison
    console.log('\n📧 Checking waitlist records...')
    const { data: waitlist, error: waitlistError } = await supabase
      .from('waitlist')
      .select('email, joined_at')
      .order('joined_at', { ascending: false })
      .limit(5)

    if (waitlistError) {
      console.log('⚠️ Could not query waitlist:', waitlistError.message)
    } else if (waitlist && waitlist.length > 0) {
      console.log(`✅ Found ${waitlist.length} recent waitlist entries:`)
      waitlist.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.email} (${new Date(entry.joined_at).toLocaleString()})`)
      })
    } else {
      console.log('   No waitlist entries found')
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

// Get wallet address from command line argument
const walletAddress = process.argv[2]

if (walletAddress) {
  console.log(`🔍 Searching for wallet address: ${walletAddress}\n`)
} else {
  console.log('🔍 Showing recent user authentication records\n')
}

verifyUserAuth(walletAddress)
