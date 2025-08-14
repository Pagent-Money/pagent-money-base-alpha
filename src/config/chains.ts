import { base, baseSepolia } from 'wagmi/chains'
import type { Chain } from 'viem'

export enum ChainEnvironment {
  MAINNET = 'mainnet',
  TESTNET = 'testnet'
}

interface ChainConfig {
  chain: Chain
  rpcUrl: string
  explorerUrl: string
  usdcAddress: string
  spenderAddress?: string
  registryAddress?: string
  isTestnet: boolean
}

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  // Base Mainnet
  [base.id]: {
    chain: base,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Official USDC on Base
    spenderAddress: process.env.NEXT_PUBLIC_SPENDER_ADDRESS_MAINNET,
    registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_MAINNET,
    isTestnet: false
  },
  // Base Sepolia Testnet
  [baseSepolia.id]: {
    chain: baseSepolia,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS_TESTNET || '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Test USDC on Base Sepolia
    spenderAddress: process.env.NEXT_PUBLIC_SPENDER_ADDRESS_TESTNET,
    registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS_TESTNET,
    isTestnet: true
  }
}

// Determine default chain based on environment configuration
export function getDefaultChain(overrideChain?: Chain): Chain {
  // If override is provided (e.g., from URL), use it
  if (overrideChain) {
    return overrideChain
  }
  
  const chainEnv = process.env.NEXT_PUBLIC_CHAIN_ENV as ChainEnvironment
  
  // Priority order:
  // 1. Explicit CHAIN_ENV setting
  // 2. NODE_ENV (production = mainnet, others = testnet)
  // 3. Default to mainnet for production readiness
  
  if (chainEnv === ChainEnvironment.TESTNET) {
    return baseSepolia
  }
  
  if (chainEnv === ChainEnvironment.MAINNET) {
    return base
  }
  
  // If no explicit chain env, use NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return base
  }
  
  // Development defaults to mainnet for testing real authentication
  return base
}

// Get all supported chains (for wallet configuration)
export function getSupportedChains(): Chain[] {
  const defaultChain = getDefaultChain()
  
  // If explicitly set to single chain mode
  if (process.env.NEXT_PUBLIC_SINGLE_CHAIN_MODE === 'true') {
    return [defaultChain]
  }
  
  // Otherwise support both chains
  return [base, baseSepolia]
}

// Get chain configuration by ID
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId]
}

// Check if a chain is supported
export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_CONFIGS
}

// Get current chain configuration from the default chain
export function getCurrentChainConfig(): ChainConfig {
  const defaultChain = getDefaultChain()
  return CHAIN_CONFIGS[defaultChain.id]!
}