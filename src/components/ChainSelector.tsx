'use client'

import { useState } from 'react'
import { base, baseSepolia } from 'wagmi/chains'
import { useActiveChain } from '../app/chain-provider'
import { ChevronDown, Globe, AlertCircle } from 'lucide-react'

export function ChainSelector() {
  const { activeChain, isUrlOverride, isOverrideAllowed, setChain, resetToDefault } = useActiveChain()
  const [isOpen, setIsOpen] = useState(false)

  // Don't show selector if override not allowed
  if (!isOverrideAllowed) {
    return null
  }

  const isTestnet = activeChain.id === baseSepolia.id

  return (
    <div className="relative">
      {/* Current Chain Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          transition-colors border
          ${isTestnet 
            ? 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100' 
            : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
          }
        `}
      >
        <Globe className="w-4 h-4" />
        <span>{activeChain.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              <div className="text-xs text-gray-500 px-3 py-2 font-semibold uppercase tracking-wider">
                Select Network
              </div>
              
              {/* Base Mainnet Option */}
              <button
                onClick={() => {
                  setChain(base)
                  setIsOpen(false)
                }}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm
                  transition-colors flex items-center justify-between
                  ${activeChain.id === base.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div>
                  <div className="font-medium">Base Mainnet</div>
                  <div className="text-xs text-gray-500">Chain ID: 8453</div>
                </div>
                {activeChain.id === base.id && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>

              {/* Base Sepolia Option */}
              <button
                onClick={() => {
                  setChain(baseSepolia)
                  setIsOpen(false)
                }}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm
                  transition-colors flex items-center justify-between
                  ${activeChain.id === baseSepolia.id
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div>
                  <div className="font-medium">Base Sepolia</div>
                  <div className="text-xs text-gray-500">Chain ID: 84532 (Testnet)</div>
                </div>
                {activeChain.id === baseSepolia.id && (
                  <span className="text-yellow-600">✓</span>
                )}
              </button>

              {/* Divider */}
              {isUrlOverride && (
                <>
                  <div className="border-t border-gray-200 my-2" />
                  
                  {/* Reset to Default */}
                  <button
                    onClick={() => {
                      resetToDefault()
                      setIsOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-50 text-gray-600"
                  >
                    Reset to Default
                  </button>
                </>
              )}

              {/* Info */}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="px-3 py-2 text-xs text-gray-500 flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <div>
                    {isTestnet 
                      ? 'Testnet mode: Transactions use test tokens'
                      : 'Mainnet mode: Real transactions'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Minimal chain indicator badge
 */
export function ChainIndicator() {
  const { activeChain, isOverrideAllowed } = useActiveChain()
  
  if (!isOverrideAllowed) {
    return null
  }

  const isTestnet = activeChain.id === baseSepolia.id

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
        ${isTestnet 
          ? 'bg-yellow-100 text-yellow-800' 
          : 'bg-blue-100 text-blue-800'
        }
      `}
    >
      <div className={`w-2 h-2 rounded-full ${isTestnet ? 'bg-yellow-500' : 'bg-blue-500'}`} />
      {activeChain.name}
    </div>
  )
}