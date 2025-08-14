'use client'

import { useAccount } from 'wagmi'
import { useSpendPermissions } from '../hooks/useSpendPermissions'
import { useReceipts } from '../hooks/useReceipts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { formatCurrency, formatDuration } from '../lib/utils'
import { CreditCard, Clock, TrendingUp, AlertCircle, Plus, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Credit dashboard showing spending limits, usage, and status
 * Displays real-time credit information, transaction history, and account management
 */
export function CreditDashboard({ onAssignCredits }: { onAssignCredits?: () => void }) {
  const { address } = useAccount()
  const { activePermission, formatRemainingTime } = useSpendPermissions()
  const { summary } = useReceipts({ status: 'completed' })
  const [currentUsage, setCurrentUsage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate current period usage with animation
  // 计算当前期间使用情况并添加动画
  useEffect(() => {
    if (activePermission && summary) {
      // In a real implementation, this would calculate usage for the current period
      // 在实际实现中，这将计算当前期间的使用情况
      const newUsage = summary.completed_amount || 0
      if (newUsage !== currentUsage) {
        setIsAnimating(true)
        setCurrentUsage(newUsage)
        setTimeout(() => setIsAnimating(false), 500)
      }
    }
  }, [activePermission, summary, currentUsage])

  if (!address) {
    return null
  }

  const hasActivePermission = !!activePermission
  const remainingCredit = hasActivePermission 
    ? Math.max(0, (activePermission.cap_amount || 0) - currentUsage)
    : 0
  const usagePercentage = hasActivePermission 
    ? Math.min(100, (currentUsage / (activePermission.cap_amount || 1)) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Main Credit Card */}
      <Card className="overflow-hidden relative group hover:shadow-2xl transition-all duration-500 border-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        <CardContent className="relative p-8 text-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">Available Credit</p>
              <p className={`text-4xl font-bold tracking-tight ${isAnimating ? 'animate-pulse' : ''}`}>
                {hasActivePermission ? formatCurrency(remainingCredit) : '$0.00'}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
              <CreditCard className="w-10 h-10 text-white relative" />
            </div>
          </div>

          {hasActivePermission ? (
            <div className="space-y-6">
              {/* Enhanced Usage Bar */}
              <div>
                <div className="flex justify-between text-sm text-white/90 mb-3 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Used: {formatCurrency(currentUsage)}
                  </span>
                  <span>Limit: {formatCurrency(activePermission.cap_amount)}</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-white/20 backdrop-blur rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-white to-white/80 rounded-full h-3 transition-all duration-700 ease-out relative overflow-hidden"
                      style={{ width: `${usagePercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  <div className="absolute -top-1 transition-all duration-700 ease-out" style={{ left: `${usagePercentage}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-5 h-5 bg-white rounded-full shadow-lg border-2 border-white/50" />
                  </div>
                </div>
              </div>

              {/* Enhanced Permission Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-white/80" />
                  <span className="text-sm font-medium text-white/90">Resets in {formatRemainingTime(activePermission)}</span>
                </div>
                <div className="flex items-center space-x-2 bg-green-500/20 backdrop-blur rounded-lg px-3 py-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  </div>
                  <span className="text-sm font-medium text-white/90">Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                <AlertCircle className="w-12 h-12 text-white/80 relative" />
              </div>
              <p className="text-white/90 font-medium mb-2">No Active Credit Line</p>
              <p className="text-white/70 text-sm max-w-xs mx-auto mb-6">
                Set up your credit limit to start using Pagent Credits for seamless payments
              </p>
              {onAssignCredits && (
                <button
                  onClick={onAssignCredits}
                  className="group relative inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Assign Credits</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Stats Grid or Quick Setup */}
      {hasActivePermission ? (
        <div className="grid grid-cols-2 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-background to-secondary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-green-500 rounded-full" />
                This Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{summary?.completed_count || 0}</p>
                  <p className="text-xs text-muted-foreground font-medium">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-background to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(summary?.completed_amount || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">This period</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 animate-pulse" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-lg animate-pulse" />
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full relative">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-indigo-800 dark:text-indigo-200 mb-1">
                    Quick Setup Required
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    Assign credits to activate your spending limit
                  </p>
                </div>
              </div>
              {onAssignCredits && (
                <button
                  onClick={onAssignCredits}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                >
                  Get Started
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Usage Insights */}
      {hasActivePermission && usagePercentage > 80 && (
        <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 animate-pulse" />
          <CardContent className="p-5 relative">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-lg animate-pulse" />
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg relative">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Approaching Credit Limit
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    You've used {usagePercentage.toFixed(0)}% of your available credit
                  </p>
                  <div className="flex-1 max-w-[100px]">
                    <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full h-1.5 transition-all duration-300"
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}