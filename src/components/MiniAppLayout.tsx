'use client'

import { ReactNode } from 'react'
import { Avatar, Name, Badge, Identity } from '@coinbase/onchainkit/identity'
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet'
import { useAccount } from 'wagmi'

interface MiniAppLayoutProps {
  children: ReactNode
  title?: string
  showWallet?: boolean
}

export function MiniAppLayout({ children, title = "Pagent Credits", showWallet = true }: MiniAppLayoutProps) {
  const { address } = useAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Mini-app optimized header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-screen-sm mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#6B53FF] to-[#FEA611] flex items-center justify-center">
                <img src="/pagentmoney_p_logo.png" alt="P" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-[#6B53FF] to-[#FEA611] bg-clip-text text-transparent">
                  {title}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Allowance, Not Custody</p>
              </div>
            </div>

            {/* Wallet Integration */}
            {showWallet && (
              <div className="flex items-center gap-2">
                {address ? (
                  <Wallet>
                    <WalletDropdown>
                      <Identity
                        address={address}
                        className="px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Avatar className="w-6 h-6" />
                        <Name className="text-sm font-medium" />
                        <Badge className="ml-2" />
                      </Identity>
                      <WalletDropdownDisconnect />
                    </WalletDropdown>
                  </Wallet>
                ) : (
                  <ConnectWallet className="bg-gradient-to-r from-[#6B53FF] to-[#FEA611] hover:from-[#5B43EF] hover:to-[#E89501] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all" />
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area optimized for mini-apps */}
      <main className="max-w-screen-sm mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Mini-app optimized status bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-screen-sm mx-auto px-4 py-2">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Base Network</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Powered by OnchainKit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
