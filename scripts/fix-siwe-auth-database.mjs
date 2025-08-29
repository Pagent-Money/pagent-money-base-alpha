#!/usr/bin/env node

/**
 * Fix SIWE Authentication Database Functions
 * 修复 SIWE 认证数据库函数
 * 
 * This script checks and fixes the missing upsert_siwe_user function
 * that's causing the authentication error.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rpsfupahfggkpfstaxfx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkDatabaseFunctions() {
  console.log('🔍 Checking database functions...')
  
  try {
    // Check if upsert_siwe_user function exists
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname, pronargs')
      .eq('proname', 'upsert_siwe_user')
    
    if (error) {
      console.error('❌ Error checking functions:', error)
      return false
    }
    
    console.log('📋 Found upsert_siwe_user functions:', data)
    
    if (!data || data.length === 0) {
      console.log('❌ upsert_siwe_user function not found in database')
      return false
    }
    
    // Check if we have the correct version (3 parameters)
    const correctFunction = data.find(func => func.pronargs === 3)
    if (!correctFunction) {
      console.log('⚠️ Found upsert_siwe_user but with wrong number of parameters')
      console.log('Expected: 3 parameters (account_address, user_metadata, eoa_address)')
      console.log('Found functions with parameters:', data.map(f => f.pronargs))
      return false
    }
    
    console.log('✅ Correct upsert_siwe_user function found')
    return true
    
  } catch (error) {
    console.error('💥 Error checking database functions:', error)
    return false
  }
}

async function testUpsertFunction() {
  console.log('🧪 Testing upsert_siwe_user function...')
  
  try {
    const testAddress = '0x1234567890123456789012345678901234567890'
    const testMetadata = {
      lastLoginAt: new Date().toISOString(),
      signupTimestamp: Date.now(),
      chainId: 8453,
      clientInfo: { test: true }
    }
    
    const { data, error } = await supabase
      .rpc('upsert_siwe_user', {
        account_address: testAddress,
        user_metadata: testMetadata,
        eoa_address: testAddress
      })
    
    if (error) {
      console.error('❌ Function test failed:', error)
      return false
    }
    
    console.log('✅ Function test successful:', data)
    
    // Clean up test data
    await supabase
      .from('users')
      .delete()
      .eq('smart_account', testAddress.toLowerCase())
    
    return true
    
  } catch (error) {
    console.error('💥 Error testing function:', error)
    return false
  }
}

async function createMissingFunction() {
  console.log('🔧 Creating missing upsert_siwe_user function...')
  
  const functionSQL = `
-- Function to create or update user for SIWE auth with EOA wallet support
CREATE OR REPLACE FUNCTION upsert_siwe_user(
  account_address TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb,
  eoa_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  smart_account TEXT,
  eoa_wallet_address TEXT,
  card_id TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  is_new_user BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_user_id UUID;
  result_record RECORD;
  is_new BOOLEAN := FALSE;
  final_eoa_address TEXT;
BEGIN
  -- Use account_address as fallback for eoa_address if not provided
  final_eoa_address := COALESCE(eoa_address, account_address);
  
  -- Check if user exists by smart account or EOA address
  SELECT u.id INTO existing_user_id
  FROM users u
  WHERE LOWER(u.smart_account) = LOWER(account_address)
     OR (final_eoa_address IS NOT NULL AND LOWER(u.eoa_wallet_address) = LOWER(final_eoa_address));

  IF existing_user_id IS NULL THEN
    -- Create new user
    INSERT INTO users (smart_account, eoa_wallet_address, is_active, metadata)
    VALUES (LOWER(account_address), LOWER(final_eoa_address), TRUE, user_metadata)
    RETURNING * INTO result_record;
    
    is_new := TRUE;
  ELSE
    -- Update existing user's last login and EOA address if provided
    UPDATE users 
    SET 
      updated_at = NOW(),
      metadata = COALESCE(metadata, '{}'::jsonb) || user_metadata,
      eoa_wallet_address = CASE 
        WHEN final_eoa_address IS NOT NULL THEN LOWER(final_eoa_address)
        ELSE eoa_wallet_address
      END
    WHERE id = existing_user_id
    RETURNING * INTO result_record;
  END IF;

  -- Return the user data
  RETURN QUERY
  SELECT 
    result_record.id as user_id,
    result_record.smart_account,
    result_record.eoa_wallet_address,
    result_record.card_id,
    result_record.is_active,
    result_record.created_at,
    is_new as is_new_user;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_siwe_user(TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_siwe_user(TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_siwe_user(TEXT, JSONB, TEXT) TO anon;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_smart_account_lower ON users (LOWER(smart_account));
CREATE INDEX IF NOT EXISTS idx_users_eoa_wallet_lower ON users (LOWER(eoa_wallet_address));

-- Add comment for documentation
COMMENT ON FUNCTION upsert_siwe_user(TEXT, JSONB, TEXT) IS 'Creates or updates user for SIWE authentication with EOA wallet address tracking, uses account_address as fallback for EOA if not provided';
`

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: functionSQL })
    
    if (error) {
      console.error('❌ Failed to create function:', error)
      return false
    }
    
    console.log('✅ Function created successfully')
    return true
    
  } catch (error) {
    console.error('💥 Error creating function:', error)
    return false
  }
}

async function ensureUsersTableHasEOAColumn() {
  console.log('🔍 Checking if users table has eoa_wallet_address column...')
  
  try {
    // Try to query the column - if it doesn't exist, this will fail
    const { error } = await supabase
      .from('users')
      .select('eoa_wallet_address')
      .limit(1)
    
    if (error && error.message.includes('column "eoa_wallet_address" does not exist')) {
      console.log('⚠️ eoa_wallet_address column missing, adding it...')
      
      const addColumnSQL = `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS eoa_wallet_address TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_users_eoa_wallet_address ON users (eoa_wallet_address);
      `
      
      const { error: addError } = await supabase.rpc('exec_sql', { sql: addColumnSQL })
      
      if (addError) {
        console.error('❌ Failed to add column:', addError)
        return false
      }
      
      console.log('✅ Added eoa_wallet_address column')
    } else if (error) {
      console.error('❌ Error checking column:', error)
      return false
    } else {
      console.log('✅ eoa_wallet_address column exists')
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Error checking table structure:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting SIWE Authentication Database Fix...')
  console.log('📍 Supabase URL:', SUPABASE_URL)
  
  try {
    // Step 1: Ensure users table has the required column
    const hasColumn = await ensureUsersTableHasEOAColumn()
    if (!hasColumn) {
      console.error('❌ Failed to ensure users table structure')
      process.exit(1)
    }
    
    // Step 2: Check if functions exist
    const functionsExist = await checkDatabaseFunctions()
    
    if (!functionsExist) {
      // Step 3: Create missing function
      const created = await createMissingFunction()
      if (!created) {
        console.error('❌ Failed to create missing function')
        process.exit(1)
      }
    }
    
    // Step 4: Test the function
    const testPassed = await testUpsertFunction()
    if (!testPassed) {
      console.error('❌ Function test failed')
      process.exit(1)
    }
    
    console.log('🎉 SIWE Authentication Database Fix Complete!')
    console.log('✅ All functions are now properly configured')
    console.log('🔄 You can now try signing in with your wallet again')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
main()
