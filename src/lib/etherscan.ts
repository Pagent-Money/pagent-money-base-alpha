/**
 * Etherscan multichain API client for Pagent Money
 * Provides unified blockchain data access across multiple chains
 * 为 Pagent Money 提供 Etherscan 多链 API 客户端
 * 在多个链上提供统一的区块链数据访问
 */

// Chain configurations for Etherscan API
const CHAIN_CONFIGS = {
  1: {
    name: 'Ethereum',
    api: 'https://api.etherscan.io/api',
    explorer: 'https://etherscan.io',
    nativeCurrency: 'ETH'
  },
  8453: {
    name: 'Base',
    api: 'https://api.basescan.org/api',
    explorer: 'https://basescan.org',
    nativeCurrency: 'ETH'
  },
  84532: {
    name: 'Base Sepolia',
    api: 'https://api-sepolia.basescan.org/api',
    explorer: 'https://sepolia.basescan.org',
    nativeCurrency: 'ETH'
  },
  137: {
    name: 'Polygon',
    api: 'https://api.polygonscan.com/api',
    explorer: 'https://polygonscan.com',
    nativeCurrency: 'MATIC'
  },
  42161: {
    name: 'Arbitrum',
    api: 'https://api.arbiscan.io/api',
    explorer: 'https://arbiscan.io',
    nativeCurrency: 'ETH'
  },
  10: {
    name: 'Optimism',
    api: 'https://api-optimistic.etherscan.io/api',
    explorer: 'https://optimistic.etherscan.io',
    nativeCurrency: 'ETH'
  }
} as const

type ChainId = keyof typeof CHAIN_CONFIGS

export interface TransactionStatus {
  hash: string
  status: 'pending' | 'success' | 'failed'
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  from: string
  to: string
  value: string
  timestamp?: number
}

export interface ContractVerificationRequest {
  address: string
  sourceCode: string
  contractName: string
  compilerVersion: string
  optimizationUsed: boolean
  runs?: number
  constructorArguments?: string
}

/**
 * Etherscan multichain API client
 * Etherscan 多链 API 客户端
 */
export class EtherscanClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Get chain configuration
   * 获取链配置
   */
  private getChainConfig(chainId: ChainId) {
    const config = CHAIN_CONFIGS[chainId]
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }
    return config
  }

  /**
   * Make API request to Etherscan
   * 向 Etherscan 发出 API 请求
   */
  private async makeRequest(
    chainId: ChainId, 
    params: Record<string, string>
  ): Promise<any> {
    const config = this.getChainConfig(chainId)
    const url = new URL(config.api)
    
    // Add API key and standard parameters
    const searchParams = new URLSearchParams({
      ...params,
      apikey: this.apiKey
    })

    url.search = searchParams.toString()

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.status === '0' && data.message !== 'No transactions found') {
      throw new Error(`Etherscan API error: ${data.message}`)
    }

    return data
  }

  /**
   * Get transaction status and details
   * 获取交易状态和详情
   */
  async getTransaction(
    txHash: string, 
    chainId: ChainId = 8453
  ): Promise<TransactionStatus | null> {
    try {
      const data = await this.makeRequest(chainId, {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash
      })

      if (!data.result) {
        return null
      }

      const tx = data.result
      
      // Get transaction receipt for status
      const receiptData = await this.makeRequest(chainId, {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: txHash
      })

      const receipt = receiptData.result

      return {
        hash: tx.hash,
        status: receipt ? (receipt.status === '0x1' ? 'success' : 'failed') : 'pending',
        blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : undefined,
        gasUsed: receipt?.gasUsed ? parseInt(receipt.gasUsed, 16).toString() : undefined,
        gasPrice: tx.gasPrice ? parseInt(tx.gasPrice, 16).toString() : undefined,
        from: tx.from,
        to: tx.to,
        value: tx.value ? parseInt(tx.value, 16).toString() : '0',
        timestamp: tx.timestamp ? parseInt(tx.timestamp, 16) : undefined
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return null
    }
  }

  /**
   * Get account transaction history
   * 获取账户交易历史
   */
  async getAccountTransactions(
    address: string,
    chainId: ChainId = 8453,
    page: number = 1,
    offset: number = 20
  ): Promise<TransactionStatus[]> {
    try {
      const data = await this.makeRequest(chainId, {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: '0',
        endblock: '99999999',
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc'
      })

      if (!data.result || !Array.isArray(data.result)) {
        return []
      }

      return data.result.map((tx: any) => ({
        hash: tx.hash,
        status: tx.isError === '0' ? 'success' : 'failed',
        blockNumber: parseInt(tx.blockNumber),
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: parseInt(tx.timeStamp)
      }))
    } catch (error) {
      console.error('Error fetching account transactions:', error)
      return []
    }
  }

  /**
   * Verify smart contract source code
   * 验证智能合约源代码
   */
  async verifyContract(
    request: ContractVerificationRequest,
    chainId: ChainId = 8453
  ): Promise<{ success: boolean; message: string; guid?: string }> {
    try {
      const data = await this.makeRequest(chainId, {
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: request.address,
        sourceCode: request.sourceCode,
        codeformat: 'solidity-single-file',
        contractname: request.contractName,
        compilerversion: request.compilerVersion,
        optimizationUsed: request.optimizationUsed ? '1' : '0',
        runs: request.runs?.toString() || '200',
        constructorArguements: request.constructorArguments || ''
      })

      return {
        success: data.status === '1',
        message: data.message,
        guid: data.result
      }
    } catch (error) {
      console.error('Error verifying contract:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check contract verification status
   * 检查合约验证状态
   */
  async checkVerificationStatus(
    guid: string,
    chainId: ChainId = 8453
  ): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.makeRequest(chainId, {
        module: 'contract',
        action: 'checkverifystatus',
        guid: guid
      })

      return {
        success: data.status === '1',
        message: data.result
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get contract ABI
   * 获取合约 ABI
   */
  async getContractABI(
    address: string,
    chainId: ChainId = 8453
  ): Promise<string | null> {
    try {
      const data = await this.makeRequest(chainId, {
        module: 'contract',
        action: 'getabi',
        address: address
      })

      return data.status === '1' ? data.result : null
    } catch (error) {
      console.error('Error fetching contract ABI:', error)
      return null
    }
  }

  /**
   * Get gas price for a chain
   * 获取链的 gas 价格
   */
  async getGasPrice(chainId: ChainId = 8453): Promise<string | null> {
    try {
      const data = await this.makeRequest(chainId, {
        module: 'proxy',
        action: 'eth_gasPrice'
      })

      return data.result ? parseInt(data.result, 16).toString() : null
    } catch (error) {
      console.error('Error fetching gas price:', error)
      return null
    }
  }

  /**
   * Get explorer URL for transaction
   * 获取交易的浏览器 URL
   */
  getExplorerUrl(txHash: string, chainId: ChainId = 8453): string {
    const config = this.getChainConfig(chainId)
    return `${config.explorer}/tx/${txHash}`
  }

  /**
   * Get explorer URL for address
   * 获取地址的浏览器 URL
   */
  getAddressUrl(address: string, chainId: ChainId = 8453): string {
    const config = this.getChainConfig(chainId)
    return `${config.explorer}/address/${address}`
  }

  /**
   * Get supported chains
   * 获取支持的链
   */
  getSupportedChains(): Array<{ chainId: ChainId; name: string; nativeCurrency: string }> {
    return Object.entries(CHAIN_CONFIGS).map(([chainId, config]) => ({
      chainId: parseInt(chainId) as ChainId,
      name: config.name,
      nativeCurrency: config.nativeCurrency
    }))
  }
}

// Default client instance
// 默认客户端实例
export const etherscanClient = new EtherscanClient(
  process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || 'demo'
)

// Export types and chain configs
export type { ChainId }
export { CHAIN_CONFIGS }
