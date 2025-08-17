#!/bin/bash

# Deploy Credit Assignment Edge Functions
# This script deploys the new admin-credits and process-recurring-credits functions

set -e

echo "🚀 Deploying Credit Assignment Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "📋 Checking project status..."
supabase status

echo ""
echo "🔧 Deploying admin-credits function..."
supabase functions deploy admin-credits --project-ref rpsfupahfggkpfstaxfx

echo ""
echo "🔧 Deploying process-recurring-credits function..."
supabase functions deploy process-recurring-credits --project-ref rpsfupahfggkpfstaxfx

echo ""
echo "📊 Running database migrations..."
supabase db push --project-ref rpsfupahfggkpfstaxfx

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Function URLs:"
echo "   Admin Credits: https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1/admin-credits"
echo "   Process Recurring: https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1/process-recurring-credits"
echo ""
echo "💡 Next steps:"
echo "   1. Test the functions with proper authentication"
echo "   2. Set up a cron job for process-recurring-credits"
echo "   3. Configure admin authentication for admin-credits"
echo ""
echo "🧪 To test the functions, run:"
echo "   node scripts/test-credits-assignment.mjs"
