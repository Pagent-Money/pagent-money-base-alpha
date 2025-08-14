'use client'

import { useState } from 'react'
import { useAccount, useSignTypedData } from 'wagmi'
import { useSpendPermissions } from '../hooks/useSpendPermissions'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { formatCurrency, formatDate } from '../lib/utils'
import { 
  USDC_ADDRESS_BASE, 
  SPEND_PERMISSION_PERIODS, 
  DEFAULT_CREDIT_LIMITS,
  type SpendPermissionData 
} from '../types'
import { Settings, Plus, X, Clock, Shield, AlertTriangle } from 'lucide-react'

/**
 * Permission manager for creating and managing spend permissions
 * Component for creating and managing spend permissions with user-friendly interface
 */
export function PermissionManager() {
  const { address } = useAccount()
  const { permissions, activePermission, createPermission, revokePermission, loading } = useSpendPermissions()
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Active Permission Status */}
      {activePermission ? (
        <ActivePermissionCard 
          permission={activePermission} 
          onRevoke={revokePermission}
          loading={loading}
        />
      ) : (
        <NoPermissionCard onCreateNew={() => setShowCreateForm(true)} />
      )}

      {/* Create Permission Form */}
      {showCreateForm && (
        <CreatePermissionForm
          onSubmit={createPermission}
          onCancel={() => setShowCreateForm(false)}
          loading={loading}
        />
      )}

      {/* Permission History */}
      {permissions.length > 0 && (
        <PermissionHistory permissions={permissions} />
      )}
    </div>
  )
}

/**
 * Active permission display card
 * Card component displaying active spend permission details and controls
 */
function ActivePermissionCard({ 
  permission, 
  onRevoke, 
  loading 
}: {
  permission: any
  onRevoke: (id: string) => Promise<{ success: boolean; error?: string }>
  loading: boolean
}) {
  const [revoking, setRevoking] = useState(false)

  const handleRevoke = async () => {
    setRevoking(true)
    try {
      await onRevoke(permission.id)
    } finally {
      setRevoking(false)
    }
  }

  const isExpired = new Date(permission.end_timestamp) <= new Date()

  return (
    <Card className={isExpired ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Active Spend Permission</span>
          </CardTitle>
          {isExpired && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              Expired
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Credit Limit</p>
            <p className="text-lg font-semibold">{formatCurrency(permission.cap_amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="text-lg font-semibold">
              {permission.period_seconds === SPEND_PERMISSION_PERIODS.WEEKLY ? 'Weekly' :
               permission.period_seconds === SPEND_PERMISSION_PERIODS.DAILY ? 'Daily' :
               permission.period_seconds === SPEND_PERMISSION_PERIODS.MONTHLY ? 'Monthly' : 
               'Custom'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Valid Until</p>
          <p className="text-sm font-medium">{formatDate(permission.end_timestamp)}</p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleRevoke}
            disabled={revoking || loading}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {revoking ? 'Revoking...' : 'Revoke Permission'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * No permission state card
 * 无权限状态卡
 */
function NoPermissionCard({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <Card className="overflow-hidden relative group hover:shadow-xl transition-all duration-300 border-0">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 opacity-50" />
      <CardContent className="relative text-center py-10">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center relative">
            <Settings className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Assign Your Credit Line
        </h3>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Set up your spending limit to unlock seamless payments with Pagent Credits
        </p>
        <button
          onClick={onCreateNew}
          className="group relative inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Assign Credits</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
        </button>
      </CardContent>
    </Card>
  )
}

/**
 * Create permission form
 * 创建权限表单
 */
function CreatePermissionForm({
  onSubmit,
  onCancel,
  loading
}: {
  onSubmit: (permission: SpendPermissionData, signature: string) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  loading: boolean
}) {
  const { address } = useAccount()
  const { signTypedData } = useSignTypedData()
  const [selectedLimit, setSelectedLimit] = useState<number>(DEFAULT_CREDIT_LIMITS[1].value)
  const [selectedPeriod, setSelectedPeriod] = useState(SPEND_PERMISSION_PERIODS.WEEKLY)
  const [customLimit, setCustomLimit] = useState('')
  const [useCustomLimit, setUseCustomLimit] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleSubmit = async () => {
    if (!address) return

    setCreating(true)
    try {
      const limitAmount = useCustomLimit ? parseFloat(customLimit) : selectedLimit
      
      if (!limitAmount || limitAmount <= 0) {
        alert('Please enter a valid credit limit')
        return
      }

      const now = Math.floor(Date.now() / 1000)
      const endTime = now + selectedPeriod

      const permissionData: SpendPermissionData = {
        token: USDC_ADDRESS_BASE,
        cap: limitAmount * 1e6, // Convert to USDC decimals
        period: selectedPeriod,
        start: now,
        end: endTime,
        spender: process.env.NEXT_PUBLIC_SPENDER_ADDRESS || '0x0000000000000000000000000000000000000000'
      }

      // TODO: Implement proper EIP-712 signing for spend permissions
      // This would use the actual spend permission format from Base
      // 实现支出权限的正确 EIP-712 签名
      // 这将使用 Base 的实际支出权限格式
      const signature = 'mock_signature_' + Date.now()

      const result = await onSubmit(permissionData, signature)
      
      if (result.success) {
        onCancel()
      } else {
        alert(result.error || 'Failed to create permission')
      }
    } catch (error) {
      console.error('Error creating permission:', error)
      alert('Failed to create permission')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="overflow-hidden relative border-0 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 opacity-50" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Assign Your Credit Line
          </CardTitle>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Credit Limit Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Credit Limit</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {DEFAULT_CREDIT_LIMITS.map((limit) => (
              <button
                key={limit.value}
                onClick={() => {
                  setSelectedLimit(limit.value)
                  setUseCustomLimit(false)
                }}
                className={`p-2 text-sm border rounded-md transition-colors ${
                  !useCustomLimit && selectedLimit === limit.value
                    ? 'border-pagent-primary bg-pagent-primary/10 text-pagent-primary'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {limit.label}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="custom-limit"
              checked={useCustomLimit}
              onChange={(e) => setUseCustomLimit(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="custom-limit" className="text-sm">Custom amount</label>
          </div>
          {useCustomLimit && (
            <input
              type="number"
              value={customLimit}
              onChange={(e) => setCustomLimit(e.target.value)}
              placeholder="Enter amount"
              className="pagent-input mt-2 w-full"
              min="1"
              max="10000"
            />
          )}
        </div>

        {/* Period Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Reset Period</label>
          <div className="space-y-2">
            {[
              { value: SPEND_PERMISSION_PERIODS.DAILY, label: 'Daily', desc: 'Resets every 24 hours' },
              { value: SPEND_PERMISSION_PERIODS.WEEKLY, label: 'Weekly', desc: 'Resets every 7 days' },
              { value: SPEND_PERMISSION_PERIODS.MONTHLY, label: 'Monthly', desc: 'Resets every 30 days' },
            ].map((period) => (
              <label key={period.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="period"
                  value={period.value}
                  checked={selectedPeriod === period.value}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="text-pagent-primary"
                />
                <div>
                  <p className="font-medium">{period.label}</p>
                  <p className="text-sm text-muted-foreground">{period.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Important</p>
              <p className="text-yellow-700 mt-1">
                This permission allows merchants to charge up to your credit limit without additional signatures. 
                You can revoke it at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 pagent-button-secondary"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 pagent-button-primary"
            disabled={creating || loading}
          >
            {creating ? 'Creating...' : 'Create Permission'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Permission history list
 * 权限历史列表
 */
function PermissionHistory({ permissions }: { permissions: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Permission History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {permissions.map((permission) => (
            <div
              key={permission.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{formatCurrency(permission.cap_amount)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(permission.created_at)}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  permission.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : permission.status === 'revoked'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {permission.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
