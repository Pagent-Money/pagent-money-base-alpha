'use client'

import { useState } from 'react'
import { useReceipts } from '../hooks/useReceipts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { formatCurrency, formatRelativeTime } from '../lib/utils'
import { etherscanClient } from '../lib/etherscan'
import { Receipt, ExternalLink, Filter, Search, RefreshCw } from 'lucide-react'
import { useChainConfig } from '../hooks/useChainConfig'

/**
 * Receipts list component showing transaction history
 * Displays transaction records with purchase details, merchant info, and status
 */
export function ReceiptsList() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [merchantFilter, setMerchantFilter] = useState('')
  const { chain } = useChainConfig()
  
  const {
    receipts,
    loading,
    error,
    hasMore,
    summary,
    loadMore,
    refresh,
    formatAmount,
    getStatusColor,
    formatStatus,
  } = useReceipts({
    status: statusFilter || undefined,
    merchant: merchantFilter || undefined,
  })

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{summary.total_count}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</p>
                </div>
                <Receipt className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Transaction History</span>
            </CardTitle>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search merchants..."
                  value={merchantFilter}
                  onChange={(e) => setMerchantFilter(e.target.value)}
                  className="pagent-input pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pagent-input"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Receipts List */}
          <div className="space-y-3">
            {receipts.length === 0 && !loading ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
                <p className="text-muted-foreground">
                  {statusFilter || merchantFilter 
                    ? 'No transactions match your filters'
                    : 'Your transaction history will appear here'
                  }
                </p>
              </div>
            ) : (
              receipts.map((receipt) => (
                <ReceiptCard key={receipt.id} receipt={receipt} />
              ))
            )}
          </div>

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                className="pagent-button-secondary"
              >
                Load More
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-pagent-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading transactions...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Individual receipt card component
 * Renders a single transaction receipt with status, amount, and merchant details
 */
function ReceiptCard({ receipt }: { receipt: any }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'pending':
        return '⏳'
      case 'failed':
        return '❌'
      case 'reversed':
        return '↩️'
      default:
        return '❓'
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{getStatusIcon(receipt.status)}</span>
            <h3 className="font-medium">{receipt.merchant}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full status-${receipt.status}`}>
              {receipt.status}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatRelativeTime(receipt.created_at)}</span>
            {receipt.chain_tx && (
              <a
                href={etherscanClient.getExplorerUrl(receipt.chain_tx, chain.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <span>View on Basescan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-semibold">{formatCurrency(receipt.amount)}</p>
          <p className="text-xs text-muted-foreground">
            {receipt.auth_id.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Additional Details */}
      {receipt.metadata && Object.keys(receipt.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Transaction Details
            </summary>
            <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(receipt.metadata, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
