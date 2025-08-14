#!/bin/bash

# Setup script for Base Mainnet configuration
# This script helps configure the application to use Base mainnet instead of testnet

echo "🔧 Setting up Pagent Money for Base Mainnet..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from env.example..."
    cp env.example .env.local
else
    echo "✅ .env.local already exists"
fi

# Function to update or add environment variable
update_env() {
    local key=$1
    local value=$2
    local file=".env.local"
    
    if grep -q "^$key=" "$file"; then
        # Update existing key
        sed -i.bak "s|^$key=.*|$key=$value|" "$file"
    else
        # Add new key
        echo "$key=$value" >> "$file"
    fi
}

echo ""
echo "🌐 Configuring for Base Mainnet..."
echo ""

# Set chain environment to mainnet
update_env "NEXT_PUBLIC_CHAIN_ENV" "mainnet"

# Set single chain mode (optional - you can change this)
update_env "NEXT_PUBLIC_SINGLE_CHAIN_MODE" "false"

# Set RPC URLs
update_env "NEXT_PUBLIC_BASE_RPC_URL" "https://mainnet.base.org"
update_env "NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL" "https://sepolia.base.org"

# Set mainnet USDC address (official Base USDC)
update_env "NEXT_PUBLIC_USDC_ADDRESS_MAINNET" "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

echo ""
echo "⚠️  Important: You still need to configure the following manually in .env.local:"
echo ""
echo "1. NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL - Your Supabase Edge Functions URL"
echo "2. NEXT_PUBLIC_COINBASE_API_KEY - Your Coinbase API key (optional but recommended)"
echo "3. NEXT_PUBLIC_ETHERSCAN_API_KEY - Your Etherscan API key for transaction lookups"
echo "4. Contract addresses (if deployed):"
echo "   - NEXT_PUBLIC_SPENDER_ADDRESS_MAINNET"
echo "   - NEXT_PUBLIC_REGISTRY_ADDRESS_MAINNET"
echo ""
echo "📋 Configuration Summary:"
echo "   Chain: Base Mainnet (Chain ID: 8453)"
echo "   RPC URL: https://mainnet.base.org"
echo "   USDC Address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
echo "   Multi-chain support: Enabled (both mainnet and testnet)"
echo ""
echo "🚀 To start the application:"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "✅ Mainnet configuration complete!"