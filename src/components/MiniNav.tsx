'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, CreditCard, Gift } from 'lucide-react'

export function MiniNav() {
  const pathname = usePathname()

  const items = [
    { href: '/credits', label: 'Credits', Icon: Wallet },
    { href: '/cards', label: 'Cards', Icon: CreditCard },
    { href: '/promos', label: 'Promos', Icon: Gift },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-screen-sm mx-auto px-4 pb-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
          <div className="grid grid-cols-3 p-2">
            {items.map(({ href, label, Icon }) => {
              const active = pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl text-sm transition-all ${
                    active 
                      ? 'text-white bg-gradient-to-r from-[#6B53FF] to-[#FEA611] shadow-md transform scale-105' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${active ? 'text-white' : ''}`} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}


