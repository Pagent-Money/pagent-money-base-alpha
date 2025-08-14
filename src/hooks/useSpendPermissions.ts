import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { SecureAPI } from '../lib/secure-auth'
import type { SpendPermission, SpendPermissionData } from '../types'

/**
 * Hook for managing spend permissions
 * Manages spend permissions for Base Smart Accounts with USDC allowances
 */
export function useSpendPermissions() {
  const { address } = useAccount()
  const [permissions, setPermissions] = useState<SpendPermission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get current active permission
  // Get currently active spend permission for the connected account
  const activePermission = permissions.find(p => 
    p.status === 'active' && 
    new Date(p.end_timestamp) > new Date()
  )

  /**
   * Load permissions for the connected account
   * 为连接的账户加载权限
   */
  const loadPermissions = useCallback(async () => {
    if (!address) {
      setPermissions([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem('pagent_token')
      if (!token) return
      
      const result = await SecureAPI.getCredits(token)
      
      if (result.success && result.data?.permissions) {
        setPermissions(result.data.permissions)
      } else {
        setError(result.error || 'Failed to load permissions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [address])

  /**
   * Create a new spend permission
   * 创建新的支出权限
   */
  const createPermission = useCallback(async (
    permissionData: SpendPermissionData,
    signature: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!address) {
      return { success: false, error: 'No wallet connected' }
    }

    setLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem('pagent_token')
      if (!token) throw new Error('Not authenticated')
      
      const result = await SecureAPI.createPermission(token, {
        permission: permissionData,
        signature
      })

      if (result.success) {
        // Reload permissions to get the updated list
        await loadPermissions()
        return { success: true }
      } else {
        const errorMsg = result.error || 'Failed to create permission'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [address, loadPermissions])

  /**
   * Revoke a spend permission
   * 撤销支出权限
   */
  const revokePermission = useCallback(async (
    permissionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!address) {
      return { success: false, error: 'No wallet connected' }
    }

    setLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem('pagent_token')
      if (!token) throw new Error('Not authenticated')
      
      // TODO: Implement revoke permission in secure API
      const result = await SecureAPI.createPermission(token, {
        action: 'revoke',
        permissionId
      })

      if (result.success) {
        // Update local state immediately
        setPermissions(prev => 
          prev.map(p => 
            p.id === permissionId 
              ? { ...p, status: 'revoked' as const }
              : p
          )
        )
        return { success: true }
      } else {
        const errorMsg = result.error || 'Failed to revoke permission'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [address])

  /**
   * Check if permission is expired
   * 检查权限是否已过期
   */
  const isPermissionExpired = useCallback((permission: SpendPermission): boolean => {
    return new Date(permission.end_timestamp) <= new Date()
  }, [])

  /**
   * Get remaining time for a permission
   * 获取权限的剩余时间
   */
  const getRemainingTime = useCallback((permission: SpendPermission): number => {
    const endTime = new Date(permission.end_timestamp).getTime()
    const now = Date.now()
    return Math.max(0, endTime - now)
  }, [])

  /**
   * Format remaining time as human readable string
   * 将剩余时间格式化为人类可读的字符串
   */
  const formatRemainingTime = useCallback((permission: SpendPermission): string => {
    const remaining = getRemainingTime(permission)
    
    if (remaining === 0) return 'Expired'

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }, [getRemainingTime])

  // Load permissions when account changes
  // 当账户更改时加载权限
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  return {
    permissions,
    activePermission,
    loading,
    error,
    createPermission,
    revokePermission,
    loadPermissions,
    isPermissionExpired,
    getRemainingTime,
    formatRemainingTime,
  }
}
