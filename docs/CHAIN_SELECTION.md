# Chain Selection via URL Parameters

## Overview

The application supports dynamic chain selection through URL parameters, allowing developers and testers to easily switch between Base Mainnet and Base Sepolia testnet without changing configuration files.

## Quick Start

### Using URL Parameters

Simply add the `chain` parameter to any URL:

```
# Base Mainnet
https://yourdomain.com?chain=BASE
https://yourdomain.com?chain=BASE_MAINNET
https://yourdomain.com?chain=8453

# Base Sepolia Testnet
https://yourdomain.com?chain=SEPOLIA
https://yourdomain.com?chain=BASE_SEPOLIA
https://yourdomain.com?chain=84532
```

### Examples

```
# Local development
http://localhost:3000?chain=BASE
http://localhost:3000?chain=SEPOLIA

# With other parameters
http://localhost:3000?chain=SEPOLIA&debug=true
http://localhost:3000/cards?chain=BASE&view=list
```

## Configuration

### Enabling Chain Override

The feature is controlled by environment variables:

```env
# In .env.local or Vercel dashboard
NEXT_PUBLIC_ALLOW_CHAIN_OVERRIDE=true

# Or enable testnet support (automatically enables override)
NEXT_PUBLIC_ENABLE_TESTNET=true
```

### Default Behavior

- **Production**: Chain override is disabled by default
- **Development**: Chain override is enabled automatically
- **With flag**: Explicitly control with `NEXT_PUBLIC_ALLOW_CHAIN_OVERRIDE`

## Supported Chains

| Chain | Parameter Values | Chain ID | Network |
|-------|-----------------|----------|---------|
| Base Mainnet | `BASE`, `BASE_MAINNET`, `8453` | 8453 | Production |
| Base Sepolia | `SEPOLIA`, `BASE_SEPOLIA`, `84532` | 84532 | Testnet |

## UI Components

### Chain Selector

When chain override is enabled, a chain selector appears in the header:

- **Visual Indicator**: Shows current chain with appropriate colors
  - Blue badge for mainnet
  - Yellow badge for testnet
- **Dropdown Menu**: Click to switch between chains
- **Persistent Selection**: Chain selection persists in URL

### Chain Indicator

A minimal badge showing the current chain:
- Appears when chain override is enabled
- Shows chain name and status
- Color-coded for quick identification

## Authentication Flow

The authentication system automatically adapts to the selected chain:

1. **Wallet Connection**: Connects to the selected chain
2. **SIWE Messages**: Include the correct chain ID
3. **Backend Verification**: Validates signatures for the selected chain
4. **Contract Interaction**: Uses chain-specific contract addresses

## Development Workflow

### Testing Both Chains

1. **Start with Mainnet**:
   ```
   http://localhost:3000?chain=BASE
   ```
   - Test mainnet authentication
   - Verify mainnet contract interactions

2. **Switch to Testnet**:
   ```
   http://localhost:3000?chain=SEPOLIA
   ```
   - Test with test tokens
   - Verify testnet contracts

3. **Clear Override**:
   - Click "Reset to Default" in chain selector
   - Or remove the URL parameter

### Team Collaboration

Share specific chain configurations with team members:

```bash
# Share testnet link for testing
"Hey team, test the new feature here: https://staging.app.com?chain=SEPOLIA"

# Share mainnet link for review
"Production preview: https://staging.app.com?chain=BASE"
```

## Security Considerations

### Production Settings

For production deployments:

```env
# Disable chain override in production
NEXT_PUBLIC_ALLOW_CHAIN_OVERRIDE=false
NEXT_PUBLIC_SINGLE_CHAIN_MODE=true
NEXT_PUBLIC_CHAIN_ENV=mainnet
```

### Staging/Testing

For staging environments:

```env
# Enable chain selection for testing
NEXT_PUBLIC_ALLOW_CHAIN_OVERRIDE=true
NEXT_PUBLIC_ENABLE_TESTNET=true
```

## API Integration

### Reading Chain from URL

```typescript
import { useChainFromUrl } from '@/hooks/useChainFromUrl'

function MyComponent() {
  const { selectedChain, setChainInUrl } = useChainFromUrl()
  
  // Use the selected chain
  console.log('Current chain:', selectedChain?.name)
  
  // Programmatically change chain
  const switchToTestnet = () => {
    setChainInUrl(baseSepolia)
  }
}
```

### Using Active Chain

```typescript
import { useActiveChain } from '@/app/chain-provider'

function MyComponent() {
  const { activeChain, isUrlOverride } = useActiveChain()
  
  // Get current active chain
  console.log('Active chain:', activeChain.name)
  
  // Check if URL override is active
  if (isUrlOverride) {
    console.log('Chain selected via URL')
  }
}
```

## Troubleshooting

### Chain Selector Not Appearing

1. Check environment variables:
   ```env
   NEXT_PUBLIC_ALLOW_CHAIN_OVERRIDE=true
   ```

2. Verify you're in development mode or have explicitly enabled it

3. Clear browser cache and reload

### Chain Not Switching

1. Ensure wallet is connected to the correct network
2. Check browser console for errors
3. Verify contract addresses are configured for both chains

### Authentication Fails After Switching

1. Disconnect wallet
2. Clear browser session storage
3. Reconnect wallet on the new chain
4. Re-authenticate

## Best Practices

### For Development

- Always test both chains before deployment
- Use URL parameters to quickly switch contexts
- Share chain-specific URLs with QA team

### For Testing

- Create test scripts with chain parameters
- Document which chain each test uses
- Automate chain switching in E2E tests

### For Production

- Disable chain override for security
- Use single chain mode
- Set explicit mainnet configuration

## Examples

### Direct Links

```html
<!-- Development links -->
<a href="/?chain=BASE">Test on Mainnet</a>
<a href="/?chain=SEPOLIA">Test on Sepolia</a>

<!-- Share with team -->
<a href="https://staging.app.com?chain=SEPOLIA">
  Test new feature on testnet
</a>
```

### Programmatic Navigation

```typescript
// Switch to testnet
window.location.href = '/?chain=SEPOLIA'

// Or use Next.js router
router.push('/?chain=BASE')
```

### Testing Script

```bash
#!/bin/bash

# Test on mainnet
echo "Testing mainnet..."
open "http://localhost:3000?chain=BASE"

# Wait and test on testnet
sleep 5
echo "Testing testnet..."
open "http://localhost:3000?chain=SEPOLIA"
```

## Summary

The URL-based chain selection provides:

- **Flexibility**: Easy switching between chains
- **Testing**: Quick validation on both networks
- **Collaboration**: Share specific configurations
- **Development**: Rapid iteration and debugging

Use this feature during development and testing, but disable it in production for security.