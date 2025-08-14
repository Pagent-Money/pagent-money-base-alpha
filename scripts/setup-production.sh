#!/bin/bash

# Setup production configuration for Pagent Money
echo "🚀 Setting up production configuration..."

cat > .env.local << 'EOF'
# Production Configuration for Pagent Money
NEXT_PUBLIC_APP_NAME=Pagent Money
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Production (pagent-base-alpha project)
NEXT_PUBLIC_SUPABASE_URL=https://rpsfupahfggkpfstaxfx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2Z1cGFoZmdna3Bmc3RheGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNDc5NTQsImV4cCI6MjA0NjYyMzk1NH0.6K3qr-YqQu_bz5VaY5q1p-4EGhj6YrXp8l0wqhjGpPs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwc2Z1cGFoZmdna3Bmc3RheGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTA0Nzk1NCwiZXhwIjoyMDQ2NjIzOTU0fQ.XGfBRz6_U3QFgQwgH4bAO1pLqzNmjP9VR5mHnI_DwpY

# Coinbase API (get from https://portal.cdp.coinbase.com/)
NEXT_PUBLIC_COINBASE_API_KEY=your-coinbase-api-key-here
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-wallet-connect-project-id

# Etherscan Multichain API (get from https://etherscan.io/apis)
NEXT_PUBLIC_ETHERSCAN_API_KEY=your-etherscan-api-key-here

# Base Sepolia (testnet) - good for testing
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Smart Contract addresses (will be populated after deployment)
NEXT_PUBLIC_SPENDER_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
EOF

echo "✅ Production configuration created in .env.local"
echo ""
echo "📝 Next steps:"
echo "1. Get your Coinbase API key from: https://portal.cdp.coinbase.com/"
echo "2. Get your Etherscan API key from: https://etherscan.io/apis"
echo "3. Update NEXT_PUBLIC_COINBASE_API_KEY in .env.local"
echo "4. Update NEXT_PUBLIC_ETHERSCAN_API_KEY in .env.local"
echo "5. Deploy smart contracts to Base Sepolia"
echo "6. Update contract addresses in .env.local"
echo "7. Run: npm run dev"
echo ""
echo "🎯 Your Supabase project is ready at: https://supabase.com/dashboard/project/rpsfupahfggkpfstaxfx"
