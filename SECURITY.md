# Security Guidelines | 安全指南

This document outlines security best practices for the Pagent Money project to prevent accidental exposure of sensitive information.

## 🔒 Git Security & .gitignore Review

### Environment Files
All environment files containing sensitive data are properly ignored:
- `.env.local`, `.env.production.local`, etc.
- Project-specific: `contracts/.env*`, `supabase/.env*`
- **Exception**: `.env.example` files with placeholder values only

### API Keys & Credentials
The following patterns are automatically ignored:
- Stripe keys: `sk_*`, `pk_*` (both test and live)
- AWS credentials: `.aws/`, `*.awscreds`
- Google Cloud: `*.gcp.json`, `service-account*.json`
- Blockchain keys: `*mnemonic*`, `*.privatekey`, `*.wallet`

### Smart Contract Security
- Private keys: All `*.key`, `*.pem`, `*.p12` files ignored
- Deployment secrets: `broadcast/` folder ignored
- Foundry artifacts: `out/`, `cache/` ignored

## 🛡️ Automated Security Checks

### Pre-commit Hook
Automatically runs security checks before each commit:
```bash
.git/hooks/pre-commit
```

### Manual Security Check
Run the security audit manually:
```bash
./scripts/security-check.sh
```

This script checks for:
- Hardcoded API keys (Stripe, AWS, Google)
- Private keys and mnemonics
- Tracked environment files
- Suspiciously large files

## 📋 Security Checklist

Before committing or deploying:

- [ ] No real API keys in source code
- [ ] All `.env*` files are in `.gitignore` (except `.env.example`)
- [ ] Private keys and mnemonics not committed
- [ ] Database URLs don't contain credentials
- [ ] Example files contain only placeholder values
- [ ] Large files reviewed for sensitive content

## 🚨 What NOT to Commit

### Never commit these file types:
- `.env`, `.env.local`, `.env.production`
- `*.key`, `*.pem`, `*.p12`, `*.pfx`
- `*secret*`, `*private*`, `*credential*`
- `wallet*.json`, `keystore/` folders
- `*mnemonic*`, `*seed*phrase*`

### Never commit these patterns:
- Stripe keys: `sk_test_*`, `sk_live_*`, `pk_*`
- Private keys: `0x` followed by 64 hex characters
- AWS keys: `AKIA*`
- Google API keys: `AIza*`

## 🔧 Environment Variables

### Safe to commit (in .env.example):
```env
NEXT_PUBLIC_APP_NAME=Pagent Money
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_APP_URL=https://example.com
```

### NEVER commit:
```env
PRIVATE_KEY=0x1234567890abcdef...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
STRIPE_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://user:password@host:port/db
```

## 🏗️ Development Best Practices

1. **Use Environment Variables**: Store all secrets in `.env.local`
2. **Example Files**: Keep `.env.example` with placeholder values
3. **Regular Audits**: Run `./scripts/security-check.sh` regularly
4. **Code Reviews**: Always review environment variable usage
5. **Mockup Mode**: Use `NEXT_PUBLIC_MOCKUP_WALLET=true` for testing

## 🆘 If Secrets Are Accidentally Committed

1. **Immediately rotate** the exposed secrets
2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch path/to/secret/file' \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** to overwrite history
4. **Notify team members** to pull the clean history

## 📞 Security Contact

For security issues or questions, contact the development team through secure channels.

---

**Remember**: Security is everyone's responsibility. When in doubt, don't commit it!