import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { SecureAPI } from '../lib/secure-auth'
import type { Receipt } from '../types'

interface UseReceiptsParams {
  autoRefresh?: boolean
  refreshInterval?: number
  status?: string
  merchant?: string
  limit?: number
}

/**
 * Hook for managing receipts and transaction history
 * 管理收据和交易历史的 Hook
 */
export function useReceipts(params: UseReceiptsParams = {}) {
  const { address } = useAccount()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<any>(null)
  const [offset, setOffset] = useState(0)

  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    status,
    merchant,
    limit = 20,
  } = params

  /**
   * Load receipts for the connected account
   * 为连接的账户加载收据
   */
  const loadReceipts = useCallback(async (
    loadOffset = 0,
    append = false
  ) => {
    if (!address) {
      setReceipts([])
      setTotal(0)
      setSummary(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem('pagent_token')
      if (!token) return
      
      const params: Record<string, string> = {}
      if (status) params.status = status
      if (merchant) params.merchant = merchant
      params.limit = limit.toString()
      params.offset = loadOffset.toString()
      params.type = 'all'
      
      const result = await SecureAPI.getTransactions(token, params)

      if (result.success) {
        const transactions = result.data?.transactions || []
        if (append) {
          setReceipts(prev => [...prev, ...transactions])
        } else {
          setReceipts(transactions)
        }
        
        const pagination = result.data?.pagination || {}
        setHasMore(pagination.has_more || false)
        setTotal(pagination.total || 0)
        setSummary(result.data?.summary || null)
        setOffset(loadOffset + transactions.length)
      } else {
        setError('Failed to load receipts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [address, status, merchant, limit])

  /**
   * Load more receipts (pagination)
   * 加载更多收据（分页）
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await loadReceipts(offset, true)
  }, [hasMore, loading, offset, loadReceipts])

  /**
   * Refresh receipts (reload from beginning)
   * 刷新收据（从头重新加载）
   */
  const refresh = useCallback(async () => {
    setOffset(0)
    await loadReceipts(0, false)
  }, [loadReceipts])

  /**
   * Get receipts by status
   * 按状态获取收据
   */
  const getReceiptsByStatus = useCallback((targetStatus: string) => {
    return receipts.filter(receipt => receipt.status === targetStatus)
  }, [receipts])

  /**
   * Get recent receipts (last 7 days)
   * 获取最近的收据（最近7天）
   */
  const getRecentReceipts = useCallback(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    return receipts.filter(receipt => 
      new Date(receipt.created_at) >= sevenDaysAgo
    )
  }, [receipts])

  /**
   * Format receipt amount for display
   * 格式化收据金额以供显示
   */
  const formatAmount = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }, [])

  /**
   * Get status color for UI
   * 获取UI的状态颜色
   */
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'pending':
        return 'text-yellow-600'
      case 'failed':
        return 'text-red-600'
      case 'reversed':
        return 'text-gray-600'
      default:
        return 'text-gray-400'
    }
  }, [])

  /**
   * Format status for display
   * 格式化状态以供显示
   */
  const formatStatus = useCallback((status: string): string => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'pending':
        return 'Pending'
      case 'failed':
        return 'Failed'
      case 'reversed':
        return 'Reversed'
      default:
        return 'Unknown'
    }
  }, [])

  // Load receipts when dependencies change
  // 当依赖项更改时加载收据
  useEffect(() => {
    setOffset(0)
    loadReceipts(0, false)
  }, [loadReceipts])

  // Set up real-time subscription
  // 设置实时订阅
  useEffect(() => {
    if (!address) return

    // Subscribe to real-time updates
    // TODO: Implement real-time subscription
    // const channel = PagentApi.subscribeToReceipts(userId, (receipt) => {
    //   setReceipts(prev => [receipt, ...prev])
    // })

    // return () => {
    //   PagentApi.unsubscribe(channel)
    // }
  }, [address])

  // Set up auto-refresh
  // 设置自动刷新
  useEffect(() => {
    if (!autoRefresh || !address) return

    const interval = setInterval(refresh, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, address, refresh])

  return {
    receipts,
    loading,
    error,
    hasMore,
    total,
    summary,
    loadReceipts,
    loadMore,
    refresh,
    getReceiptsByStatus,
    getRecentReceipts,
    formatAmount,
    getStatusColor,
    formatStatus,
  }
}
