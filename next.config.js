/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const normalizedBasePath = rawBasePath
  ? (rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`)
  : ''

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"]
    }
  },

  
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  // Ensure client assets resolve under a subpath (e.g. GitHub Pages or reverse proxy)
  basePath: isProd ? normalizedBasePath : '',
  assetPrefix: isProd && normalizedBasePath ? `${normalizedBasePath}/` : '',
}

export default nextConfig
