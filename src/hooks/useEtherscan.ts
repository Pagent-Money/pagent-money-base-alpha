import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { etherscanClient, type TransactionStatus, type ChainId } from '../lib/etherscan'

/**
 * Hook for Etherscan API integration
 * 用于 Etherscan API 集成的 Hook
 */
export function useEtherscan() {
  const { address, chainId } = useAccount()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get transaction details from Etherscan
   * 从 Etherscan 获取交易详情
   */
  const getTransaction = useCallback(async (
    txHash: string,
    targetChainId?: number
  ): Promise<TransactionStatus | null> => {
    setLoading(true)
    setError(null)

    try {
      const chain = (targetChainId || chainId || 84532) as ChainId
      const transaction = await etherscanClient.getTransaction(txHash, chain)
      return transaction
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch transaction'
      setError(errorMsg)
      return null
    } finally {
      setLoading(false)
    }
  }, [chainId])

  /**
   * Get account transaction history from Etherscan
   * 从 Etherscan 获取账户交易历史
   */
  const getAccountTransactions = useCallback(async (
    accountAddress?: string,
    targetChainId?: number,
    page: number = 1,
    limit: number = 20
  ): Promise<TransactionStatus[]> => {
    const account = accountAddress || address
    if (!account) return []

    setLoading(true)
    setError(null)

    try {
      const chain = (targetChainId || chainId || 84532) as ChainId
      const transactions = await etherscanClient.getAccountTransactions(
        account,
        chain,
        page,
        limit
      )
      return transactions
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch transactions'
      setError(errorMsg)
      return []
    } finally {
      setLoading(false)
    }
  }, [address, chainId])

  /**
   * Verify a smart contract
   * 验证智能合约
   */
  const verifyContract = useCallback(async (
    contractAddress: string,
    sourceCode: string,
    contractName: string,
    compilerVersion: string,
    optimizationUsed: boolean = true,
    runs: number = 200,
    constructorArgs?: string,
    targetChainId?: number
  ): Promise<{ success: boolean; message: string; guid?: string }> => {
    setLoading(true)
    setError(null)

    try {
      const chain = (targetChainId || chainId || 84532) as ChainId
      const result = await etherscanClient.verifyContract(
        {
          address: contractAddress,
          sourceCode,
          contractName,
          compilerVersion,
          optimizationUsed,
          runs,
          constructorArguments: constructorArgs
        },
        chain
      )
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to verify contract'
      setError(errorMsg)
      return { success: false, message: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [chainId])

  /**
   * Get contract ABI
   * 获取合约 ABI
   */
  const getContractABI = useCallback(async (
    contractAddress: string,
    targetChainId?: number
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const chain = (targetChainId || chainId || 84532) as ChainId
      const abi = await etherscanClient.getContractABI(contractAddress, chain)
      return abi
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch contract ABI'
      setError(errorMsg)
      return null
    } finally {
      setLoading(false)
    }
  }, [chainId])

  /**
   * Get current gas price
   * 获取当前 gas 价格
   */
  const getGasPrice = useCallback(async (
    targetChainId?: number
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const chain = (targetChainId || chainId || 84532) as ChainId
      const gasPrice = await etherscanClient.getGasPrice(chain)
      return gasPrice
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch gas price'
      setError(errorMsg)
      return null
    } finally {
      setLoading(false)
    }
  }, [chainId])

  /**
   * Get explorer URL for transaction
   * 获取交易的浏览器 URL
   */
  const getTransactionUrl = useCallback((
    txHash: string,
    targetChainId?: number
  ): string => {
    const chain = (targetChainId || chainId || 84532) as ChainId
    return etherscanClient.getExplorerUrl(txHash, chain)
  }, [chainId])

  /**
   * Get explorer URL for address
   * 获取地址的浏览器 URL
   */
  const getAddressUrl = useCallback((
    address: string,
    targetChainId?: number
  ): string => {
    const chain = (targetChainId || chainId || 84532) as ChainId
    return etherscanClient.getAddressUrl(address, chain)
  }, [chainId])

  /**
   * Format transaction status for display
   * 格式化交易状态以供显示
   */
  const formatTransactionStatus = useCallback((status: string): {
    label: string
    color: string
    icon: string
  } => {
    switch (status) {
      case 'success':
        return { label: 'Success', color: 'text-green-600', icon: '✅' }
      case 'failed':
        return { label: 'Failed', color: 'text-red-600', icon: '❌' }
      case 'pending':
        return { label: 'Pending', color: 'text-yellow-600', icon: '⏳' }
      default:
        return { label: 'Unknown', color: 'text-gray-600', icon: '❓' }
    }
  }, [])

  /**
   * Format gas price for display
   * 格式化 gas 价格以供显示
   */
  const formatGasPrice = useCallback((gasPriceWei: string): string => {
    try {
      const gasPriceGwei = parseInt(gasPriceWei) / 1e9
      return `${gasPriceGwei.toFixed(2)} Gwei`
    } catch {
      return 'Unknown'
    }
  }, [])

  /**
   * Get supported chains
   * 获取支持的链
   */
  const getSupportedChains = useCallback(() => {
    return etherscanClient.getSupportedChains()
  }, [])

  return {
    // State
    loading,
    error,
    
    // Transaction methods
    getTransaction,
    getAccountTransactions,
    
    // Contract methods
    verifyContract,
    getContractABI,
    
    // Utility methods
    getGasPrice,
    getTransactionUrl,
    getAddressUrl,
    
    // Formatting helpers
    formatTransactionStatus,
    formatGasPrice,
    
    // Chain info
    getSupportedChains,
  }
}
