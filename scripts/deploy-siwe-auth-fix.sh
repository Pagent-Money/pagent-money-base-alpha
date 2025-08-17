#!/bin/bash

# Deploy SIWE Auth Fix
# 部署 SIWE 认证修复

echo "🚀 Deploying SIWE Auth Fix..."
echo "=================================="

# Check if we have the necessary files
if [ ! -f "supabase/functions/siwe-auth/index.ts" ]; then
    echo "❌ SIWE Auth function file not found!"
    exit 1
fi

echo "📁 Found SIWE Auth function file"

# Try different deployment methods
echo ""
echo "🔧 Method 1: Direct Supabase CLI deployment..."

# Try with --no-verify-jwt flag
npx supabase functions deploy siwe-auth --no-verify-jwt 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
else
    echo "❌ CLI deployment failed"
    echo ""
    echo "🔧 Method 2: Manual deployment instructions..."
    echo ""
    echo "Please manually deploy the Edge Function:"
    echo "1. Go to https://supabase.com/dashboard/project/rpsfupahfggkpfstaxfx/functions"
    echo "2. Select the 'siwe-auth' function"
    echo "3. Click 'Edit Function'"
    echo "4. Replace the code with the updated version from:"
    echo "   supabase/functions/siwe-auth/index.ts"
    echo "5. Click 'Deploy'"
    echo ""
    echo "Or use the Supabase Dashboard's built-in editor to update the function."
fi

echo ""
echo "🧪 Testing deployment..."

# Test the deployment
node scripts/test-signature-verification.mjs

echo ""
echo "🏁 Deployment process complete!"
echo "If signature verification is still bypassed, please:"
echo "1. Check Supabase Dashboard > Edge Functions > siwe-auth > Environment Variables"
echo "2. Remove any SKIP_SIGNATURE_VERIFICATION variable"
echo "3. Redeploy manually through the dashboard"
