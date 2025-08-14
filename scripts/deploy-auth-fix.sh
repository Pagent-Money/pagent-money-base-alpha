#!/bin/bash

# Deploy Authentication Fix for Coinbase Smart Wallet
# 部署 Coinbase 智能钱包认证修复

set -e

echo "🚀 Deploying Coinbase Smart Wallet Authentication Fix"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "supabase/functions/siwe-auth/index.ts" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first."
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Pre-deployment checks passed"

# Deploy the updated SIWE auth function
echo ""
echo "📦 Deploying enhanced SIWE authentication function..."
supabase functions deploy siwe-auth --project-ref rpsfupahfggkpfstaxfx

if [ $? -eq 0 ]; then
    echo "✅ SIWE auth function deployed successfully!"
else
    echo "❌ Failed to deploy SIWE auth function"
    exit 1
fi

echo ""
echo "🎉 Authentication fix deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Test authentication with Coinbase Smart Wallet"
echo "2. Check browser console for detailed logging"
echo "3. Monitor Supabase function logs for debugging"
echo "4. If issues persist, set SKIP_SIGNATURE_VERIFICATION=true for debugging"
echo ""
echo "🔧 For debugging, you can:"
echo "   • Run: node scripts/test-coinbase-auth.mjs"
echo "   • Check Supabase function logs in dashboard"
echo "   • Enable skip mode temporarily for testing user creation"
echo ""
echo "⚠️  Remember: Never leave SKIP_SIGNATURE_VERIFICATION=true in production!"
