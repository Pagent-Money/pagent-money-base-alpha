import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <img
        src={new URL('/pagentmoney_p_logo.png', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()}
        style={{ width: '100%', height: '100%', borderRadius: '22%' }}
      />
    ),
    { ...size }
  )
}
