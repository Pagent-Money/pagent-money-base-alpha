#!/bin/bash

# Security Check Script
# This script checks for potential secrets in the codebase before commits
# 安全检查脚本 - 在提交前检查代码库中的潜在机密信息

echo "🔍 Running security checks..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any issues found
issues_found=0

# Check for hardcoded secrets patterns
echo "📋 Checking for hardcoded secrets..."

# Stripe keys
stripe_keys=$(grep -r "sk_\|pk_" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ | grep -v "example\|demo\|test\|mock\|0x1234" | head -5)
if [ ! -z "$stripe_keys" ]; then
    echo -e "${RED}⚠️  Potential Stripe keys found:${NC}"
    echo "$stripe_keys"
    issues_found=$((issues_found + 1))
fi

# API keys
api_keys=$(grep -r "AKIA\|AIza" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ | head -5)
if [ ! -z "$api_keys" ]; then
    echo -e "${RED}⚠️  Potential API keys found:${NC}"
    echo "$api_keys"
    issues_found=$((issues_found + 1))
fi

# Private keys (excluding our mockup data)
private_keys=$(grep -r "0x[a-fA-F0-9]{64}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ | grep -v "0x1234567890123456789012345678901234567890" | head -5)
if [ ! -z "$private_keys" ]; then
    echo -e "${RED}⚠️  Potential private keys found:${NC}"
    echo "$private_keys"
    issues_found=$((issues_found + 1))
fi

# Check for .env files being tracked
echo "📋 Checking for tracked environment files..."
tracked_env=$(git ls-files | grep -E "\.env$|\.env\..*$" | grep -v "\.env\.example$")
if [ ! -z "$tracked_env" ]; then
    echo -e "${RED}⚠️  Environment files being tracked:${NC}"
    echo "$tracked_env"
    issues_found=$((issues_found + 1))
fi

# Check for common secret file patterns
echo "📋 Checking for secret files..."
secret_files=$(find . -name "*secret*" -o -name "*private*" -o -name "*.key" -o -name "*.pem" | grep -v node_modules | grep -v .git | head -10)
if [ ! -z "$secret_files" ]; then
    echo -e "${YELLOW}ℹ️  Files with secret-like names found (check if they should be in .gitignore):${NC}"
    echo "$secret_files"
fi

# Check for large files that might contain secrets
echo "📋 Checking for suspiciously large files..."
large_files=$(find . -size +1M -type f | grep -v node_modules | grep -v .git | grep -v .next | head -5)
if [ ! -z "$large_files" ]; then
    echo -e "${YELLOW}ℹ️  Large files found (review for sensitive content):${NC}"
    echo "$large_files"
fi

# Summary
echo "=================================="
if [ $issues_found -eq 0 ]; then
    echo -e "${GREEN}✅ No obvious security issues found!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $issues_found potential security issues. Please review before committing.${NC}"
    exit 1
fi
