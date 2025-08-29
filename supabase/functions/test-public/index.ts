import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Simple test function to verify public access
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      }
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    console.log('🔍 Test function called with auth header:', authHeader ? 'Present' : 'Missing')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Public access test successful',
        authHeader: authHeader ? 'Present' : 'Missing',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
})