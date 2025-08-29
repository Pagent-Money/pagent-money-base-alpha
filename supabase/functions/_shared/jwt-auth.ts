/**
 * Shared JWT verification utility for Edge Functions
 * 共享的JWT验证工具
 */

export interface JWTPayload {
  wallet_address: string
  user_id: string
  sub: string
  role: string
  exp: number
  iat: number
  iss: string
}

export interface UserInfo {
  wallet_address: string
  user_id: string
}

/**
 * Verify JWT token and extract user information
 */
export async function verifyJWT(token: string): Promise<UserInfo | null> {
  try {
    console.log('🔍 Verifying JWT token...')
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) {
      console.log('❌ JWT token missing parts')
      return null
    }

    let decodedPayload: JWTPayload
    try {
      // Method 1: Direct atob
      const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
      const jsonString = atob(base64Payload)
      decodedPayload = JSON.parse(jsonString)
      console.log('✅ Method 1 (atob) successful')
    } catch (method1Error) {
      console.log('❌ Method 1 (atob) failed:', method1Error.message)
      try {
        // Method 2: TextDecoder with padding
        const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
        const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4)
        const bytes = Uint8Array.from(atob(paddedPayload), c => c.charCodeAt(0))
        const decoder = new TextDecoder()
        const jsonString = decoder.decode(bytes)
        decodedPayload = JSON.parse(jsonString)
        console.log('✅ Method 2 (TextDecoder) successful')
      } catch (method2Error) {
        console.log('❌ Method 2 (TextDecoder) failed:', method2Error.message)
        throw new Error('All decoding methods failed')
      }
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (decodedPayload.exp && decodedPayload.exp < now) {
      console.log('❌ JWT token expired:', { 
        exp: decodedPayload.exp, 
        now: now, 
        expired: decodedPayload.exp < now 
      })
      return null
    }

    const result: UserInfo = { 
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

/**
 * Standard authentication middleware for Edge Functions
 */
export async function authenticateRequest(req: Request): Promise<{
  success: boolean
  userInfo?: UserInfo
  response?: Response
}> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing or invalid Authorization header. Bearer token required.' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  const token = authHeader.replace('Bearer ', '')
  const userInfo = await verifyJWT(token)
  
  if (!userInfo) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired token' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return {
    success: true,
    userInfo
  }
}
