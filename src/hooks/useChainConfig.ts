import { useAccount } from 'wagmi'
import { getChainConfig, getDefaultChain, isChainSupported } from '../config/chains'
import { useMemo } from 'react'

export function useChainConfig() {
  const { chainId } = useAccount()
  
  const config = useMemo(() => {
    // If wallet is connected and on a supported chain, use that
    if (chainId && isChainSupported(chainId)) {
      return getChainConfig(chainId)!
    }
    
    // Otherwise use the default chain config
    const defaultChain = getDefaultChain()
    return getChainConfig(defaultChain.id)!
  }, [chainId])
  
  return {
    chainConfig: config,
    isTestnet: config.isTestnet,
    chain: config.chain,
    explorerUrl: config.explorerUrl,
    usdcAddress: config.usdcAddress,
    spenderAddress: config.spenderAddress,
    registryAddress: config.registryAddress,
  }
}