'use client'

import { ReactNode } from 'react'
import { formatCurrency } from '../lib/utils'
import { Badge } from '@coinbase/onchainkit/identity'

interface CreditCardMiniProps {
  availableCredit: number
  totalLimit: number
  usagePercentage: number
  status: 'active' | 'inactive' | 'loading'
  actions?: ReactNode
}

export function CreditCardMini({ 
  availableCredit, 
  totalLimit, 
  usagePercentage, 
  status,
  actions 
}: CreditCardMiniProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-gray-400'
      case 'loading': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Active'
      case 'inactive': return 'Inactive'
      case 'loading': return 'Loading'
      default: return 'Unknown'
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6B53FF] via-[#7C5DFF] to-[#FEA611] p-6 text-white shadow-2xl">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/pagentmoney_p_logo.png" alt="Pagent" className="w-6 h-6" />
              <span className="text-sm font-medium opacity-90">Pagent Credits</span>
            </div>
            <p className="text-xs opacity-70">Allowance, Not Custody</p>
          </div>
          
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${status === 'active' ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-medium opacity-90">{getStatusText()}</span>
          </div>
        </div>

        {/* Available credit */}
        <div className="mb-4">
          <p className="text-sm opacity-80 mb-1">Available Credit</p>
          <p className="text-3xl font-bold tracking-tight">
            {formatCurrency(availableCredit)}
          </p>
          <p className="text-sm opacity-70 mt-1">
            of {formatCurrency(totalLimit)} total
          </p>
        </div>

        {/* Usage progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2 opacity-80">
            <span>Usage</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white to-white/80 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
