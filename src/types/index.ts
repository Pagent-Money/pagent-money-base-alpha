// Core types for Pagent application
// Pagent 应用程序的核心类型

export interface User {
  id: string
  smart_account: string
  card_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface SpendPermission {
  id: string
  user_id: string
  token_address: string
  cap_amount: number
  period_seconds: number
  start_timestamp: string
  end_timestamp: string
  spender_address: string
  permission_signature: string
  status: 'active' | 'revoked' | 'expired'
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface Receipt {
  id: string
  user_id: string
  card_id?: string
  auth_id: string
  amount: number
  merchant: string
  chain_tx?: string
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface CreditSummary {
  id: string
  smart_account: string
  card_id?: string
  credit_limit?: number
  used_amount?: number
  remaining_amount?: number
  transaction_count?: number
  last_transaction_at?: string
  permission_expires_at?: string
}

export interface SpendPermissionData {
  token: string
  cap: number
  period: number
  start: number
  end: number
  spender: string
}

export interface CreatePermissionRequest {
  permission: SpendPermissionData
  signature: string
  smart_account: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    limit: number
    offset: number
    total: number
    has_more: boolean
  }
  summary?: any
}

// Mini-app specific types
// 小程序特定类型
export interface MiniAppContext {
  isInMiniApp: boolean
  theme: 'light' | 'dark'
  platform: 'ios' | 'android' | 'web'
}

// Constants
// 常量
export const USDC_ADDRESS_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const USDC_DECIMALS = 6

export const SPEND_PERMISSION_PERIODS = {
  DAILY: 24 * 60 * 60,
  WEEKLY: 7 * 24 * 60 * 60,
  MONTHLY: 30 * 24 * 60 * 60,
} as const

export const DEFAULT_CREDIT_LIMITS = [
  { label: '$50', value: 50 },
  { label: '$100', value: 100 },
  { label: '$250', value: 250 },
  { label: '$500', value: 500 },
  { label: '$1000', value: 1000 },
] as const

export const MERCHANT_CATEGORIES = [
  'Restaurants & Food',
  'Gas Stations',
  'Grocery Stores', 
  'Online Shopping',
  'Subscriptions',
  'Entertainment',
  'Travel',
  'Other'
] as const
