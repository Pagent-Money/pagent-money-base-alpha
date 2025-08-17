#!/usr/bin/env node

/**
 * Manual database setup script for credit assignment tables
 * This script creates the necessary tables directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createCreditTables() {
  console.log('🚀 Creating credit assignment tables...');
  
  try {
    // Read the SQL file
    const sqlScript = readFileSync('scripts/create-credit-tables.sql', 'utf8');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute statements one by one
      console.log('🔄 Trying alternative approach...');
      await createTablesManually();
    } else {
      console.log('✅ Tables created successfully!');
      console.log('📊 Result:', data);
    }
    
  } catch (error) {
    console.error('❌ Error reading SQL file:', error);
    console.log('🔄 Creating tables manually...');
    await createTablesManually();
  }
}

async function createTablesManually() {
  console.log('📋 Creating tables manually...');
  
  // Create credit_assignments table
  console.log('🔧 Creating credit_assignments table...');
  const { error: creditAssignmentsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS credit_assignments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        credit_type VARCHAR(20) NOT NULL CHECK (credit_type IN ('recurring', 'topup', 'one-time')),
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });
  
  if (creditAssignmentsError) {
    console.error('❌ Error creating credit_assignments table:', creditAssignmentsError);
  } else {
    console.log('✅ credit_assignments table created');
  }
  
  // Create recurring_credit_configs table
  console.log('🔧 Creating recurring_credit_configs table...');
  const { error: recurringConfigsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS recurring_credit_configs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        period_seconds INTEGER NOT NULL CHECK (period_seconds > 0),
        next_assignment TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });
  
  if (recurringConfigsError) {
    console.error('❌ Error creating recurring_credit_configs table:', recurringConfigsError);
  } else {
    console.log('✅ recurring_credit_configs table created');
  }
  
  // Create indexes
  console.log('🔧 Creating indexes...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_credit_assignments_user_id ON credit_assignments(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_credit_assignments_status ON credit_assignments(status);',
    'CREATE INDEX IF NOT EXISTS idx_credit_assignments_credit_type ON credit_assignments(credit_type);',
    'CREATE INDEX IF NOT EXISTS idx_recurring_credit_configs_user_id ON recurring_credit_configs(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_recurring_credit_configs_status ON recurring_credit_configs(status);'
  ];
  
  for (const indexSql of indexes) {
    const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
    if (error) {
      console.error('⚠️ Error creating index:', error.message);
    }
  }
  
  console.log('✅ Indexes created');
  
  // Enable RLS
  console.log('🔧 Enabling Row Level Security...');
  const rlsCommands = [
    'ALTER TABLE credit_assignments ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE recurring_credit_configs ENABLE ROW LEVEL SECURITY;'
  ];
  
  for (const rlsSql of rlsCommands) {
    const { error } = await supabase.rpc('exec_sql', { sql: rlsSql });
    if (error) {
      console.error('⚠️ Error enabling RLS:', error.message);
    }
  }
  
  console.log('✅ Row Level Security enabled');
  console.log('🎉 Manual table creation completed!');
}

async function verifyTables() {
  console.log('🔍 Verifying table creation...');
  
  // Check if tables exist
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .in('table_name', ['credit_assignments', 'recurring_credit_configs']);
  
  if (error) {
    console.error('❌ Error checking tables:', error);
    return false;
  }
  
  const tableNames = tables.map(t => t.table_name);
  console.log('📊 Found tables:', tableNames);
  
  if (tableNames.includes('credit_assignments') && tableNames.includes('recurring_credit_configs')) {
    console.log('✅ All required tables exist!');
    return true;
  } else {
    console.log('❌ Some tables are missing');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Manual Database Setup for Credit Assignment System');
  console.log('=' .repeat(60));
  
  try {
    // Check if tables already exist
    const tablesExist = await verifyTables();
    
    if (!tablesExist) {
      await createCreditTables();
      await verifyTables();
    } else {
      console.log('ℹ️ Tables already exist, skipping creation');
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Test the APIs with proper authentication');
    console.log('2. Set up cron job for recurring credit processing');
    console.log('3. Configure admin authentication');
    
    console.log('\n🧪 To test the system:');
    console.log('   node scripts/test-credits-assignment.mjs');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
