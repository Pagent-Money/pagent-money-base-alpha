#!/bin/bash

# Pre-commit security check for Pagent Money
# 预提交安全检查 Pagent Money

echo "🔍 Running pre-commit security checks..."

# Check for staged files with sensitive patterns
STAGED_FILES=$(git diff --cached --name-only)

# Check for environment files
if echo "$STAGED_FILES" | grep -E '\.(env|key|pem|p12|pfx)$'; then
    echo "❌ SECURITY ALERT: Attempting to commit sensitive files!"
    echo "   Remove these files from staging before committing:"
    echo "$STAGED_FILES" | grep -E '\.(env|key|pem|p12|pfx)$'
    echo ""
    echo "💡 Use: git reset HEAD <filename> to unstage"
    exit 1
fi

# Check for files with sensitive names
if echo "$STAGED_FILES" | grep -i -E "(secret|private|password|credential|token|apikey|api-key|api_key)"; then
    echo "⚠️  WARNING: Files with sensitive names detected:"
    echo "$STAGED_FILES" | grep -i -E "(secret|private|password|credential|token|apikey|api-key|api_key)"
    echo ""
    read -p "Are you sure these files don't contain secrets? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Commit aborted by user"
        exit 1
    fi
fi

# Check staged content for hardcoded secrets
TEMP_FILE=$(mktemp)
git diff --cached | grep -E '^\+' | grep -i -E "(api[_-]?key|secret|private[_-]?key|password|token).*[=:].*[a-zA-Z0-9]{20,}" > "$TEMP_FILE"

if [ -s "$TEMP_FILE" ]; then
    echo "❌ SECURITY ALERT: Potential hardcoded secrets detected!"
    echo "   The following lines contain potential secrets:"
    echo ""
    cat "$TEMP_FILE" | head -5
    echo ""
    echo "💡 Use environment variables instead of hardcoding secrets"
    rm "$TEMP_FILE"
    exit 1
fi

rm "$TEMP_FILE"

# Check for large files that might contain sensitive data
LARGE_FILES=$(git diff --cached --name-only | xargs -I {} sh -c 'if [ -f "{}" ] && [ $(wc -c < "{}") -gt 1048576 ]; then echo "{}"; fi')

if [ -n "$LARGE_FILES" ]; then
    echo "⚠️  WARNING: Large files detected (>1MB):"
    echo "$LARGE_FILES"
    echo ""
    echo "💡 Consider if these files contain sensitive data or should be in .gitignore"
    read -p "Continue with commit? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Commit aborted by user"
        exit 1
    fi
fi

# Check for common secret patterns in specific files
for file in $STAGED_FILES; do
    if [ -f "$file" ] && [[ "$file" =~ \.(js|ts|jsx|tsx|py|go|java|php|rb|sol)$ ]]; then
        # Check for potential private keys
        if grep -q -E "(BEGIN|END).*(PRIVATE|RSA)" "$file"; then
            echo "❌ SECURITY ALERT: Potential private key found in $file"
            exit 1
        fi
        
        # Check for long hex strings that might be private keys
        if grep -q -E "['\"][a-fA-F0-9]{64,}['\"]" "$file"; then
            echo "⚠️  WARNING: Long hex string found in $file - potential private key?"
            read -p "Is this a private key or secret? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "❌ Commit aborted - remove private key from $file"
                exit 1
            fi
        fi
    fi
done

echo "✅ Security checks passed!"
exit 0
