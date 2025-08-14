# Chain Configuration Guide

## Overview

Pagent Money supports both Base Mainnet and Base Sepolia Testnet for authentication and transactions. The application can be configured to use either chain or support both simultaneously.

## Quick Setup

### For Base Mainnet (Production)
```bash
# Run the setup script
./scripts/setup-mainnet.sh

# Or manually set in .env.local:
NEXT_PUBLIC_CHAIN_ENV=mainnet
```

### For Base Sepolia Testnet (Development)
```bash
# Set in .env.local:
NEXT_PUBLIC_CHAIN_ENV=testnet
```

## Configuration Options

### Environment Variables

| Variable | Description | Options | Default |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_CHAIN_ENV` | Primary chain environment | `mainnet`, `testnet` | `mainnet` in production |
| `NEXT_PUBLIC_SINGLE_CHAIN_MODE` | Restrict to single chain | `true`, `false` | `false` |
| `NEXT_PUBLIC_BASE_RPC_URL` | Base mainnet RPC URL | URL string | `https://mainnet.base.org` |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC URL | URL string | `https://sepolia.base.org` |

### Contract Addresses

#### Base Mainnet
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Official USDC on Base)
- **Spender Contract**: Set via `NEXT_PUBLIC_SPENDER_ADDRESS_MAINNET`
- **Registry Contract**: Set via `NEXT_PUBLIC_REGISTRY_ADDRESS_MAINNET`

#### Base Sepolia Testnet
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Test USDC)
- **Spender Contract**: Set via `NEXT_PUBLIC_SPENDER_ADDRESS_TESTNET`
- **Registry Contract**: Set via `NEXT_PUBLIC_REGISTRY_ADDRESS_TESTNET`

## Chain Details

### Base Mainnet
- **Chain ID**: 8453
- **Currency**: ETH
- **Explorer**: https://basescan.org
- **RPC**: https://mainnet.base.org

### Base Sepolia Testnet
- **Chain ID**: 84532
- **Currency**: ETH (testnet)
- **Explorer**: https://sepolia.basescan.org
- **RPC**: https://sepolia.base.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Authentication Flow

The SIWE (Sign-In with Ethereum) authentication supports both chains:

1. **Wallet Connection**: Users can connect with Coinbase Smart Wallet on either chain
2. **Chain Validation**: The app validates that users are on a supported chain
3. **Message Signing**: SIWE messages include the chain ID for security
4. **Backend Verification**: The Supabase edge function verifies signatures for both chains

## Multi-Chain Support

When `NEXT_PUBLIC_SINGLE_CHAIN_MODE=false` (default):
- Users can switch between Base Mainnet and Base Sepolia
- The app adapts to the connected chain automatically
- Contract addresses are selected based on the active chain

When `NEXT_PUBLIC_SINGLE_CHAIN_MODE=true`:
- Only the chain specified by `NEXT_PUBLIC_CHAIN_ENV` is supported
- Users must be on the correct chain to authenticate
- Useful for production deployments

## Development vs Production

### Development Mode
- Defaults to Base Mainnet for testing real authentication
- Can be overridden with `NEXT_PUBLIC_CHAIN_ENV=testnet`
- Supports both chains for flexibility

### Production Mode
- Defaults to Base Mainnet
- Should set `NEXT_PUBLIC_SINGLE_CHAIN_MODE=true` for production
- Configure appropriate contract addresses

## Troubleshooting

### Common Issues

1. **"Please switch to Base network"**
   - Ensure your wallet is connected to either Base Mainnet or Base Sepolia
   - Check that the chain is properly configured in your wallet

2. **Authentication fails with invalid signature**
   - Verify you're using a Coinbase Smart Wallet
   - Ensure the chain ID matches between frontend and backend

3. **Contract interactions fail**
   - Check that contract addresses are set for the active chain
   - Verify contracts are deployed to the correct chain

### Testing Authentication

1. **On Mainnet**: Connect with Coinbase Smart Wallet on Base Mainnet
2. **On Testnet**: 
   - Get testnet ETH from the faucet
   - Connect wallet to Base Sepolia
   - Test authentication flow

## Security Considerations

- Chain ID is included in SIWE messages to prevent replay attacks
- Backend validates chain ID matches expected values
- Smart contract addresses are chain-specific
- RPC endpoints can be customized for reliability

## Migration Guide

### From Testnet to Mainnet

1. Update environment variables:
   ```bash
   NEXT_PUBLIC_CHAIN_ENV=mainnet
   NEXT_PUBLIC_SINGLE_CHAIN_MODE=true
   ```

2. Deploy contracts to mainnet and update addresses

3. Update Supabase edge functions if needed

4. Test authentication with mainnet wallet

### Supporting Both Chains

1. Keep `NEXT_PUBLIC_SINGLE_CHAIN_MODE=false`
2. Ensure contracts are deployed on both chains
3. Set addresses for both environments
4. Test switching between chains