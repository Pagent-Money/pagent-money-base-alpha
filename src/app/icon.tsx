import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = { width: 256, height: 256 }
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  // Render the provided P-logo on the fly using an img tag
  return new ImageResponse(
    (
      <img
        src={new URL('/pagentmoney_p_logo.png', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').toString()}
        style={{ width: '100%', height: '100%' }}
      />
    ),
    { ...size }
  )
}
