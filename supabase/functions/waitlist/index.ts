import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WaitlistRequest {
  email: string
}

interface WaitlistEntry {
  id?: string
  email: string
  joined_at: string
  source?: string
  user_agent?: string
  ip_address?: string
}

/**
 * Waitlist Edge Function
 * Handles email collection for waitlist signup with validation and deduplication
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Use anon key for public access (works with proper RLS policies)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    if (req.method === 'POST') {
      // Parse request body
      const body: WaitlistRequest = await req.json()
      const { email } = body

      // Validate email
      if (!email || typeof email !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Normalize email (lowercase and trim)
      const normalizedEmail = email.toLowerCase().trim()

      // Get additional metadata
      const userAgent = req.headers.get('user-agent') || 'Unknown'
      const forwarded = req.headers.get('x-forwarded-for')
      const realIP = req.headers.get('x-real-ip')
      const ipAddress = forwarded?.split(',')[0] || realIP || 'Unknown'

      // Check if email already exists
      const { data: existingEntry, error: checkError } = await supabase
        .from('waitlist')
        .select('id, email, joined_at')
        .eq('email', normalizedEmail)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing email:', checkError)
        return new Response(
          JSON.stringify({ error: 'Database error occurred' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // If email already exists, return success (idempotent operation)
      if (existingEntry) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Already on waitlist',
            joined_at: existingEntry.joined_at
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create new waitlist entry
      const waitlistEntry: WaitlistEntry = {
        email: normalizedEmail,
        joined_at: new Date().toISOString(),
        source: 'website',
        user_agent: userAgent,
        ip_address: ipAddress
      }

      const { data, error: insertError } = await supabase
        .from('waitlist')
        .insert([waitlistEntry])
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting waitlist entry:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to join waitlist' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Log successful signup
      console.log(`New waitlist signup: ${normalizedEmail} from ${ipAddress}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Successfully joined waitlist',
          joined_at: data.joined_at
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle GET request to retrieve waitlist stats (optional)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact' })

      if (error) {
        console.error('Error getting waitlist count:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to get waitlist stats' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          count: data?.length || 0,
          message: 'Waitlist stats retrieved'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Waitlist function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
