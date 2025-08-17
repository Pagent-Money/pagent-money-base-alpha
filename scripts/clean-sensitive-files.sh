#!/bin/bash

# Script to clean up sensitive files before commit
echo "🧹 Cleaning up sensitive files..."

# Remove files with hardcoded keys/tokens from git tracking
echo "📝 Removing sensitive files from git tracking..."

# Test scripts with hardcoded keys
git rm --cached scripts/test-*auth*.js 2>/dev/null || true
git rm --cached scripts/test-*auth*.mjs 2>/dev/null || true  
git rm --cached scripts/test-*auth*.cjs 2>/dev/null || true
git rm --cached scripts/setup-production.sh 2>/dev/null || true
git rm --cached scripts/*-with-debug-logs.mjs 2>/dev/null || true
git rm --cached scripts/insert-sample-data-simple.mjs 2>/dev/null || true
git rm --cached scripts/create-sample-promos-data.mjs 2>/dev/null || true
git rm --cached scripts/test-new-allowance-api.mjs 2>/dev/null || true

# Debug HTML files
git rm --cached public/*debug*.html 2>/dev/null || true
git rm --cached public/*test*.html 2>/dev/null || true

# Documentation with sensitive info
git rm --cached *DEPLOYMENT*.md 2>/dev/null || true
git rm --cached *deployment*.md 2>/dev/null || true
git rm --cached SECURITY.md 2>/dev/null || true
git rm --cached *API_INTEGRATION*.md 2>/dev/null || true
git rm --cached *CREDIT_ASSIGNMENT*.md 2>/dev/null || true
git rm --cached *FRONTEND_INTEGRATION*.md 2>/dev/null || true
git rm --cached *NETWORK_DEBUGGING*.md 2>/dev/null || true
git rm --cached *PROMOS_INTEGRATION*.md 2>/dev/null || true
git rm --cached *_SUMMARY.md 2>/dev/null || true
git rm --cached *_REPORT.md 2>/dev/null || true
git rm --cached *_GUIDE.md 2>/dev/null || true

echo "✅ Sensitive files removed from git tracking"

# Create sanitized versions of important scripts
echo "🔧 Creating sanitized versions of important scripts..."

# Create a sanitized version of test script template
cat > scripts/test-auth-template.mjs << 'EOF'
#!/usr/bin/env node

/**
 * Template for testing authentication
 * Copy this file and add your actual keys from environment variables
 */

// Get keys from environment variables - NEVER hardcode them!
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here'

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your-anon-key-here') {
  console.error('❌ Please set SUPABASE_ANON_KEY environment variable')
  process.exit(1)
}

console.log('🔐 Testing authentication with environment variables...')
// Add your test code here
EOF

# Create sanitized production setup template
cat > scripts/setup-production-template.sh << 'EOF'
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
EOF

chmod +x scripts/test-auth-template.mjs
chmod +x scripts/setup-production-template.sh

echo "✅ Created sanitized template files"

# Update git to ignore the sensitive files
echo "📋 Updating git ignore status..."
git add .gitignore

echo "🎉 Cleanup completed!"
echo ""
echo "📋 Summary:"
echo "   ✅ Removed sensitive files from git tracking"
echo "   ✅ Updated .gitignore to prevent future commits"
echo "   ✅ Created sanitized template files"
echo ""
echo "⚠️  Next steps:"
echo "   1. Review remaining files for any hardcoded secrets"
echo "   2. Use environment variables for all sensitive data"
echo "   3. Run './scripts/security-check.sh' before each commit"
