# Vercel Deployment Guide for Pagent Credits

## 🚀 Deployment Status

✅ **Project Created**: `pagent-credits` on Vercel  
✅ **OnchainKit Integration**: Mini-app optimized layout  
✅ **Security Audit**: All sensitive files removed  
⚠️ **Environment Variables**: Need to be configured  

---

## 🔧 Required Environment Variables

Before deploying, configure these environment variables in your Vercel dashboard:

### **Core Variables (Required)**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Base Network Configuration  
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
```

### **Optional Variables (For Full Features)**
```bash
# Etherscan API (for transaction verification)
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key

# Coinbase Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id

# Contract Addresses (Base Mainnet)
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_SPENDER_ADDRESS=your_deployed_spender_contract
NEXT_PUBLIC_REGISTRY_ADDRESS=your_deployed_registry_contract
```

---

## 📱 OnchainKit Mini-App Features

Based on the [OnchainKit documentation](https://github.com/coinbase/onchainkit) and [Base docs](https://docs.base.org/get-started/base), the app now includes:

### ✨ **Mini-App Optimizations**
- **MiniAppLayout**: OnchainKit-compatible layout with Identity components
- **Touch-friendly UI**: Optimized for mobile mini-app experience
- **Safe Area Support**: Handles notched devices and safe areas
- **Performance**: Static generation with dynamic API routes

### 🎯 **OnchainKit Components**
- `Identity` with Avatar, Name, and Badge
- `Wallet` with optimized connection flow
- Mini-app friendly navigation
- Responsive credit card component

### 📐 **Layout Features**
- Max width: `screen-sm` (640px) for mini-app compatibility
- Sticky header with gradient branding
- Floating navigation with rounded design
- Status indicator for Base network

---

## 🔗 Deployment Commands

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add other variables as needed

# Redeploy after setting variables
vercel --prod
```

---

## 🌐 Expected URLs

- **Production**: `https://pagent-credits-[hash]-wenqing-yus-projects.vercel.app`
- **Custom Domain**: Configure in Vercel dashboard
- **Base Mini-App**: Ready for integration into Base ecosystem

---

## 🔧 Troubleshooting

### Build Fails with "supabaseUrl is required"
- **Solution**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables

### Mini-App Not Loading Properly
- **Check**: Viewport meta tags are configured
- **Verify**: Touch action CSS rules are applied
- **Ensure**: Safe area insets are supported

### OnchainKit Components Not Working
- **Version**: Ensure `@coinbase/onchainkit@^0.28.7` is installed
- **Import**: Verify all OnchainKit components are properly imported
- **Wallet**: Check wallet connection in mini-app environment

---

## 📖 References

- [OnchainKit Documentation](https://github.com/coinbase/onchainkit)
- [Base Platform](https://docs.base.org/get-started/base)
- [OnchainKit Mint Example](https://ock-mint.vercel.app/)
- [Vercel Deployment](https://vercel.com/docs)

---

*Note: This deployment uses OnchainKit components optimized for Base mini-apps and Coinbase Wallet integration.*
