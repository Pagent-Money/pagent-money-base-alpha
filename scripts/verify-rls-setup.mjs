#!/usr/bin/env node

/**
 * Script to verify RLS policies are properly set up
 * This connects to Supabase and checks policy configurations
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rpsfupahfggkpfstaxfx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.log('💡 Run: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkRLSStatus() {
  console.log('🔒 Checking RLS Status for Tables')
  console.log('=' * 40)
  
  const tables = [
    'users',
    'permissions', 
    'receipts',
    'credit_usage',
    'spend_permissions',
    'credit_transactions'
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', table)
        .eq('schemaname', 'public')
        .single()
      
      if (error) {
        console.log(`❌ ${table}: Error checking RLS status`)
        continue
      }
      
      if (data) {
        const hasRLS = data.rowsecurity
        console.log(`${hasRLS ? '✅' : '❌'} ${table}: RLS ${hasRLS ? 'ENABLED' : 'DISABLED'}`)
      } else {
        console.log(`⚠️ ${table}: Table not found`)
      }
    } catch (error) {
      console.log(`❌ ${table}: Failed to check RLS status`)
    }
  }
}

async function checkPolicies() {
  console.log('\n📋 Checking RLS Policies')
  console.log('=' * 30)
  
  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd, qual, with_check')
      .in('tablename', [
        'users',
        'permissions', 
        'receipts',
        'credit_usage',
        'spend_permissions',
        'credit_transactions'
      ])
      .order('tablename')
    
    if (error) {
      console.error('❌ Failed to fetch policies:', error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️ No RLS policies found')
      return
    }
    
    const policyCount = {}
    data.forEach(policy => {
      if (!policyCount[policy.tablename]) {
        policyCount[policy.tablename] = 0
      }
      policyCount[policy.tablename]++
    })
    
    console.log('📊 Policy count per table:')
    Object.entries(policyCount).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} policies`)
    })
    
    console.log('\n📝 Policy details:')
    data.forEach(policy => {
      console.log(`   ${policy.tablename}.${policy.policyname} (${policy.cmd})`)
    })
    
  } catch (error) {
    console.error('❌ Failed to check policies:', error.message)
  }
}

async function checkAuthFunctions() {
  console.log('\n🔧 Checking Auth Functions')
  console.log('=' * 30)
  
  try {
    // Check if our custom functions exist
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', ['upsert_siwe_user', 'get_user_by_smart_account', 'user_owns_address'])
    
    if (error) {
      console.error('❌ Failed to check functions:', error.message)
      return
    }
    
    const functions = ['upsert_siwe_user', 'get_user_by_smart_account', 'user_owns_address']
    const foundFunctions = data?.map(f => f.proname) || []
    
    functions.forEach(func => {
      const exists = foundFunctions.includes(func)
      console.log(`${exists ? '✅' : '❌'} ${func}: ${exists ? 'EXISTS' : 'NOT FOUND'}`)
    })
    
  } catch (error) {
    console.error('❌ Failed to check auth functions:', error.message)
  }
}

async function testBasicQueries() {
  console.log('\n🧪 Testing Basic Queries (Service Role)')
  console.log('=' * 45)
  
  try {
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, smart_account, created_at')
      .limit(5)
    
    if (usersError) {
      console.log('❌ Users query failed:', usersError.message)
    } else {
      console.log(`✅ Users table: Found ${users?.length || 0} records`)
    }
    
    // Test other tables
    const tables = ['permissions', 'receipts', 'spend_permissions']
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table} query failed:`, error.message)
      } else {
        console.log(`✅ ${table} table: Accessible (${data?.length || 0} records)`)
      }
    }
    
  } catch (error) {
    console.error('❌ Basic queries failed:', error.message)
  }
}

async function main() {
  console.log('🔍 Pagent RLS Verification Script')
  console.log('Checking database security configuration')
  console.log('=' * 50)
  
  await checkRLSStatus()
  await checkPolicies()
  await checkAuthFunctions()
  await testBasicQueries()
  
  console.log('\n🎉 RLS Verification Complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Test authentication with real wallet in browser')
  console.log('2. Verify user data isolation with JWT tokens')
  console.log('3. Monitor application logs for any RLS violations')
}

main().catch(console.error)
