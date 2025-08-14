#!/bin/bash

# Setup demo configuration for Pagent Money
echo "🎭 Setting up demo configuration..."

cat > .env.local << 'EOF'
# Quick Demo Configuration for Testing
NEXT_PUBLIC_APP_NAME=Pagent Money
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Demo Supabase (will use mock data)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=demo-anon-key
SUPABASE_SERVICE_ROLE_KEY=demo-service-key

# Demo Coinbase API (for wallet connection)
NEXT_PUBLIC_COINBASE_API_KEY=demo-coinbase-key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=demo-project-id

# Etherscan Multichain API (demo key for testing)
NEXT_PUBLIC_ETHERSCAN_API_KEY=demo

# Base Sepolia (testnet) for testing
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Demo contract addresses (will be populated after deployment)
NEXT_PUBLIC_SPENDER_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
EOF

echo "✅ Demo configuration created in .env.local"
echo "🚀 You can now run: npm run dev"
