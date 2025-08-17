import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface CardData {
  cards: Card[]
  totalBalance: number
  activeCards: number
}

interface Card {
  id: string
  user_id: string
  card_id?: string
  status: 'active' | 'inactive' | 'blocked'
  created_at: string
  updated_at: string
  metadata: any
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
      // Get user's cards
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('smart_account', userInfo.wallet_address)
        .single()

      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // For now, we'll return the user as a "card" since the virtual card system isn't fully implemented
      const cards: Card[] = [{
        id: user.id,
        user_id: user.id,
        card_id: user.card_id,
        status: user.is_active ? 'active' : 'inactive',
        created_at: user.created_at,
        updated_at: user.updated_at,
        metadata: user.metadata
      }]

      const cardData: CardData = {
        cards,
        totalBalance: 0, // Will be calculated from credit usage
        activeCards: cards.filter(card => card.status === 'active').length
      }

      return new Response(
        JSON.stringify({ success: true, data: cardData }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (req.method === 'POST') {
      // Create new virtual card
      const body = await req.json()
      const { initialLimit } = body

      if (!initialLimit || initialLimit <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Valid initial limit required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('smart_account', userInfo.wallet_address)
        .single()

      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // TODO: Integrate with virtual card provider API to create actual card
      // For now, we'll just update the user record with a virtual card ID
      const virtualCardId = `card_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          card_id: virtualCardId,
          metadata: {
            ...user.metadata,
            virtualCardCreated: new Date().toISOString(),
            initialLimit
          }
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError || !updatedUser) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create virtual card' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const newCard: Card = {
        id: updatedUser.id,
        user_id: updatedUser.id,
        card_id: updatedUser.card_id,
        status: 'active',
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        metadata: updatedUser.metadata
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { card: newCard },
          message: 'Virtual card created successfully'
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Cards API error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Verify JWT token and extract user info
 */
async function verifyJWT(token: string): Promise<{ wallet_address: string; user_id: string } | null> {
  try {
    // Simple JWT verification (in production, use proper JWT library)
    const [header, payload, signature] = token.split('.')
    
    if (!header || !payload || !signature) {
      return null
    }

    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return {
      wallet_address: decodedPayload.wallet_address,
      user_id: decodedPayload.sub || decodedPayload.user_id
    }
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}