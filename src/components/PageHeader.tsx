'use client'

import { useAccount } from 'wagmi'
import { 
  ConnectWallet, 
  Wallet, 
  WalletDropdown, 
  WalletDropdownLink, 
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet'
import { ClientOnly } from './ClientOnly'
import { ChainSelector } from './ChainSelector'
import { useEnsureCorrectChain } from '../hooks/useEnsureCorrectChain'
import { useChainSwitchModal } from '../hooks/useChainSwitchModal'

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  const { address, isConnected } = useAccount()
  const { isWrongChain, expectedChainName, isSwitching } = useEnsureCorrectChain()
  const { openModal, needsSwitch } = useChainSwitchModal()

  return (
    <div className="border-b border-border/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      {/* Wrong Chain Warning */}
      {needsSwitch && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-800">
              <span>⚠️</span>
              <span>
                {isSwitching 
                  ? `Switching to ${expectedChainName}...` 
                  : `Wrong network detected.`
                }
              </span>
              {!isSwitching && (
                <button
                  onClick={openModal}
                  className="ml-2 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-xs font-medium transition-colors"
                >
                  Switch Network
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <img src="/pagentmoney_p_logo.png" alt="Pagent Money" className="h-8" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#6B53FF] to-[#FEA611] bg-clip-text text-transparent">
                Pagent Credits
              </h1>
              <p className="text-sm text-muted-foreground">
                Allowance, Not Custody.
              </p>
            </div>
          </div>

          {/* Chain Selector and Wallet Connection */}
          <div className="flex items-center gap-3">
            {/* Chain Selector (only shows in dev/test mode) */}
            <ClientOnly>
              <ChainSelector />
            </ClientOnly>
            
            <ClientOnly
              fallback={
                <div className="bg-gradient-to-r from-[#6B53FF] to-[#FEA611] text-white px-4 py-2 rounded-lg font-medium shadow-md opacity-50">
                  Loading...
                </div>
              }
            >
              {isConnected ? (
                <Wallet>
                  <WalletDropdown>
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground mb-1">Connected</div>
                      <div className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
                    </div>
                    <WalletDropdownLink icon="wallet" href="/credits">
                      Credits
                    </WalletDropdownLink>
                    <WalletDropdownLink icon="creditCard" href="/cards">
                      Cards
                    </WalletDropdownLink>
                    <WalletDropdownLink icon="gift" href="/promos">
                      Promos
                    </WalletDropdownLink>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              ) : (
                <ConnectWallet
                  text="Connect Wallet"
                  className="bg-gradient-to-r from-[#6B53FF] to-[#FEA611] hover:from-[#5B43EF] hover:to-[#E89501] text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                />
              )}
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  )
}
