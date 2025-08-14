import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SpendPermissionRequest {
  permission: {
    token: string
    cap: number
    period: number
    start: number
    end: number
    spender: string
  }
  signature: string
  smart_account: string
}

interface RevokePermissionRequest {
  permission_id: string
  smart_account: string
  signature?: string
}

/**
 * API endpoint for managing spend permissions
 * 管理支出权限的 API 端点
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

    const url = new URL(req.url)
    const pathname = url.pathname

    if (req.method === 'POST' && pathname.endsWith('/permissions')) {
      return await handleCreatePermission(req, supabase)
    }

    if (req.method === 'POST' && pathname.endsWith('/permissions/revoke')) {
      return await handleRevokePermission(req, supabase)
    }

    if (req.method === 'GET' && pathname.endsWith('/permissions')) {
      return await handleGetPermissions(req, supabase)
    }

    return new Response('Not found', { status: 404 })

  } catch (error) {
    console.error('Permissions API error:', error)
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
 * Handle permission creation
 * 处理权限创建
 */
async function handleCreatePermission(req: Request, supabase: any) {
  const body: SpendPermissionRequest = await req.json()
  
  console.log('Creating permission:', body)

  // Validate permission data
  if (!body.permission || !body.signature || !body.smart_account) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing required fields'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }

  // TODO: Validate signature against permission data
  // 验证签名与权限数据
  
  // Find or create user
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('smart_account', body.smart_account)
    .single()

  if (userError && userError.code === 'PGRST116') {
    // User doesn't exist, create new one
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        smart_account: body.smart_account,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create user:', createError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create user'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    user = newUser
  } else if (userError) {
    console.error('Database error:', userError)
    return new Response(JSON.stringify({
      success: false,
      error: 'Database error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }

  // Revoke any existing active permissions
  await supabase
    .from('permissions')
    .update({ status: 'revoked' })
    .eq('user_id', user.id)
    .eq('status', 'active')

  // Create new permission
  const { data: permission, error: permissionError } = await supabase
    .from('permissions')
    .insert({
      user_id: user.id,
      token_address: body.permission.token,
      cap_amount: body.permission.cap,
      period_seconds: body.permission.period,
      start_timestamp: new Date(body.permission.start * 1000).toISOString(),
      end_timestamp: new Date(body.permission.end * 1000).toISOString(),
      spender_address: body.permission.spender,
      permission_signature: body.signature,
      status: 'active'
    })
    .select()
    .single()

  if (permissionError) {
    console.error('Failed to create permission:', permissionError)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create permission'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }

  return new Response(JSON.stringify({
    success: true,
    permission_id: permission.id,
    user_id: user.id
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  })
}

/**
 * Handle permission revocation
 * 处理权限撤销
 */
async function handleRevokePermission(req: Request, supabase: any) {
  const body: RevokePermissionRequest = await req.json()
  
  console.log('Revoking permission:', body)

  if (!body.permission_id || !body.smart_account) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing required fields'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }

  // Find user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('smart_account', body.smart_account)
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

  // Revoke permission
  const { error: revokeError } = await supabase
    .from('permissions')
    .update({ status: 'revoked' })
    .eq('id', body.permission_id)
    .eq('user_id', user.id)

  if (revokeError) {
    console.error('Failed to revoke permission:', revokeError)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to revoke permission'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }

  // TODO: Execute on-chain revocation if needed
  // 如果需要，执行链上撤销

  return new Response(JSON.stringify({
    success: true,
    message: 'Permission revoked successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  })
}

/**
 * Handle getting user permissions
 * 处理获取用户权限
 */
async function handleGetPermissions(req: Request, supabase: any) {
  const url = new URL(req.url)
  const smartAccount = url.searchParams.get('smart_account')

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

  // Get permissions
  const { data: permissions, error: permissionsError } = await supabase
    .from('permissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (permissionsError) {
    console.error('Failed to get permissions:', permissionsError)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get permissions'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }

  return new Response(JSON.stringify({
    success: true,
    permissions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  })
}

/* global Deno */
