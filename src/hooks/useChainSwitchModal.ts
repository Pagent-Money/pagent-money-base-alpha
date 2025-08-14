'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useActiveChain } from '../app/chain-provider'

export function useChainSwitchModal() {
  const { chainId: walletChainId, isConnected } = useAccount()
  const { activeChain } = useActiveChain()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasUserDismissed, setHasUserDismissed] = useState(false)

  // Check if chains match
  const isCorrectChain = walletChainId === activeChain.id
  const needsSwitch = isConnected && !isCorrectChain

  // Show modal when user needs to switch and hasn't dismissed it
  useEffect(() => {
    if (needsSwitch && !hasUserDismissed && !isModalOpen) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setIsModalOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [needsSwitch, hasUserDismissed, isModalOpen])

  // Reset dismissal when chain changes (URL change)
  useEffect(() => {
    setHasUserDismissed(false)
  }, [activeChain.id])

  // Close modal when correct chain is detected
  useEffect(() => {
    if (isCorrectChain && isModalOpen) {
      setIsModalOpen(false)
    }
  }, [isCorrectChain, isModalOpen])

  const openModal = () => {
    setIsModalOpen(true)
    setHasUserDismissed(false)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setHasUserDismissed(true)
  }

  const onSwitchSuccess = () => {
    setIsModalOpen(false)
    setHasUserDismissed(false)
  }

  return {
    isModalOpen,
    needsSwitch,
    isCorrectChain,
    openModal,
    closeModal,
    onSwitchSuccess
  }
}