#!/bin/bash

# Pre-commit hook to check for sensitive information
# This script should be linked to .git/hooks/pre-commit

echo "🔒 Running pre-commit security check..."

# Run the security check script
if [ -f "./scripts/security-check.sh" ]; then
    ./scripts/security-check.sh
    SECURITY_EXIT_CODE=$?
    
    if [ $SECURITY_EXIT_CODE -ne 0 ]; then
        echo ""
        echo "❌ COMMIT BLOCKED: Security issues detected!"
        echo ""
        echo "🛠️  To fix these issues:"
        echo "   1. Remove hardcoded secrets, keys, and tokens"
        echo "   2. Use environment variables instead"
        echo "   3. Add sensitive files to .gitignore"
        echo "   4. Run './scripts/clean-sensitive-files.sh' if needed"
        echo ""
        echo "🔧 To bypass this check (NOT RECOMMENDED):"
        echo "   git commit --no-verify"
        echo ""
        exit 1
    fi
else
    echo "⚠️  Security check script not found, skipping..."
fi

echo "✅ Pre-commit security check passed!"
exit 0