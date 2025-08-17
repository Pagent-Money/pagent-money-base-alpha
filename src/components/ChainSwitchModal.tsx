'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { useActiveChain } from '../app/chain-provider'
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface ChainSwitchModalProps {
 isOpen: boolean
 onClose: () => void
 onSuccess?: () => void
}

export function ChainSwitchModal({ isOpen, onClose, onSuccess }: ChainSwitchModalProps) {
 const { chainId: walletChainId } = useAccount()
 const { activeChain } = useActiveChain()
 const { switchChain, isPending, error } = useSwitchChain()
 const [switchAttempted, setSwitchAttempted] = useState(false)
 const [isSuccess, setIsSuccess] = useState(false)

 // Check if chains match
 const isCorrectChain = walletChainId === activeChain.id

 // Auto-close when correct chain is detected
 useEffect(() => {
  if (isCorrectChain && switchAttempted) {
   setIsSuccess(true)
   setTimeout(() => {
    onSuccess?.()
    onClose()
    setIsSuccess(false)
    setSwitchAttempted(false)
   }, 1500)
  }
 }, [isCorrectChain, switchAttempted, onSuccess, onClose])

 // Auto-attempt switch when modal opens
 useEffect(() => {
  if (isOpen && !isCorrectChain && !switchAttempted && switchChain) {
   handleSwitchChain()
  }
 }, [isOpen, isCorrectChain, switchAttempted])

 const handleSwitchChain = async () => {
  if (!switchChain) return
  
  setSwitchAttempted(true)
  try {
   await switchChain({ chainId: activeChain.id })
  } catch (err) {
   console.error('Chain switch failed:', err)
  }
 }

 if (!isOpen) return null

 const getChainColorClasses = () => {
  return activeChain.id === 84532 
   ? {
     iconBg: 'bg-yellow-100',
     iconColor: 'text-yellow-600',
     buttonBg: 'bg-yellow-600 hover:bg-yellow-700'
    }
   : {
     iconBg: 'bg-blue-100',
     iconColor: 'text-blue-600',
     buttonBg: 'bg-blue-600 hover:bg-blue-700'
    }
 }

 const getChainName = () => {
  return activeChain.name
 }

 const renderContent = () => {
  if (isSuccess) {
   return (
    <div className="text-center">
     <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
      <CheckCircle className="w-6 h-6 text-green-600" />
     </div>
     <h3 className="text-lg font-medium text-gray-900 mb-2">
      Success!
     </h3>
     <p className="text-sm text-gray-500">
      Successfully switched to {getChainName()}
     </p>
    </div>
   )
  }

  if (isPending) {
   return (
    <div className="text-center">
     <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
     </div>
     <h3 className="text-lg font-medium text-gray-900 mb-2">
      Switching Network
     </h3>
     <p className="text-sm text-gray-500 mb-4">
      Please approve the network switch in your wallet
     </p>
     <div className="text-xs text-gray-400">
      Switching to {getChainName()} (Chain ID: {activeChain.id})
     </div>
    </div>
   )
  }

  if (error) {
   return (
    <div className="text-center">
     <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
      <AlertCircle className="w-6 h-6 text-red-600" />
     </div>
     <h3 className="text-lg font-medium text-gray-900 mb-2">
      Network Switch Failed
     </h3>
     <p className="text-sm text-gray-500 mb-4">
      Please switch to {getChainName()} manually in your wallet
     </p>
     <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
      <div className="font-medium mb-1">Manual Steps:</div>
      <div>1. Open your wallet settings</div>
      <div>2. Find "Networks" or "Add Network"</div>
      <div>3. Select "{getChainName()}"</div>
      <div>4. Chain ID: {activeChain.id}</div>
     </div>
     <button
      onClick={handleSwitchChain}
      className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
     >
      Try Again
     </button>
    </div>
   )
  }

  const colors = getChainColorClasses()
  
  return (
   <div className="text-center">
    <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full ${colors.iconBg} mb-4`}>
     <AlertCircle className={`w-6 h-6 ${colors.iconColor}`} />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
     Switch Network Required
    </h3>
    <p className="text-sm text-gray-500 mb-4">
     To continue, please switch your wallet to {getChainName()}
    </p>
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
     <div className="text-sm font-medium text-gray-700">Target Network:</div>
     <div className="text-lg font-bold text-gray-900">{getChainName()}</div>
     <div className="text-xs text-gray-500">Chain ID: {activeChain.id}</div>
    </div>
    <button
     onClick={handleSwitchChain}
     className={`w-full ${colors.buttonBg} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors`}
    >
     Switch Network
    </button>
   </div>
  )
 }

 return (
  <div className="fixed inset-0 z-50 overflow-y-auto">
   {/* Backdrop */}
   <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
   
   {/* Modal */}
   <div className="flex min-h-full items-center justify-center p-4">
    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
     {/* Close button */}
     {!isPending && !isSuccess && (
      <button
       onClick={onClose}
       className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
       <X className="w-5 h-5" />
      </button>
     )}
     
     {/* Content */}
     {renderContent()}
    </div>
   </div>
  </div>
 )
}