/**
 * E2E Test Setup for Pagent Money
 * E2E 测试设置 for Pagent Money
 */

import { beforeAll } from 'vitest'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

beforeAll(async () => {
  console.log('🔧 Setting up E2E test environment...')
  
  // Verify required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SPENDER_ADDRESS'
  ]
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    console.log('💡 Make sure to set these in your .env.local file')
    process.exit(1)
  }
  
  console.log('✅ Environment variables validated')
  console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('🔐 Spender Address:', process.env.NEXT_PUBLIC_SPENDER_ADDRESS)
})

// Global test configuration
export const TEST_CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  SPENDER_ADDRESS: process.env.NEXT_PUBLIC_SPENDER_ADDRESS!,
  TIMEOUT: 30000,
}
