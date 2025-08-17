#!/bin/bash

# Security check script to scan for sensitive information before commit
# This script checks for common patterns of secrets, keys, and sensitive data

echo "🔒 Running security check for sensitive information..."

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Counter for issues found
ISSUES_FOUND=0

# Function to check for patterns in files
check_pattern() {
    local pattern="$1"
    local description="$2"
    local files="$3"
    
    echo "🔍 Checking for $description..."
    
    if [ -n "$files" ]; then
        result=$(echo "$files" | xargs grep -l "$pattern" 2>/dev/null || true)
        if [ -n "$result" ]; then
            echo -e "${RED}❌ Found $description in:${NC}"
            echo "$result" | while read -r file; do
                echo "   - $file"
                # Show the actual matches (first 3 lines)
                grep -n "$pattern" "$file" | head -3 | sed 's/^/     /'
            done
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            echo ""
        fi
    fi
}

# Get list of files to be committed (staged files) or all tracked files if none staged
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$STAGED_FILES" ]; then
    # If no staged files, check all tracked files
    FILES_TO_CHECK=$(git ls-files)
    echo "📋 Checking all tracked files (no staged changes found)"
else
    FILES_TO_CHECK="$STAGED_FILES"
    echo "📋 Checking staged files for commit"
fi

# Skip binary files and certain directories, and only check files that actually exist
FILES_TO_CHECK=$(echo "$FILES_TO_CHECK" | grep -v -E '\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf|zip|tar|gz)$' | grep -v -E '^(node_modules|\.git|\.next|out|dist|build)/' | while read -r file; do [ -f "$file" ] && echo "$file"; done)

echo "Files to check: $(echo "$FILES_TO_CHECK" | wc -l)"
echo ""

# Check for various sensitive patterns
check_pattern "sk_test_[a-zA-Z0-9]+" "Stripe test secret keys" "$FILES_TO_CHECK"
check_pattern "sk_live_[a-zA-Z0-9]+" "Stripe live secret keys" "$FILES_TO_CHECK"
check_pattern "pk_test_[a-zA-Z0-9]+" "Stripe test publishable keys" "$FILES_TO_CHECK"
check_pattern "pk_live_[a-zA-Z0-9]+" "Stripe live publishable keys" "$FILES_TO_CHECK"

# JWT tokens (but allow examples and documentation)
check_pattern "eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*" "JWT tokens" "$FILES_TO_CHECK"

# Supabase service role keys (actual keys, not env var references)
check_pattern "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*" "Supabase service role keys" "$FILES_TO_CHECK"

# Private keys
check_pattern "-----BEGIN PRIVATE KEY-----" "Private keys" "$FILES_TO_CHECK"
check_pattern "-----BEGIN RSA PRIVATE KEY-----" "RSA private keys" "$FILES_TO_CHECK"

# AWS credentials
check_pattern "AKIA[0-9A-Z]{16}" "AWS access keys" "$FILES_TO_CHECK"

# Long hex strings (potential private keys)
check_pattern "0x[a-fA-F0-9]{64}" "64-character hex strings (potential private keys)" "$FILES_TO_CHECK"

# Mnemonic phrases (12 or 24 words)
check_pattern "\b([a-z]+\s+){11}[a-z]+\b" "Potential 12-word mnemonic phrases" "$FILES_TO_CHECK"
check_pattern "\b([a-z]+\s+){23}[a-z]+\b" "Potential 24-word mnemonic phrases" "$FILES_TO_CHECK"

# Database URLs with credentials
check_pattern "postgresql://[^:]+:[^@]+@" "PostgreSQL URLs with credentials" "$FILES_TO_CHECK"
check_pattern "mongodb://[^:]+:[^@]+@" "MongoDB URLs with credentials" "$FILES_TO_CHECK"

# API keys in various formats
check_pattern "['\"]?[A-Za-z0-9_-]{32,}['\"]?\s*[:=]\s*['\"][A-Za-z0-9_-]{32,}['\"]" "Potential API keys" "$FILES_TO_CHECK"

# Check for hardcoded secrets in environment variable assignments
check_pattern "SECRET[_A-Z]*\s*=\s*['\"][^'\"]{10,}['\"]" "Hardcoded secrets" "$FILES_TO_CHECK"
check_pattern "PASSWORD[_A-Z]*\s*=\s*['\"][^'\"]{5,}['\"]" "Hardcoded passwords" "$FILES_TO_CHECK"
check_pattern "TOKEN[_A-Z]*\s*=\s*['\"][^'\"]{10,}['\"]" "Hardcoded tokens" "$FILES_TO_CHECK"

echo "🔍 Security check completed."

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No sensitive information detected!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES_FOUND potential security issues!${NC}"
    echo -e "${YELLOW}⚠️  Please review and remove sensitive information before committing.${NC}"
    echo ""
    echo "💡 Tips:"
    echo "   - Move secrets to environment variables"
    echo "   - Use .env files (which are gitignored)"
    echo "   - Remove hardcoded keys, tokens, and credentials"
    echo "   - Use placeholder values in example files"
    exit 1
fi