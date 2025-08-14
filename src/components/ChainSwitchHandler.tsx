'use client'

import { ChainSwitchModal } from './ChainSwitchModal'
import { useChainSwitchModal } from '../hooks/useChainSwitchModal'

export function ChainSwitchHandler() {
  const { isModalOpen, closeModal, onSwitchSuccess } = useChainSwitchModal()

  return (
    <ChainSwitchModal
      isOpen={isModalOpen}
      onClose={closeModal}
      onSuccess={onSwitchSuccess}
    />
  )
}