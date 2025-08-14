'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { base, baseSepolia } from 'wagmi/chains'
import type { Chain } from 'viem'
import { useChainFromUrl, isChainOverrideAllowed } from '../hooks/useChainFromUrl'
import { getDefaultChain } from '../config/chains'

interface ChainContextType {
  activeChain: Chain
  isUrlOverride: boolean
  isOverrideAllowed: boolean
  setChain: (chain: Chain) => void
  resetToDefault: () => void
}

const ChainContext = createContext<ChainContextType | null>(null)

export function useActiveChain() {
  const context = useContext(ChainContext)
  if (!context) {
    throw new Error('useActiveChain must be used within ChainProvider')
  }
  return context
}

interface ChainProviderProps {
  children: ReactNode
}

export function ChainProvider({ children }: ChainProviderProps) {
  const { selectedChain, hasChainOverride, setChainInUrl, clearChainFromUrl } = useChainFromUrl()
  const [activeChain, setActiveChain] = useState<Chain>(() => getDefaultChain())
  const isOverrideAllowed = isChainOverrideAllowed()

  useEffect(() => {
    // Only use URL override if allowed
    if (isOverrideAllowed && selectedChain) {
      setActiveChain(selectedChain)
      console.log(`🔗 Using chain from URL: ${selectedChain.name}`)
    } else if (hasChainOverride && !isOverrideAllowed) {
      // Clear URL param if override not allowed
      console.warn('⚠️ Chain override not allowed in this environment')
      clearChainFromUrl()
    }
  }, [selectedChain, hasChainOverride, isOverrideAllowed, clearChainFromUrl])

  const setChain = (chain: Chain) => {
    if (isOverrideAllowed) {
      setChainInUrl(chain)
      setActiveChain(chain)
    } else {
      console.warn('Chain override not allowed in this environment')
    }
  }

  const resetToDefault = () => {
    clearChainFromUrl()
    setActiveChain(getDefaultChain())
  }

  return (
    <ChainContext.Provider
      value={{
        activeChain,
        isUrlOverride: hasChainOverride,
        isOverrideAllowed,
        setChain,
        resetToDefault
      }}
    >
      {children}
    </ChainContext.Provider>
  )
}