'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useSpendPermissions } from '../hooks/useSpendPermissions'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { formatCurrency, generateAuthId } from '../lib/utils'
import { MERCHANT_CATEGORIES } from '../types'
import { Zap, CreditCard, ShoppingCart, Coffee, Car, Gamepad2 } from 'lucide-react'

/**
 * Demo component to simulate usage-based charges using spend permissions
 * 使用支出权限模拟基于使用的收费的演示组件
 */
export function DemoUsageSpender() {
 const { address } = useAccount()
 const { activePermission } = useSpendPermissions()
 const [loading, setLoading] = useState(false)
 const [lastCharge, setLastCharge] = useState<any>(null)

 const demoCharges = [
  {
   merchant: 'Starbucks Coffee',
   amount: 5.75,
   category: 'Restaurants & Food',
   icon: Coffee,
   description: 'Morning coffee and pastry'
  },
  {
   merchant: 'Uber Ride',
   amount: 12.50,
   category: 'Travel',
   icon: Car,
   description: 'Trip to downtown'
  },
  {
   merchant: 'Steam Games',
   amount: 29.99,
   category: 'Entertainment',
   icon: Gamepad2,
   description: 'New indie game purchase'
  },
  {
   merchant: 'Amazon',
   amount: 45.00,
   category: 'Online Shopping',
   icon: ShoppingCart,
   description: 'Household supplies'
  }
 ]

 const simulateCharge = async (charge: any) => {
  if (!address || !activePermission) {
   alert('No active spend permission found')
   return
  }

  setLoading(true)
  try {
   // Simulate API call to card webhook endpoint
   // 模拟对卡 webhook 端点的 API 调用
   const authId = generateAuthId()
   
   const mockWebhookPayload = {
    card_id: 'demo_card_123',
    auth_id: authId,
    amount: charge.amount,
    merchant: charge.merchant,
    timestamp: new Date().toISOString(),
    status: 'authorized',
    metadata: {
     category: charge.category,
     description: charge.description,
     demo: true
    }
   }

   // In a real implementation, this would trigger the webhook
   // 在实际实现中，这将触发 webhook
   console.log('Simulating charge:', mockWebhookPayload)
   
   // Simulate processing delay
   await new Promise(resolve => setTimeout(resolve, 2000))
   
   setLastCharge({
    ...charge,
    authId,
    timestamp: new Date(),
    status: 'completed'
   })

   // Show success message
   alert(`Successfully charged ${formatCurrency(charge.amount)} to ${charge.merchant}!`)
   
  } catch (error) {
   console.error('Demo charge failed:', error)
   alert('Demo charge failed. Please try again.')
  } finally {
   setLoading(false)
  }
 }

 if (!address) {
  return (
   <Card>
    <CardContent className="text-center py-8">
     <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
     <p className="text-muted-foreground">Connect your wallet to try the demo</p>
    </CardContent>
   </Card>
  )
 }

 if (!activePermission) {
  return (
   <Card>
    <CardContent className="text-center py-8">
     <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
     <h3 className="text-lg font-semibold mb-2">No Active Permission</h3>
     <p className="text-muted-foreground">
      Create a spend permission first to try demo charges
     </p>
    </CardContent>
   </Card>
  )
 }

 return (
  <div className="space-y-6">
   {/* Demo Info */}
   <Card className="border-blue-200 bg-blue-50">
    <CardHeader>
     <CardTitle className="flex items-center space-x-2 text-blue-800">
      <Zap className="w-5 h-5" />
      <span>Demo Usage Spender</span>
     </CardTitle>
    </CardHeader>
    <CardContent>
     <p className="text-blue-700 text-sm">
      This demo simulates how merchants and services can charge your card using 
      spend permissions without requiring repeated signatures. Each charge uses 
      the same permission you've already granted.
     </p>
     {lastCharge && (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
       <p className="text-green-800 text-sm font-medium">
        ✅ Last charge: {formatCurrency(lastCharge.amount)} to {lastCharge.merchant}
       </p>
       <p className="text-green-600 text-xs">
        Auth ID: {lastCharge.authId}
       </p>
      </div>
     )}
    </CardContent>
   </Card>

   {/* Demo Charges */}
   <Card>
    <CardHeader>
     <CardTitle>Try Demo Charges</CardTitle>
     <p className="text-sm text-muted-foreground">
      These charges will be processed using your active spend permission
     </p>
    </CardHeader>
    <CardContent>
     <div className="grid gap-4">
      {demoCharges.map((charge, index) => {
       const Icon = charge.icon
       return (
        <div
         key={index}
         className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
         <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
           <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
           <h3 className="font-medium">{charge.merchant}</h3>
           <p className="text-sm text-muted-foreground">{charge.description}</p>
           <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {charge.category}
           </span>
          </div>
         </div>
         <div className="text-right">
          <p className="text-lg font-semibold">{formatCurrency(charge.amount)}</p>
          <button
           onClick={() => simulateCharge(charge)}
           disabled={loading}
           className="mt-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
           {loading ? 'Processing...' : 'Charge'}
          </button>
         </div>
        </div>
       )
      })}
     </div>
    </CardContent>
   </Card>

   {/* Usage-Based Billing Example */}
   <Card>
    <CardHeader>
     <CardTitle>Usage-Based Billing Demo</CardTitle>
     <p className="text-sm text-muted-foreground">
      Example of how services can implement metered billing
     </p>
    </CardHeader>
    <CardContent>
     <UsageBasedDemo />
    </CardContent>
   </Card>
  </div>
 )
}

/**
 * Usage-based billing demo component
 * 基于使用的计费演示组件
 */
function UsageBasedDemo() {
 const [usage, setUsage] = useState(0)
 const [isRunning, setIsRunning] = useState(false)
 
 const ratePerUnit = 0.05 // $0.05 per unit
 const currentCost = usage * ratePerUnit

 const startUsage = () => {
  setIsRunning(true)
  const interval = setInterval(() => {
   setUsage(prev => {
    const newUsage = prev + Math.random() * 2
    if (newUsage >= 100) {
     setIsRunning(false)
     clearInterval(interval)
     return 100
    }
    return newUsage
   })
  }, 100)

  // Auto-stop after 10 seconds
  setTimeout(() => {
   setIsRunning(false)
   clearInterval(interval)
  }, 10000)
 }

 const stopUsage = () => {
  setIsRunning(false)
 }

 const reset = () => {
  setUsage(0)
  setIsRunning(false)
 }

 return (
  <div className="space-y-4">
   <div className="text-center">
    <h3 className="text-lg font-semibold">Cloud Computing Service</h3>
    <p className="text-sm text-muted-foreground">Pay-per-use pricing: {formatCurrency(ratePerUnit)} per compute unit</p>
   </div>

   <div className="bg-gray-100 rounded-lg p-4">
    <div className="flex justify-between items-center mb-2">
     <span className="text-sm font-medium">Usage</span>
     <span className="text-sm font-medium">{usage.toFixed(1)} units</span>
    </div>
    <div className="w-full bg-gray-300 rounded-full h-2">
     <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-200"
      style={{ width: `${Math.min(100, usage)}%` }}
     />
    </div>
   </div>

   <div className="text-center">
    <p className="text-2xl font-bold">{formatCurrency(currentCost)}</p>
    <p className="text-sm text-muted-foreground">Current usage cost</p>
   </div>

   <div className="flex space-x-2">
    <button
     onClick={startUsage}
     disabled={isRunning || usage >= 100}
     className="flex-1 pagent-button-primary disabled:opacity-50"
    >
     {isRunning ? 'Running...' : 'Start Service'}
    </button>
    <button
     onClick={stopUsage}
     disabled={!isRunning}
     className="flex-1 pagent-button-secondary disabled:opacity-50"
    >
     Stop
    </button>
    <button
     onClick={reset}
     disabled={isRunning}
     className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
    >
     Reset
    </button>
   </div>

   {currentCost > 0 && (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
     <p className="text-yellow-800 text-sm">
      💡 In a real implementation, this service would automatically charge 
      {formatCurrency(currentCost)} using your spend permission when you stop the service.
     </p>
    </div>
   )}
  </div>
 )
}
