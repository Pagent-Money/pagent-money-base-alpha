import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * API endpoint for retrieving user receipts
 * 检索用户收据的 API 端点
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // For API testing, allow both JWT and API key authentication
    const authHeader = req.headers.get('authorization')
    const apikey = req.headers.get('apikey')
    
    // Use service role for backend operations, but validate request
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'GET') {
      return await handleGetReceipts(req, supabase)
    }

    return new Response('Method not allowed', { status: 405 })

  } catch (error) {
    console.error('Receipts API error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

/**
 * Handle getting user receipts with pagination and filtering
 * 处理获取用户收据，包括分页和过滤
 */
async function handleGetReceipts(req: Request, supabase: any) {
  const url = new URL(req.url)
  const smartAccount = url.searchParams.get('smart_account')
  const status = url.searchParams.get('status')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const merchant = url.searchParams.get('merchant')
  const fromDate = url.searchParams.get('from_date')
  const toDate = url.searchParams.get('to_date')

  if (!smartAccount) {
    return new Response(JSON.stringify({
      success: false,
      error: 'smart_account parameter required'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }

  // Find user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('smart_account', smartAccount)
    .single()

  if (userError) {
    return new Response(JSON.stringify({
      success: false,
      error: 'User not found'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404
    })
  }

  // Build query
  let query = supabase
    .from('receipts')
    .select(`
      id,
      auth_id,
      amount,
      merchant,
      chain_tx,
      status,
      created_at,
      updated_at,
      metadata
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply filters
  if (status) {
    query = query.eq('status', status)
  }

  if (merchant) {
    query = query.ilike('merchant', `%${merchant}%`)
  }

  if (fromDate) {
    query = query.gte('created_at', fromDate)
  }

  if (toDate) {
    query = query.lte('created_at', toDate)
  }

  const { data: receipts, error: receiptsError } = await query

  if (receiptsError) {
    console.error('Failed to get receipts:', receiptsError)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get receipts'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }

  // Get total count for pagination
  let countQuery = supabase
    .from('receipts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (status) {
    countQuery = countQuery.eq('status', status)
  }

  if (merchant) {
    countQuery = countQuery.ilike('merchant', `%${merchant}%`)
  }

  if (fromDate) {
    countQuery = countQuery.gte('created_at', fromDate)
  }

  if (toDate) {
    countQuery = countQuery.lte('created_at', toDate)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    console.error('Failed to get receipt count:', countError)
  }

  // Get summary statistics
  const { data: summary, error: summaryError } = await supabase
    .from('receipts')
    .select('status, amount')
    .eq('user_id', user.id)

  let summaryStats = {
    total_count: 0,
    total_amount: 0,
    completed_count: 0,
    completed_amount: 0,
    pending_count: 0,
    pending_amount: 0,
    failed_count: 0
  }

  if (!summaryError && summary) {
    summaryStats = summary.reduce((acc, receipt) => {
      acc.total_count++
      acc.total_amount += parseFloat(receipt.amount || '0')

      switch (receipt.status) {
        case 'completed':
          acc.completed_count++
          acc.completed_amount += parseFloat(receipt.amount || '0')
          break
        case 'pending':
          acc.pending_count++
          acc.pending_amount += parseFloat(receipt.amount || '0')
          break
        case 'failed':
          acc.failed_count++
          break
      }

      return acc
    }, summaryStats)
  }

  return new Response(JSON.stringify({
    success: true,
    receipts,
    pagination: {
      limit,
      offset,
      total: count || 0,
      has_more: (count || 0) > offset + limit
    },
    summary: summaryStats
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  })
}

/* global Deno */
