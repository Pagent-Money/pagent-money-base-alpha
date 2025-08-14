#!/bin/bash

# =====================================================
# Environment Setup Script
# =====================================================
# This script helps set up the three-tier environment structure
# for secure deployment of Pagent Money

set -e  # Exit on error

echo "======================================================"
echo "🚀 Pagent Money Environment Setup"
echo "======================================================"
echo ""
echo "This script will help you set up the environment files"
echo "for all three tiers of the application:"
echo "  1. Frontend (Vercel deployment)"
echo "  2. Smart Contracts (deployment & verification)"
echo "  3. Supabase (edge functions & backend)"
echo ""

# Function to create env file from example
create_env_file() {
    local example_file=$1
    local env_file=$2
    local description=$3
    
    if [ -f "$env_file" ]; then
        echo "  ⚠️  $env_file already exists"
        read -p "     Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "     Skipping..."
            return
        fi
    fi
    
    if [ -f "$example_file" ]; then
        cp "$example_file" "$env_file"
        echo "  ✅ Created $env_file for $description"
    else
        echo "  ❌ Error: $example_file not found!"
        exit 1
    fi
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📁 Setting up environment files..."
echo ""

# 1. Frontend environment
echo "1️⃣  Frontend Configuration (.env.local)"
create_env_file ".env.example" ".env.local" "Frontend/Vercel"
echo ""

# 2. Contracts environment
echo "2️⃣  Smart Contracts Configuration (contracts/.env)"
create_env_file "contracts/.env.example" "contracts/.env" "Contract deployment"
echo ""

# 3. Supabase environment
echo "3️⃣  Supabase Configuration (supabase/.env)"
create_env_file "supabase/.env.example" "supabase/.env" "Edge functions & backend"
echo ""

echo "======================================================"
echo "📝 Next Steps:"
echo "======================================================"
echo ""
echo "1. Edit each .env file with your actual values:"
echo "   - .env.local            → Frontend configuration"
echo "   - contracts/.env        → Contract deployment keys"
echo "   - supabase/.env         → Backend services"
echo ""
echo "2. For mainnet deployment:"
echo "   - Set NEXT_PUBLIC_CHAIN_ENV=mainnet in .env.local"
echo "   - Deploy contracts to mainnet"
echo "   - Update contract addresses in all .env files"
echo ""
echo "3. For Vercel deployment:"
echo "   - Add variables from .env.local to Vercel dashboard"
echo "   - Do NOT upload .env files directly"
echo ""
echo "4. Security reminders:"
echo "   ⚠️  Never commit .env files to version control"
echo "   ⚠️  Keep private keys secure and rotate regularly"
echo "   ⚠️  Use different keys for development and production"
echo ""
echo "======================================================"
echo "📚 Documentation:"
echo "======================================================"
echo "- Environment structure: ENV_STRUCTURE.md"
echo "- Chain configuration: CHAIN_CONFIGURATION.md"
echo "- Deployment guide: DEPLOYMENT.md"
echo ""
echo "✅ Environment setup complete!"
echo ""

# Optional: Validate the setup
read -p "Would you like to validate the environment setup? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔍 Validating environment files..."
    echo ""
    
    # Check frontend env
    if [ -f ".env.local" ]; then
        echo "  ✅ Frontend: .env.local exists"
        # Check for critical variables
        if grep -q "NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL" .env.local; then
            echo "     ✓ Contains Supabase URL"
        else
            echo "     ⚠️  Missing Supabase URL"
        fi
    else
        echo "  ❌ Frontend: .env.local missing"
    fi
    
    # Check contracts env
    if [ -f "contracts/.env" ]; then
        echo "  ✅ Contracts: contracts/.env exists"
        # Check for critical variables
        if grep -q "PRIVATE_KEY" contracts/.env; then
            echo "     ✓ Contains deployment key"
        else
            echo "     ⚠️  Missing deployment key"
        fi
    else
        echo "  ❌ Contracts: contracts/.env missing"
    fi
    
    # Check supabase env
    if [ -f "supabase/.env" ]; then
        echo "  ✅ Supabase: supabase/.env exists"
        # Check for critical variables
        if grep -q "SUPABASE_SERVICE_ROLE_KEY" supabase/.env; then
            echo "     ✓ Contains service role key"
        else
            echo "     ⚠️  Missing service role key"
        fi
    else
        echo "  ❌ Supabase: supabase/.env missing"
    fi
    
    echo ""
    echo "🎉 Validation complete!"
fi

echo ""
echo "Run 'npm run dev' to start development server"
echo ""