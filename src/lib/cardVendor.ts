/**
 * Card vendor integration for virtual card issuance and management
 * 虚拟卡发行和管理的卡供应商集成
 * 
 * This is a sandbox implementation for demonstration purposes.
 * In production, you would integrate with actual card vendor APIs like:
 * - Marqeta
 * - Unit
 * - Bond
 * - Privacy.com
 * - Column
 * 
 * 这是用于演示目的的沙盒实现。
 * 在生产中，您将与实际的卡供应商 API 集成，例如：
 * - Marqeta
 * - Unit  
 * - Bond
 * - Privacy.com
 * - Column
 */

export interface VirtualCard {
  id: string
  user_id: string
  card_number: string // Masked in production
  exp_month: string
  exp_year: string
  cvv: string // Only shown once in production
  status: 'active' | 'inactive' | 'blocked' | 'expired'
  spending_limit: number
  created_at: string
  metadata?: Record<string, any>
}

export interface CardTransaction {
  id: string
  card_id: string
  auth_id: string
  amount: number
  merchant_name: string
  merchant_category: string
  status: 'pending' | 'authorized' | 'declined' | 'settled' | 'reversed'
  timestamp: string
  metadata?: Record<string, any>
}

export interface CreateCardRequest {
  user_id: string
  spending_limit: number
  metadata?: Record<string, any>
}

export interface CardAuthRequest {
  card_id: string
  amount: number
  merchant_name: string
  merchant_category?: string
  metadata?: Record<string, any>
}

/**
 * Sandbox card vendor implementation
 * 沙盒卡供应商实现
 */
export class SandboxCardVendor {
  private static instance: SandboxCardVendor
  private cards: Map<string, VirtualCard> = new Map()
  private transactions: Map<string, CardTransaction> = new Map()
  private webhookUrl: string

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl
  }

  static getInstance(webhookUrl: string): SandboxCardVendor {
    if (!SandboxCardVendor.instance) {
      SandboxCardVendor.instance = new SandboxCardVendor(webhookUrl)
    }
    return SandboxCardVendor.instance
  }

  /**
   * Create a new virtual card for a user
   * 为用户创建新的虚拟卡
   */
  async createCard(request: CreateCardRequest): Promise<VirtualCard> {
    const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const card: VirtualCard = {
      id: cardId,
      user_id: request.user_id,
      card_number: this.generateCardNumber(),
      exp_month: '12',
      exp_year: '2028',
      cvv: Math.floor(Math.random() * 900 + 100).toString(),
      status: 'active',
      spending_limit: request.spending_limit,
      created_at: new Date().toISOString(),
      metadata: request.metadata
    }

    this.cards.set(cardId, card)
    
    console.log('Created virtual card:', { 
      id: card.id, 
      user_id: card.user_id,
      spending_limit: card.spending_limit 
    })

    return card
  }

  /**
   * Get card details by ID
   * 通过 ID 获取卡详情
   */
  async getCard(cardId: string): Promise<VirtualCard | null> {
    return this.cards.get(cardId) || null
  }

  /**
   * Update card status or spending limit
   * 更新卡状态或支出限制
   */
  async updateCard(
    cardId: string, 
    updates: Partial<Pick<VirtualCard, 'status' | 'spending_limit'>>
  ): Promise<VirtualCard | null> {
    const card = this.cards.get(cardId)
    if (!card) return null

    const updatedCard = { ...card, ...updates }
    this.cards.set(cardId, updatedCard)

    console.log('Updated card:', { cardId, updates })

    return updatedCard
  }

  /**
   * Simulate a card authorization request
   * 模拟卡授权请求
   */
  async authorizeTransaction(request: CardAuthRequest): Promise<CardTransaction> {
    const card = this.cards.get(request.card_id)
    if (!card) {
      throw new Error('Card not found')
    }

    const authId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Determine if transaction should be authorized
    // 确定是否应该授权交易
    let status: CardTransaction['status'] = 'authorized'
    
    if (card.status !== 'active') {
      status = 'declined'
    } else if (request.amount > card.spending_limit) {
      status = 'declined'
    } else if (request.amount <= 0) {
      status = 'declined'
    }

    const transaction: CardTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      card_id: request.card_id,
      auth_id: authId,
      amount: request.amount,
      merchant_name: request.merchant_name,
      merchant_category: request.merchant_category || 'Other',
      status,
      timestamp: new Date().toISOString(),
      metadata: request.metadata
    }

    this.transactions.set(transaction.id, transaction)

    console.log('Created transaction:', {
      id: transaction.id,
      auth_id: authId,
      amount: request.amount,
      merchant: request.merchant_name,
      status
    })

    // Send webhook notification
    // 发送 webhook 通知
    await this.sendWebhook(transaction)

    return transaction
  }

  /**
   * Get transaction by ID
   * 通过 ID 获取交易
   */
  async getTransaction(transactionId: string): Promise<CardTransaction | null> {
    return this.transactions.get(transactionId) || null
  }

  /**
   * Get all transactions for a card
   * 获取卡的所有交易
   */
  async getCardTransactions(cardId: string): Promise<CardTransaction[]> {
    return Array.from(this.transactions.values()).filter(
      txn => txn.card_id === cardId
    )
  }

  /**
   * Simulate settlement of an authorized transaction
   * 模拟已授权交易的结算
   */
  async settleTransaction(transactionId: string): Promise<CardTransaction | null> {
    const transaction = this.transactions.get(transactionId)
    if (!transaction || transaction.status !== 'authorized') {
      return null
    }

    transaction.status = 'settled'
    this.transactions.set(transactionId, transaction)

    console.log('Settled transaction:', transactionId)

    return transaction
  }

  /**
   * Simulate reversal of a transaction
   * 模拟交易的冲正
   */
  async reverseTransaction(transactionId: string): Promise<CardTransaction | null> {
    const transaction = this.transactions.get(transactionId)
    if (!transaction) return null

    transaction.status = 'reversed'
    this.transactions.set(transactionId, transaction)

    console.log('Reversed transaction:', transactionId)

    // Send webhook notification for reversal
    // 为冲正发送 webhook 通知
    await this.sendWebhook(transaction)

    return transaction
  }

  /**
   * Send webhook notification to backend
   * 向后端发送 webhook 通知
   */
  private async sendWebhook(transaction: CardTransaction): Promise<void> {
    try {
      const webhookPayload = {
        card_id: transaction.card_id,
        auth_id: transaction.auth_id,
        amount: transaction.amount,
        merchant: transaction.merchant_name,
        timestamp: transaction.timestamp,
        status: transaction.status === 'authorized' ? 'authorized' : 'declined',
        metadata: {
          transaction_id: transaction.id,
          merchant_category: transaction.merchant_category,
          ...transaction.metadata
        }
      }

      console.log('Sending webhook:', webhookPayload)

      if (this.webhookUrl && typeof window !== 'undefined') {
        // In a real implementation, this would be sent from the card vendor's servers
        // 在实际实现中，这将从卡供应商的服务器发送
        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': this.generateWebhookSignature(JSON.stringify(webhookPayload))
          },
          body: JSON.stringify(webhookPayload)
        })
      }
    } catch (error) {
      console.error('Failed to send webhook:', error)
    }
  }

  /**
   * Generate a mock card number (for demo purposes only)
   * 生成模拟卡号（仅用于演示目的）
   */
  private generateCardNumber(): string {
    // Generate a test card number (starts with 4000 for Visa test cards)
    // 生成测试卡号（以 4000 开头的 Visa 测试卡）
    const prefix = '4000'
    const middle = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
    const last = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${middle}${last}`
  }

  /**
   * Generate webhook signature (simplified for demo)
   * 生成 webhook 签名（为演示简化）
   */
  private generateWebhookSignature(payload: string): string {
    // In production, use HMAC-SHA256 with a secret key
    // 在生产中，使用带有密钥的 HMAC-SHA256
    return `sha256=${Buffer.from(payload).toString('base64')}`
  }

  /**
   * Get all cards (for admin/testing purposes)
   * 获取所有卡（用于管理/测试目的）
   */
  getAllCards(): VirtualCard[] {
    return Array.from(this.cards.values())
  }

  /**
   * Get all transactions (for admin/testing purposes)
   * 获取所有交易（用于管理/测试目的）
   */
  getAllTransactions(): CardTransaction[] {
    return Array.from(this.transactions.values())
  }

  /**
   * Clear all data (for testing)
   * 清除所有数据（用于测试）
   */
  clearAll(): void {
    this.cards.clear()
    this.transactions.clear()
    console.log('Cleared all card vendor data')
  }
}

// Default instance for the app
// 应用程序的默认实例
export const cardVendor = SandboxCardVendor.getInstance(
  process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/card-webhook'
)
