# Environment Configuration Structure

## Overview

This project uses a three-tier environment configuration structure to maintain security and separation of concerns:

1. **`/contracts/.env`** - Smart contract deployment configuration
2. **`/supabase/.env`** - Backend edge functions and database configuration  
3. **`/.env.local`** - Frontend configuration for Vercel deployment

Each environment file serves a specific purpose and contains only the necessary secrets for its domain.

## Directory Structure

```
pagent-money-base-alpha/
├── .env.example              # Frontend configuration template
├── .env.local               # Frontend local development (git-ignored)
├── contracts/
│   ├── .env.example         # Contract deployment template
│   └── .env                 # Contract deployment secrets (git-ignored)
└── supabase/
    ├── .env.example         # Edge functions template
    └── .env                 # Edge functions secrets (git-ignored)
```

## Configuration Files

### 1. Frontend Configuration (`/.env.local`)

**Purpose:** Public-facing configuration for the Next.js application deployed on Vercel.

**Key Characteristics:**
- Only `NEXT_PUBLIC_*` variables are exposed to the browser
- No sensitive keys or secrets
- Configured via Vercel dashboard for production

**Essential Variables:**
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_CHAIN_ENV=mainnet
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://xxx.supabase.co/functions/v1
NEXT_PUBLIC_COINBASE_API_KEY=xxx
NEXT_PUBLIC_ETHERSCAN_API_KEY=xxx
NEXT_PUBLIC_SPENDER_ADDRESS_MAINNET=0x...
NEXT_PUBLIC_REGISTRY_ADDRESS_MAINNET=0x...
```

**Security Note:** Never include private keys, service role keys, or secret API keys here.

### 2. Contract Configuration (`/contracts/.env`)

**Purpose:** Deployment and management of smart contracts.

**Key Characteristics:**
- Contains deployment private keys
- Network RPC endpoints
- Contract verification keys
- Never committed to version control

**Essential Variables:**
```env
PRIVATE_KEY=xxx  # Deployment wallet private key
ETHERSCAN_API_KEY=xxx
BASE_MAINNET_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

**Security Note:** This file contains the most sensitive deployment credentials.

### 3. Supabase Configuration (`/supabase/.env`)

**Purpose:** Backend services, edge functions, and database configuration.

**Key Characteristics:**
- Service role keys for database access
- Payment processor secrets
- JWT secrets for authentication
- External service API keys

**Essential Variables:**
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=xxx
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_xxx
```

**Security Note:** Contains backend secrets that should never be exposed to the frontend.

## Deployment Workflows

### Local Development

1. Copy all `.env.example` files to create local `.env` files:
```bash
cp .env.example .env.local
cp contracts/.env.example contracts/.env
cp supabase/.env.example supabase/.env
```

2. Fill in the required values for your development environment

3. Start the development server:
```bash
npm run dev
```

### Contract Deployment

1. Configure `/contracts/.env` with deployment keys
2. Run deployment scripts:
```bash
cd contracts
forge script script/Deploy.s.sol --broadcast --verify
```
3. Copy deployed addresses to frontend `.env.local`

### Supabase Deployment

1. Configure `/supabase/.env` with production values
2. Deploy edge functions:
```bash
supabase functions deploy
```
3. Run database migrations:
```bash
supabase db push
```

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all `NEXT_PUBLIC_*` variables from `.env.example`
   - Set different values for Production/Preview/Development

2. Deploy:
```bash
vercel --prod
```

## Security Best Practices

### DO's
- ✅ Use `.env.example` files as templates
- ✅ Keep different secrets in different files
- ✅ Use environment-specific values (mainnet vs testnet)
- ✅ Rotate keys regularly
- ✅ Use Vercel's environment variables for production
- ✅ Use secure key management services for production

### DON'Ts
- ❌ Never commit `.env` files to version control
- ❌ Never put private keys in frontend configuration
- ❌ Never expose service role keys to the browser
- ❌ Never share production keys in documentation
- ❌ Never use the same keys across environments

## Environment Variable Reference

### Chain Selection
The application supports both Base Mainnet and Base Sepolia Testnet:

| Environment | Chain ID | RPC URL |
|------------|----------|---------|
| Mainnet | 8453 | https://mainnet.base.org |
| Testnet | 84532 | https://sepolia.base.org |

### Variable Naming Convention
- `NEXT_PUBLIC_*` - Frontend variables (exposed to browser)
- `*_SECRET_KEY` - Secret keys (never exposed)
- `*_MAINNET` - Mainnet-specific values
- `*_TESTNET` - Testnet-specific values

## Troubleshooting

### Common Issues

1. **"Missing environment variable" errors**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify `.env` files are in correct directories

2. **"Invalid API key" errors**
   - Verify keys are correctly copied (no extra spaces)
   - Check key permissions and scopes
   - Ensure using correct environment keys

3. **Contract address mismatches**
   - Verify deployed addresses match configuration
   - Check chain ID matches expected network
   - Ensure consistent mainnet/testnet configuration

### Validation Script

Run this script to validate your environment setup:

```bash
# Check frontend config
node -e "require('dotenv').config({path:'.env.local'}); console.log('Frontend OK')"

# Check contract config  
cd contracts && source .env && echo "Contracts OK"

# Check Supabase config
cd supabase && source .env && echo "Supabase OK"
```

## Migration Guide

### From Single .env to Multi-tier Structure

1. Backup existing `.env` file
2. Identify variables by category (frontend/contracts/backend)
3. Move variables to appropriate `.env` files
4. Update deployment scripts to use new paths
5. Test in development before production

### Updating Vercel Deployment

1. Go to Vercel Dashboard → Project Settings
2. Remove old environment variables
3. Add new variables from `/.env.example`
4. Trigger redeployment

## Support

For questions about environment configuration:
1. Check the `.env.example` files for documentation
2. Review this guide for best practices
3. Consult the deployment guides in `/DEPLOYMENT.md`