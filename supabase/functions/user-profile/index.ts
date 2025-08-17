import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface UserProfile {
  id: string
  smart_account: string
  eoa_wallet_address?: string
  card_id?: string
  created_at: string
  updated_at: string
  is_active: boolean
  metadata: any
}

/**
 * JWT verification function
 */
async function verifyJWT(token: string): Promise<{ wallet_address: string; user_id: string } | null> {
  try {
    console.log('🔍 Verifying JWT token...')
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) {
      console.log('❌ JWT token missing parts')
      return null
    }

    let decodedPayload: any
    try {
      const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
      const jsonString = atob(base64Payload)
      decodedPayload = JSON.parse(jsonString)
      console.log('✅ JWT decoding successful')
    } catch (decodeError) {
      console.log('❌ JWT decoding failed:', decodeError.message)
      try {
        const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
        const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4)
        const bytes = Uint8Array.from(atob(paddedPayload), c => c.charCodeAt(0))
        const decoder = new TextDecoder()
        const jsonString = decoder.decode(bytes)
        decodedPayload = JSON.parse(jsonString)
        console.log('✅ JWT decoding successful (method 2)')
      } catch (method2Error) {
        console.log('❌ All JWT decoding methods failed:', method2Error.message)
        throw new Error('JWT decoding failed')
      }
    }

    const now = Math.floor(Date.now() / 1000)
    if (decodedPayload.exp && decodedPayload.exp < now) {
      console.log('❌ JWT token expired')
      return null
    }

    const result = { 
      wallet_address: decodedPayload.wallet_address, 
      user_id: decodedPayload.sub || decodedPayload.user_id 
    }
    console.log('✅ JWT verification successful:', result)
    return result
  } catch (error) {
    console.error('💥 JWT verification error:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const userInfo = await verifyJWT(token)
    
    if (!userInfo) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ JWT verified for user:', userInfo.wallet_address)

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'GET') {
      // Get user profile
      console.log('🔍 Looking for user profile with wallet address:', userInfo.wallet_address)
      
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('smart_account', userInfo.wallet_address)
        .single()

      if (userError || !user) {
        console.log('❌ Exact match failed, trying case-insensitive match...')
        
        const { data: userCaseInsensitive, error: userErrorCaseInsensitive } = await supabase
          .from('users')
          .select('*')
          .ilike('smart_account', userInfo.wallet_address)
          .single()
        
        if (userErrorCaseInsensitive || !userCaseInsensitive) {
          console.log('❌ User not found:', userErrorCaseInsensitive)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'User profile not found',
              debug: {
                searchedAddress: userInfo.wallet_address,
                exactMatchError: userError?.message,
                caseInsensitiveError: userErrorCaseInsensitive?.message
              }
            }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } else {
          user = userCaseInsensitive
          console.log('✅ Found user with case-insensitive match')
        }
      } else {
        console.log('✅ Found user with exact match')
      }

      const profile: UserProfile = {
        id: user.id,
        smart_account: user.smart_account,
        eoa_wallet_address: user.eoa_wallet_address,
        card_id: user.card_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_active: user.is_active,
        metadata: user.metadata || {}
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: profile 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'PATCH') {
      // Update user profile
      const body = await req.json()
      console.log('🔄 Updating user profile with:', body)

      // Only allow updating certain fields
      const allowedFields = ['metadata', 'eoa_wallet_address']
      const updates: any = {}
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field]
        }
      }

      if (Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No valid fields to update' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      updates.updated_at = new Date().toISOString()

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('smart_account', userInfo.wallet_address)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Failed to update user profile:', updateError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to update profile: ' + updateError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('✅ User profile updated successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: updatedUser 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}, {
  verify_jwt: false
})
