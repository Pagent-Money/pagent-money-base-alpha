import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return formatDate(date)
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)

  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Etherscan multichain explorer URLs
const EXPLORER_CONFIGS = {
  1: 'https://etherscan.io/tx/',           // Ethereum
  8453: 'https://basescan.org/tx/',       // Base
  84532: 'https://sepolia.basescan.org/tx/', // Base Sepolia
  137: 'https://polygonscan.com/tx/',     // Polygon
  42161: 'https://arbiscan.io/tx/',       // Arbitrum
  10: 'https://optimistic.etherscan.io/tx/', // Optimism
}

export function getExplorerUrl(txHash: string, chainId: number = 8453): string {
  const explorerUrl = EXPLORER_CONFIGS[chainId as keyof typeof EXPLORER_CONFIGS]
  if (!explorerUrl) {
    console.warn(`No explorer configured for chain ID ${chainId}, falling back to Base`)
    return `${EXPLORER_CONFIGS[8453]}${txHash}`
  }
  return `${explorerUrl}${txHash}`
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function generateAuthId(): string {
  return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
