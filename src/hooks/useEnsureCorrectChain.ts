'use client'

import { useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { useActiveChain } from '../app/chain-provider'

/**
 * Hook to ensure wallet is on the correct chain
 * Automatically prompts to switch if on wrong chain
 */
export function useEnsureCorrectChain() {
  const { chainId: walletChainId, isConnected } = useAccount()
  const { activeChain } = useActiveChain()
  const { switchChain, isPending } = useSwitchChain()

  useEffect(() => {
    if (!isConnected || !walletChainId) return

    // Check if wallet is on wrong chain
    if (walletChainId !== activeChain.id) {
      console.log('⚠️ Wallet on wrong chain!', {
        walletChain: walletChainId,
        expectedChain: activeChain.id,
        chainName: activeChain.name
      })

      // Attempt to switch chain
      if (switchChain && !isPending) {
        console.log('🔄 Requesting chain switch to:', activeChain.name)
        switchChain({ chainId: activeChain.id })
      }
    }
  }, [walletChainId, activeChain.id, activeChain.name, isConnected, switchChain, isPending])

  return {
    isCorrectChain: walletChainId === activeChain.id,
    isWrongChain: isConnected && walletChainId !== activeChain.id,
    walletChainId,
    expectedChainId: activeChain.id,
    expectedChainName: activeChain.name,
    isSwitching: isPending
  }
}