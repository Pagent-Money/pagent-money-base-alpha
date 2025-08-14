import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 256, height: 256 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6B53FF, #FEA611)',
          color: 'white',
          fontSize: 120,
          fontWeight: 800,
          fontFamily: 'Inter, system-ui, Arial',
        }}
      >
        P
      </div>
    ),
    { ...size }
  )
}


