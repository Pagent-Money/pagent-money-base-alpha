#!/bin/bash

# Production setup template
# Copy this file and replace with actual values from your environment

echo "🚀 Setting up production environment..."

# IMPORTANT: Replace these with actual values from your Supabase dashboard
# NEVER commit actual keys to git!

export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-from-supabase-dashboard"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-from-supabase-dashboard"

echo "⚠️  Remember to:"
echo "   1. Replace placeholder values with actual keys"
echo "   2. Keep this file secure and never commit it"
echo "   3. Use environment variables in production"
