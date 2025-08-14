# Pagent Money — Non-Custodial Credit Card

**Spend-Permission Powered Credit Card on Base**

Pagent is a revolutionary non-custodial credit card that draws funds directly from your Base Smart Account using Spend Permissions—no repeated signatures, no custody, complete control.

## 🌟 Features

- **Non-Custodial**: Your funds remain in your smart account at all times
- **Spend Permissions**: Set time-boxed, revocable allowances for seamless payments  
- **Base Native**: Built on Base with USDC for fast, low-cost transactions
- **Real-time Dashboard**: Track spending, manage limits, view transaction history
- **Demo Ready**: Complete sandbox environment for testing and development

## 🏗️ Architecture

### Smart Contracts (`contracts/`)
- **PagentSettlementSpender.sol**: Main spender contract that executes spend permissions
- **CreditRegistry.sol**: Optional analytics and guardrails for period usage tracking

### Backend (`supabase/`)
- **Edge Functions**: Webhook handlers for card vendor integrations
- **Database**: PostgreSQL with RLS for secure multi-tenant data
- **Real-time**: Live updates for transaction notifications

### Frontend (`src/`)
- **Base Mini-App**: Compatible with Base App Mini-App framework
- **OnchainKit Integration**: Wallet connection and smart account management
- **React Components**: Modern UI with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional for local development)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) for smart contracts

### 1. Clone and Install

```bash
git clone https://github.com/your-org/pagent-money-base-alpha.git
cd pagent-money-base-alpha
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env.local

# Edit with your configuration
# - Supabase project URL and keys
# - Coinbase API key  
# - Contract addresses (after deployment)
```

### 3. Database Setup

```bash
# Start local Supabase (optional)
npm run supabase:start

# Or configure connection to your Supabase project
# Run migrations
supabase db push
```

### 4. Smart Contract Deployment

```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy contracts to Base Sepolia (testnet)
cd contracts
cp env.example .env
# Edit .env with your private key and RPC URL
npm run contracts:deploy
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📖 Usage Guide

### For Users

1. **Connect Wallet**: Use Coinbase Wallet or any Base-compatible wallet
2. **Create Smart Account**: Enable spend permissions during setup
3. **Set Credit Limit**: Choose your spending limit and time period (daily/weekly/monthly)
4. **Start Spending**: Use your virtual card for seamless payments

### For Developers

#### Creating Spend Permissions

```typescript
import { useSpendPermissions } from './hooks/useSpendPermissions'

function MyComponent() {
  const { createPermission } = useSpendPermissions()
  
  const handleCreatePermission = async () => {
    const result = await createPermission({
      token: USDC_ADDRESS_BASE,
      cap: 100 * 1e6, // $100 USDC
      period: SPEND_PERMISSION_PERIODS.WEEKLY,
      start: Math.floor(Date.now() / 1000),
      end: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      spender: SPENDER_CONTRACT_ADDRESS
    }, signature)
    
    if (result.success) {
      console.log('Permission created!')
    }
  }
}
```

#### Processing Payments

```typescript
// In your webhook handler (supabase/functions/card-webhook/index.ts)
const { data: receipt } = await supabase
  .from('receipts')
  .insert({
    user_id: user.id,
    auth_id: webhookData.auth_id,
    amount: webhookData.amount,
    merchant: webhookData.merchant,
    status: 'pending'
  })

// Execute spend permission
const spendResult = await executeSpendPermission({
  user: user.smart_account,
  permission,
  amount: webhookData.amount,
  authId: webhookData.auth_id
})
```

## 🛠️ Development

### Project Structure

```
pagent-money-base-alpha/
├── contracts/                 # Smart contracts (Solidity)
│   ├── src/                  # Contract source files
│   ├── script/               # Deployment scripts
│   └── test/                 # Contract tests
├── supabase/                 # Backend infrastructure
│   ├── functions/            # Edge Functions
│   └── migrations/           # Database migrations  
├── src/                      # Frontend application
│   ├── app/                  # Next.js app router
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and configuration
│   └── types/                # TypeScript types
└── docs/                     # Documentation
```

### Available Scripts

```bash
# Development
npm run dev                   # Start development server
npm run build                 # Build for production
npm run start                 # Start production server

# Smart Contracts
npm run contracts:compile     # Compile contracts
npm run contracts:test        # Run contract tests
npm run contracts:deploy      # Deploy to configured network

# Database
npm run supabase:start        # Start local Supabase
npm run supabase:stop         # Stop local Supabase
npm run supabase:reset        # Reset database

# Code Quality
npm run lint                  # Run ESLint
npm run type-check           # Run TypeScript checks
npm test                     # Run tests
```

### Testing

```bash
# Run all tests
npm test

# Run contract tests
npm run contracts:test

# Run with coverage
npm run test:coverage
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `NEXT_PUBLIC_COINBASE_API_KEY` | Coinbase API key | ✅ |
| `NEXT_PUBLIC_SPENDER_ADDRESS` | Deployed spender contract | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |

### Smart Contract Configuration

Update `contracts/foundry.toml` with your preferred settings:

- Solidity version
- Optimizer settings  
- RPC endpoints
- Etherscan API keys

## 🚦 Roadmap

### MVP (Days 0–30) ✅
- [x] Core smart contracts
- [x] Basic mini-app with wallet connection
- [x] Spend permission management
- [x] Transaction history and receipts
- [x] Demo environment

### Pilot (Days 31–60)
- [ ] Card vendor integration (real API)
- [ ] Enhanced security and risk controls
- [ ] Mobile app optimization
- [ ] Partner SDK development
- [ ] Production deployment

### Future
- [ ] Multi-chain support
- [ ] Advanced analytics dashboard
- [ ] Merchant tools and APIs
- [ ] Credit scoring integration
- [ ] DeFi yield integration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.pagent.money](https://docs.pagent.money)
- **Discord**: [Join our community](https://discord.gg/pagent)
- **Email**: support@pagent.money
- **Issues**: [GitHub Issues](https://github.com/your-org/pagent-money-base-alpha/issues)

## 🙏 Acknowledgments

- [Base](https://base.org) for the incredible L2 infrastructure
- [Coinbase](https://coinbase.com) for OnchainKit and wallet tools
- [Supabase](https://supabase.com) for the backend platform
- The entire Base ecosystem for inspiration and support

---

**Built with ❤️ for the Base ecosystem**
