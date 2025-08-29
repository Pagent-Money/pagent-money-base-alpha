'use client'

import { useEffect, useState } from 'react'
import { base, baseSepolia } from 'wagmi/chains'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Chain } from 'viem'

export enum ChainParam {
  BASE_MAINNET = 'BASE_MAINNET',
  BASE_SEPOLIA = 'BASE_SEPOLIA',
  BASE = 'BASE', // Alias for mainnet
  SEPOLIA = 'SEPOLIA' // Alias for testnet
}

const CHAIN_PARAM_KEY = 'chain'

/**
 * Hook to manage chain selection from URL parameters
 * Allows overriding the default chain for testing purposes
 */
export function useChainFromUrl() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Parse chain from URL
  useEffect(() => {
    const chainParam = searchParams.get(CHAIN_PARAM_KEY)
    
    if (chainParam) {
      const chain = parseChainParam(chainParam)
      if (chain) {
        setSelectedChain(chain)
        console.log(`🔗 Chain override from URL: ${chain.name} (${chain.id})`)
      } else {
        console.warn(`⚠️ Invalid chain parameter: ${chainParam}`)
      }
    }
    
    setIsLoading(false)
  }, [searchParams])

  // Function to parse chain parameter
  const parseChainParam = (param: string): Chain | null => {
    const upperParam = param.toUpperCase()
    
    switch (upperParam) {
      case ChainParam.BASE_MAINNET:
      case ChainParam.BASE:
      case '8453': // Chain ID
        return base
      
      case ChainParam.BASE_SEPOLIA:
      case ChainParam.SEPOLIA:
      case '84532': // Chain ID
        return baseSepolia
      
      default:
        return null
    }
  }

  // Function to update URL with chain parameter
  const setChainInUrl = (chain: Chain) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Use readable chain names
    const chainName = chain.id === base.id ? ChainParam.BASE : ChainParam.SEPOLIA
    params.set(CHAIN_PARAM_KEY, chainName)
    
    // Update URL without page refresh
    router.push(`?${params.toString()}`, { scroll: false })
    setSelectedChain(chain)
    
    console.log(`🔄 Updated chain in URL: ${chain.name} (${chain.id})`)
  }

  // Function to remove chain parameter from URL
  const clearChainFromUrl = () => {
    // Only clear if there's actually a chain parameter to remove
    if (!searchParams.get(CHAIN_PARAM_KEY)) {
      return
    }
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete(CHAIN_PARAM_KEY)
    
    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false })
    setSelectedChain(null)
    
    console.log('🧹 Cleared chain override from URL')
  }

  // Check if URL has chain override
  const hasChainOverride = !!searchParams.get(CHAIN_PARAM_KEY)

  return {
    selectedChain,
    isLoading,
    hasChainOverride,
    setChainInUrl,
    clearChainFromUrl,
    chainParam: searchParams.get(CHAIN_PARAM_KEY)
  }
}

/**
 * Helper function to get chain selection URL
 */
export function getChainSelectionUrl(chain: Chain, baseUrl?: string): string {
  const base = baseUrl || window.location.origin
  const chainName = chain.id === 8453 ? ChainParam.BASE : ChainParam.SEPOLIA
  return `${base}?${CHAIN_PARAM_KEY}=${chainName}`
}

/**
 * Helper to check if chain override is allowed
 */
export function isChainOverrideAllowed(): boolean {
  // Allow chain override in development and when explicitly enabled
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_ENABLE_TESTNET === 'true' ||
    process.env.NEXT_PUBLIC_ALLOW_CHAIN_OVERRIDE === 'true'
  )
}