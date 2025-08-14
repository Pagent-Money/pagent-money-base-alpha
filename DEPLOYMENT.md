# Pagent Money Deployment Guide

This guide covers deploying the complete Pagent Money stack to production.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │ Smart Contracts │
│                 │    │                 │    │                 │
│ • Next.js App   │    │ • Supabase      │    │ • Base Network  │
│ • Vercel        │◄──►│ • Edge Functions│◄──►│ • USDC Token    │
│ • Base Mini-App │    │ • PostgreSQL    │    │ • Spender       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Foundry](https://book.getfoundry.sh/) for smart contracts
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional)
- [Vercel CLI](https://vercel.com/cli) (optional)

## 🚀 Deployment Steps

### 1. Environment Setup

First, set up your environment variables:

```bash
# Copy the environment template
cp env.example .env.local

# Edit with your actual values
nano .env.local
```

Required environment variables:
```env
# Supabase (create at https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Coinbase (get from https://portal.cdp.coinbase.com/)
NEXT_PUBLIC_COINBASE_API_KEY=your-coinbase-api-key

# Base Network Configuration
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Will be populated after contract deployment
NEXT_PUBLIC_SPENDER_ADDRESS=
NEXT_PUBLIC_REGISTRY_ADDRESS=
```

### 2. Supabase Backend Deployment

#### Option A: New Supabase Project

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com/dashboard
   # Create new project
   # Note down your project URL and keys
   ```

2. **Deploy Database Schema**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref your-project-ref

   # Push database migrations
   supabase db push
   ```

3. **Deploy Edge Functions**
   ```bash
   # Deploy all functions
   supabase functions deploy card-webhook
   supabase functions deploy permissions  
   supabase functions deploy receipts

   # Set environment variables for functions
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

#### Option B: Local Supabase (Development)

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Deploy functions locally
supabase functions serve
```

### 3. Smart Contracts Deployment

#### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

#### Deploy to Base

1. **Setup Contract Environment**
   ```bash
   cd contracts
   cp env.example .env
   
   # Edit contracts/.env with:
   # PRIVATE_KEY=your-deployer-private-key (without 0x)
   # BASE_MAINNET_RPC_URL=https://mainnet.base.org
   # BASESCAN_API_KEY=your-basescan-key
   ```

2. **Deploy Contracts**
   ```bash
   # Compile contracts
   forge build

   # Run tests
   forge test

   # Deploy to Base Mainnet
   forge script script/Deploy.s.sol --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify

   # For testnet (Base Sepolia)
   forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
   ```

3. **Update Environment Variables**
   ```bash
   # Copy the deployed contract addresses to your .env.local
   NEXT_PUBLIC_SPENDER_ADDRESS=0x... # PagentSettlementSpender address
   NEXT_PUBLIC_REGISTRY_ADDRESS=0x... # CreditRegistry address
   ```

### 4. Frontend Deployment

#### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   # Build and deploy
   vercel

   # Set environment variables in Vercel dashboard
   # Or via CLI:
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add NEXT_PUBLIC_COINBASE_API_KEY
   # ... add all other environment variables

   # Deploy production
   vercel --prod
   ```

3. **Configure Domain (Optional)**
   ```bash
   # Add custom domain
   vercel domains add your-domain.com
   ```

#### Option B: Self-Hosted

```bash
# Build the application
npm run build

# Start production server
npm run start

# Or export static files
npm run build && npm run export
```

### 5. Base Mini-App Configuration

To deploy as a Base Mini-App:

1. **Update next.config.js**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: { unoptimized: true },
     assetPrefix: process.env.NODE_ENV === 'production' ? '/pagent-money/' : '',
     basePath: process.env.NODE_ENV === 'production' ? '/pagent-money' : '',
   }
   ```

2. **Build for Base App**
   ```bash
   npm run build
   ```

3. **Submit to Base**
   Follow the [Base Mini-App submission process](https://docs.base.org/base-app/)

## 🔧 Configuration

### Supabase Configuration

1. **RLS Policies**: Already configured in migrations
2. **API Settings**: Enable RLS for all tables
3. **Auth Settings**: Configure allowed origins
4. **Edge Function Secrets**:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
   ```

### Smart Contract Configuration

1. **Treasury Address**: Update in deploy script
2. **Authorized Spenders**: Configure backend wallet addresses
3. **USDC Token**: Verify correct USDC address for your network

### Frontend Configuration

1. **CORS Settings**: Update for your domain
2. **CDN Configuration**: For static assets
3. **Analytics**: Add tracking if needed

## 🌍 Environment-Specific Deployments

### Development
```bash
# Use Base Sepolia testnet
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x... # Sepolia USDC address

# Use local Supabase
npm run supabase:start
npm run dev
```

### Staging
```bash
# Use Base Sepolia with production Supabase
NEXT_PUBLIC_CHAIN_ID=84532
# Production Supabase URLs
# Deploy to staging.pagent.money
```

### Production
```bash
# Use Base Mainnet
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
# Production Supabase and contract addresses
# Deploy to pagent.money
```

## 🔐 Security Checklist

- [ ] All private keys secured and not in version control
- [ ] Environment variables properly set in production
- [ ] Supabase RLS policies tested and working
- [ ] Smart contracts verified on Basescan
- [ ] HTTPS enabled for all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled on API endpoints
- [ ] Database backups configured
- [ ] Error monitoring set up (Sentry, etc.)

## 📊 Monitoring & Analytics

### Set up monitoring for:

1. **Smart Contracts**
   - Transaction success rates
   - Gas usage patterns
   - Failed transactions

2. **Backend**
   - Webhook delivery success
   - Database performance
   - Edge function execution times

3. **Frontend**
   - User engagement metrics
   - Error rates
   - Performance metrics

### Recommended Tools:
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance monitoring
- **Supabase Dashboard**: Database monitoring
- **Basescan**: Contract monitoring

## 🚨 Troubleshooting

### Common Issues:

1. **Contract Deployment Fails**
   ```bash
   # Check gas prices and RPC URL
   # Verify private key has sufficient funds
   # Check network configuration
   ```

2. **Supabase Connection Issues**
   ```bash
   # Verify project URL and keys
   # Check RLS policies
   # Ensure database is accessible
   ```

3. **Frontend Build Errors**
   ```bash
   # Check environment variables
   # Clear Next.js cache: rm -rf .next
   # Verify all dependencies installed
   ```

## 📞 Support

If you encounter issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review logs in respective platforms (Vercel, Supabase, Basescan)
3. Open an issue on [GitHub](https://github.com/your-org/pagent-money-base-alpha/issues)
4. Join our [Discord](https://discord.gg/pagent) for community support

## 🎉 Post-Deployment

After successful deployment:

1. **Test the complete flow**:
   - Connect wallet
   - Create spend permission
   - Test demo transactions
   - Verify webhook processing

2. **Monitor initial usage**:
   - Check error logs
   - Monitor transaction success rates
   - Verify database performance

3. **Document your deployment**:
   - Save contract addresses
   - Document any custom configurations
   - Create backup procedures

---

**Congratulations! Your Pagent Money deployment is complete! 🎉**
