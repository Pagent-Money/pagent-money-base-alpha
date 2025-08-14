#!/bin/bash

# Deploy Supabase Edge Functions
# This script deploys all edge functions with the latest configuration

echo "======================================================"
echo "🚀 Deploying Supabase Edge Functions"
echo "======================================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root"
    exit 1
fi

cd supabase

echo "📦 Deploying Edge Functions..."
echo ""

# Deploy all functions
functions=(
    "siwe-auth"
    "transactions"
    "permissions"
    "cards"
    "credits"
    "receipts"
    "rewards"
    "card-webhook"
    "health"
)

for func in "${functions[@]}"; do
    echo "Deploying $func..."
    supabase functions deploy $func --no-verify-jwt
    if [ $? -eq 0 ]; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ Failed to deploy $func"
    fi
    echo ""
done

echo "======================================================"
echo "✅ Edge Functions Deployment Complete!"
echo "======================================================"
echo ""
echo "📝 Important Notes:"
echo "1. The siwe-auth function now supports both chains:"
echo "   - Base Mainnet (8453)"
echo "   - Base Sepolia (84532)"
echo ""
echo "2. Make sure your Supabase project has the correct env vars:"
echo "   - JWT_SECRET"
echo "   - Any other secrets needed"
echo ""
echo "3. Test the functions:"
echo "   - Health check: curl https://your-project.supabase.co/functions/v1/health"
echo ""

cd ..