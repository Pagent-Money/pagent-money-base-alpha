'use client'

import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/Card'
import { Button } from './ui/Button'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '../lib/utils'

interface CreatePermissionModalProps {
  onClose: () => void
  onSuccess: (data: any) => void
}

export function CreatePermissionModal({ onClose, onSuccess }: CreatePermissionModalProps) {
  const { address } = useAccount()
  const { signMessage, isPending: isSigning } = useSignMessage()
  
  const [step, setStep] = useState<'form' | 'signing' | 'creating'>('form')
  const [mode, setMode] = useState<'recurring' | 'topup'>('recurring')
  const [creditAmount, setCreditAmount] = useState('45')
  const [period, setPeriod] = useState('604800') // 1 week
  const [error, setError] = useState('')

  const periodOptions = [
    { value: '604800', label: 'Weekly' },
    { value: '2592000', label: 'Monthly' },
  ]

  const getAmountRange = () => {
    return mode === 'recurring' ? { min: 10, max: 500 } : { min: 10, max: 800 }
  }

  const getDefaultAmount = () => {
    return mode === 'recurring' ? '45' : '100'
  }

  const handleSubmit = async () => {
    if (!address) return
    
    setError('')
    setStep('signing')
    
    try {
      const amountRange = getAmountRange()
      const amount = Number(creditAmount)
      
      if (amount < amountRange.min || amount > amountRange.max) {
        throw new Error(`Amount must be between $${amountRange.min} and $${amountRange.max}`)
      }
      
      // Create message to sign
      const modeText = mode === 'recurring' ? 'Recurring Credits' : 'Top-up Credits'
      const periodText = mode === 'recurring' ? periodOptions.find(p => p.value === period)?.label : 'One-time'
      const message = `Assign Spend Credits\n\nAddress: ${address}\nMode: ${modeText}\nAmount: $${creditAmount} USDC\nPeriod: ${periodText}\nTimestamp: ${Date.now()}`
      
      // Request signature
      const signature = await signMessage({ message })
      
      setStep('creating')
      
      // Create permission via API
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          creditLimit: amount * 100, // Convert to cents
          period: mode === 'recurring' ? Number(period) : 0, // 0 for one-time top-up
          mode,
          signature
        })
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to assign credits')
      }
      
      onSuccess(result.data)
      onClose()
      
    } catch (err: any) {
      setError(err.message || 'Failed to assign credits')
      setStep('form')
    }
  }

  // Update amount when mode changes
  const handleModeChange = (newMode: 'recurring' | 'topup') => {
    setMode(newMode)
    setCreditAmount(getDefaultAmount())
    if (newMode === 'topup') {
      setPeriod('0') // No period for top-up
    } else {
      setPeriod('604800') // Weekly default for recurring
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] border-0 shadow-2xl rounded-3xl flex flex-col overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assign Spend Credits</CardTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 overflow-y-auto">
          {step === 'form' && (
            <>
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Credit Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('recurring')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      mode === 'recurring'
                        ? 'bg-[#6B53FF] text-white border-[#6B53FF]'
                        : 'border-gray-300 hover:border-[#6B53FF]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Recurring</div>
                      <div className="text-xs opacity-80">Weekly/Monthly</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('topup')}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      mode === 'topup'
                        ? 'bg-[#6B53FF] text-white border-[#6B53FF]'
                        : 'border-gray-300 hover:border-[#6B53FF]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Top-up</div>
                      <div className="text-xs opacity-80">One-time</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {mode === 'recurring' ? 'Recurring Amount' : 'Top-up Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full pl-8 pr-16 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B53FF]"
                    placeholder={getDefaultAmount()}
                    min={getAmountRange().min}
                    max={getAmountRange().max}
                    step="5"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">USDC</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === 'recurring' 
                    ? `$${getAmountRange().min} - $${getAmountRange().max} USDC (Default: $45)`
                    : `$${getAmountRange().min} - $${getAmountRange().max} USDC (Max lifetime: $800)`
                  }
                </p>
              </div>

              {/* Period Selection (only for recurring) */}
              {mode === 'recurring' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B53FF]"
                  >
                    {periodOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">About Spend Credits</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      {mode === 'recurring' 
                        ? `You'll authorize ${formatCurrency(Number(creditAmount))} USDC ${periodOptions.find(p => p.value === period)?.label.toLowerCase()} recurring credits. This enables gasless transactions while keeping your funds secure.`
                        : `You'll assign a one-time ${formatCurrency(Number(creditAmount))} USDC credit top-up. You can add more credits anytime up to $800 total.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'signing' && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[#6B53FF] border-t-transparent rounded-full mx-auto mb-4" />
              <h3 className="font-medium mb-2">Sign Message</h3>
              <p className="text-sm text-muted-foreground">
                Please sign the message in your wallet to assign the spend credits.
              </p>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[#6B53FF] border-t-transparent rounded-full mx-auto mb-4" />
              <h3 className="font-medium mb-2">Assigning Credits</h3>
              <p className="text-sm text-muted-foreground">
                Setting up your spend credits...
              </p>
            </div>
          )}
        </CardContent>
        {step === 'form' && (
          <CardFooter className="gap-3 border-t">
            <Button
              onClick={handleSubmit}
              disabled={!creditAmount || Number(creditAmount) < getAmountRange().min || Number(creditAmount) > getAmountRange().max}
              className="flex-1 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] text-white"
            >
              Assign Credits
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
