import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { cardVendor, type VirtualCard, type CardTransaction } from '../lib/cardVendor'
import { SecureAPI } from '../lib/secure-auth'

/**
 * Hook for managing virtual card operations
 * 管理虚拟卡操作的 Hook
 */
export function useVirtualCard() {
  const { address } = useAccount()
  const [card, setCard] = useState<VirtualCard | null>(null)
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load user's virtual card from database and card vendor
   * 从数据库和卡供应商加载用户的虚拟卡
   */
  const loadCard = useCallback(async () => {
    if (!address) {
      setCard(null)
      setTransactions([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get user's card from secure API
      const token = sessionStorage.getItem('pagent_token')
      if (!token) return
      
      const data = await SecureAPI.getCards(token)

      if (data.success && data.data?.cards?.[0]) {
        const userData = data.data.cards[0]
        const cardId = userData.id

        if (cardId) {
          // Load card from vendor
          // 从供应商加载卡
          const cardData = await cardVendor.getCard(cardId)
          if (cardData) {
            setCard(cardData)
            
            // Load transactions
            // 加载交易
            const cardTransactions = await cardVendor.getCardTransactions(cardId)
            setTransactions(cardTransactions)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load card:', err)
      setError(err instanceof Error ? err.message : 'Failed to load card')
    } finally {
      setLoading(false)
    }
  }, [address])

  /**
   * Create a new virtual card for the user
   * 为用户创建新的虚拟卡
   */
  const createCard = useCallback(async (spendingLimit: number): Promise<{
    success: boolean
    error?: string
  }> => {
    if (!address) {
      return { success: false, error: 'No wallet connected' }
    }

    setLoading(true)
    setError(null)

    try {
      // Use secure API to create card
      const token = sessionStorage.getItem('pagent_token')
      if (!token) throw new Error('Not authenticated')
      
      const result = await SecureAPI.createCard(token, spendingLimit)
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to create card')
      }

      // Refresh local state from vendor (optional) and DB
      const created = result.data?.card
      if (created?.id) {
        const vendorCard = await cardVendor.getCard(created.id)
        setCard(vendorCard ?? {
          id: created.id,
          user_id: address,
          card_number: created.card_number,
          exp_month: String(created.expiry_month),
          exp_year: String(created.expiry_year),
          cvv: created.cvv,
          status: created.status === 'frozen' ? 'blocked' : 'active',
          spending_limit: created.credit_limit,
          created_at: created.created_at,
          metadata: { smart_account: address }
        })
      }
      setTransactions([])

      return { success: true }
    } catch (err) {
      console.error('Failed to create card:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to create card'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [address])

  /**
   * Update card spending limit
   * 更新卡支出限制
   */
  const updateSpendingLimit = useCallback(async (newLimit: number): Promise<{
    success: boolean
    error?: string
  }> => {
    if (!card) {
      return { success: false, error: 'No card found' }
    }

    setLoading(true)
    setError(null)

    try {
      const updatedCard = await cardVendor.updateCard(card.id, {
        spending_limit: newLimit
      })

      if (updatedCard) {
        setCard(updatedCard)
        return { success: true }
      } else {
        throw new Error('Failed to update card')
      }
    } catch (err) {
      console.error('Failed to update spending limit:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to update spending limit'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [card])

  /**
   * Block/unblock the card
   * 冻结/解冻卡
   */
  const toggleCardStatus = useCallback(async (): Promise<{
    success: boolean
    error?: string
  }> => {
    if (!card) {
      return { success: false, error: 'No card found' }
    }

    setLoading(true)
    setError(null)

    try {
      const newStatus = card.status === 'active' ? 'blocked' : 'active'
      const updatedCard = await cardVendor.updateCard(card.id, {
        status: newStatus
      })

      if (updatedCard) {
        setCard(updatedCard)
        return { success: true }
      } else {
        throw new Error('Failed to update card status')
      }
    } catch (err) {
      console.error('Failed to toggle card status:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to toggle card status'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [card])

  /**
   * Simulate a card transaction (for demo purposes)
   * 模拟卡交易（用于演示目的）
   */
  const simulateTransaction = useCallback(async (
    amount: number,
    merchantName: string,
    merchantCategory?: string
  ): Promise<{
    success: boolean
    transaction?: CardTransaction
    error?: string
  }> => {
    if (!card) {
      return { success: false, error: 'No card found' }
    }

    setLoading(true)
    setError(null)

    try {
      const transaction = await cardVendor.authorizeTransaction({
        card_id: card.id,
        amount,
        merchant_name: merchantName,
        merchant_category: merchantCategory,
        metadata: {
          simulated: true,
          timestamp: new Date().toISOString()
        }
      })

      // Update local transactions
      // 更新本地交易
      setTransactions(prev => [transaction, ...prev])

      return { success: true, transaction }
    } catch (err) {
      console.error('Failed to simulate transaction:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to simulate transaction'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [card])

  /**
   * Format card number for display (masked)
   * 格式化卡号以供显示（掩码）
   */
  const getDisplayCardNumber = useCallback((): string => {
    if (!card) return ''
    const cardNumber = card.card_number
    return `**** **** **** ${cardNumber.slice(-4)}`
  }, [card])

  /**
   * Get card status color for UI
   * 获取UI的卡状态颜色
   */
  const getStatusColor = useCallback((): string => {
    if (!card) return 'text-gray-400'
    
    switch (card.status) {
      case 'active':
        return 'text-green-600'
      case 'blocked':
        return 'text-red-600'
      case 'inactive':
        return 'text-yellow-600'
      case 'expired':
        return 'text-gray-600'
      default:
        return 'text-gray-400'
    }
  }, [card])

  // Load card when account changes
  // 当账户更改时加载卡
  useEffect(() => {
    loadCard()
  }, [loadCard])

  return {
    card,
    transactions,
    loading,
    error,
    createCard,
    updateSpendingLimit,
    toggleCardStatus,
    simulateTransaction,
    loadCard,
    getDisplayCardNumber,
    getStatusColor,
  }
}
