'use client'

import { useEffect, useState } from 'react'
import { 
 Plus, 
 Minus, 
 History, 
 Settings,
 Receipt,
 CreditCard
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../lib/utils'
import { useSpendPermissions } from '../../hooks/useSpendPermissions'
import { useAccount } from 'wagmi'
import { CreatePermissionModal } from '../CreatePermissionModal'
import { ClientOnly } from '../ClientOnly'
import { CreditCardMini } from '../CreditCardMini'
import { useAuth } from '../../hooks/useSiweAuth'
import { SecureAPI } from '../../lib/secure-auth'

export function PagentCredits() {
 const { activePermission, permissions, revokePermission, loading: permissionLoading } = useSpendPermissions()
 const { address, isConnected } = useAccount()
 const { session, isAuthenticated } = useAuth()
 const [showCreateModal, setShowCreateModal] = useState(false)
 const [allowanceCap, setAllowanceCap] = useState<number>(0)
 const [usedAmount, setUsedAmount] = useState<number>(0)
 const [cardEligible, setCardEligible] = useState(false)
 
 const availableAllowance = Math.max(0, allowanceCap - usedAmount)
 const usagePercentage = allowanceCap > 0 ? (usedAmount / allowanceCap) * 100 : 0
 const hasActivePermission = !!activePermission

 useEffect(() => {
  const load = async () => {
   if (!isConnected || !address || !isAuthenticated || !session) {
    setAllowanceCap(0)
    setUsedAmount(0)
    setCardEligible(false)
    return
   }
   try {
    console.log('🔄 Loading allowance data...')
    const result = await SecureAPI.getCredits(session.access_token)
    
    if (result.success && result.data) {
     const { 
      activePermission, 
      allowanceCap: cap, 
      availableAllowance: available, 
      usedAmount: used,
      totalLimit: total
     } = result.data
     
     if (total) {
      // Convert from cents to dollars - use totalLimit for card eligibility
      const totalInDollars = Number(total) / 100
      setAllowanceCap(totalInDollars) // This represents the current total limit
      setCardEligible(totalInDollars >= 100) // $100 minimum for card
     }
     
     if (used !== undefined) {
      // Convert from cents to dollars
      const usedInDollars = Number(used) / 100
      setUsedAmount(usedInDollars)
     }
     
     console.log('✅ Allowance data loaded:', { 
      allowanceCapCents: cap, 
      allowanceCapDollars: cap ? Number(cap) / 100 : 0,
      availableAllowanceCents: available,
      availableAllowanceDollars: available ? Number(available) / 100 : 0,
      totalLimitCents: total,
      totalLimitDollars: total ? Number(total) / 100 : 0,
      usedCents: used, 
      usedDollars: used ? Number(used) / 100 : 0,
      hasActive: !!activePermission 
     })
    }
   } catch (error) {
    console.error('❌ Failed to load allowance data:', error)
    // keep defaults on failure
   }
  }
  load()
 }, [isConnected, address, isAuthenticated, session, activePermission])

 const handleRevokePermission = async () => {
  if (!activePermission) return
  const result = await revokePermission(activePermission.id)
  if (result.success) {
   setAllowanceCap(0)
   setUsedAmount(0)
   setCardEligible(false)
  }
 }

 const billingRecords = [
  { id: 1, date: '2024-03-15', description: 'OpenAI API', amount: 49.99, status: 'completed' },
  { id: 2, date: '2024-03-14', description: 'Stripe Payment', amount: 125.00, status: 'completed' },
  { id: 3, date: '2024-03-13', description: 'Google Cloud', amount: 75.50, status: 'completed' },
  { id: 4, date: '2024-03-12', description: 'AWS Services', amount: 200.00, status: 'pending' },
 ]

 return (
  <div className="space-y-6">
   {/* Main Credit Card - Mini App Optimized */}
   <ClientOnly
    fallback={
     <CreditCardMini
      availableCredit={0}
      totalLimit={0}
      usagePercentage={0}
      status="loading"
     />
    }
   >
    <CreditCardMini
     availableCredit={isConnected ? availableAllowance : 0}
     totalLimit={isConnected ? allowanceCap : 0}
     usagePercentage={usagePercentage}
     status={!isConnected ? 'inactive' : hasActivePermission ? 'active' : 'inactive'}
     actions={
      <div className="flex gap-2">
       {!isConnected ? (
        <div className="text-center w-full">
         <p className="text-white/70 text-xs">Connect wallet to manage allowance</p>
        </div>
       ) : !hasActivePermission ? (
        <Button
         onClick={() => setShowCreateModal(true)}
         className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md text-sm py-2"
         variant="outline"
        >
         <Plus className="w-4 h-4 mr-1" />
         Assign Allowance
        </Button>
       ) : (
        <>
         <button 
          onClick={() => setShowCreateModal(true)}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all text-sm"
         >
          <Plus className="w-4 h-4" />
          Add More
         </button>
         <button 
          onClick={handleRevokePermission}
          disabled={permissionLoading}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-white/10 hover:bg-red-500/20 backdrop-blur-md rounded-xl transition-all text-sm"
         >
          <Minus className="w-4 h-4" />
          Revoke
         </button>
        </>
       )}
      </div>
     }
    />
   </ClientOnly>

   {/* Card Eligibility Banner */}
   <ClientOnly>
    {hasActivePermission && cardEligible && (
     <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardContent className="p-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
         <div className="p-3 bg-green-500 rounded-full">
          <CreditCard className="w-6 h-6 text-white" />
         </div>
         <div>
          <h3 className="font-semibold text-green-800 mb-1">Card Eligible!</h3>
          <p className="text-sm text-green-700">
           Your ${formatCurrency(allowanceCap)} spend permission qualifies you for Pagent Card
          </p>
         </div>
        </div>
        <Button
         onClick={() => window.location.href = '/cards'}
         className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
        >
         Enable Card
        </Button>
       </div>
      </CardContent>
     </Card>
    )}
   </ClientOnly>

   {/* Quick Stats */}
   <ClientOnly>
    {hasActivePermission && (
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 text-center">
       <div className="text-2xl font-bold text-[#6B53FF]">{formatCurrency(allowanceCap)}</div>
       <div className="text-xs text-muted-foreground mt-1">Total Limit</div>
      </Card>
      <Card className="p-4 text-center">
       <div className="text-2xl font-bold text-[#FEA611]">{formatCurrency(usedAmount)}</div>
       <div className="text-xs text-muted-foreground mt-1">Used</div>
      </Card>
      <Card className="p-4 text-center">
       <div className="text-2xl font-bold text-green-600">{formatCurrency(availableCredit)}</div>
       <div className="text-xs text-muted-foreground mt-1">Available</div>
      </Card>
      <Card className="p-4 text-center">
       <div className="text-2xl font-bold text-indigo-600">{usagePercentage.toFixed(0)}%</div>
       <div className="text-xs text-muted-foreground mt-1">Usage</div>
      </Card>
     </div>
    )}
   </ClientOnly>

   {/* Recent Activity */}
   <ClientOnly>
    {hasActivePermission && (
    <Card>
     <CardHeader>
      <CardTitle className="flex items-center justify-between">
       <span className="flex items-center gap-2">
        <History className="w-5 h-5" />
        Recent Activity
       </span>
       <button className="text-sm text-[#6B53FF] hover:underline">View All</button>
      </CardTitle>
     </CardHeader>
     <CardContent>
      {billingRecords.length > 0 ? (
       <div className="space-y-3">
        {billingRecords.slice(0, 3).map((record) => (
         <div key={record.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-[#6B53FF]/10 to-[#FEA611]/10 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-[#6B53FF]" />
           </div>
           <div>
            <p className="font-medium text-sm">{record.description}</p>
            <p className="text-xs text-muted-foreground">{record.date}</p>
           </div>
          </div>
          <div className="text-right">
           <p className="font-semibold">{formatCurrency(record.amount)}</p>
           <span className={`text-xs px-2 py-0.5 rounded-full ${
            record.status === 'completed' 
             ? 'bg-green-100 text-green-700'
             : 'bg-yellow-100 text-yellow-700'
           }`}>
            {record.status}
           </span>
          </div>
         </div>
        ))}
       </div>
      ) : (
       <div className="text-center py-8 text-muted-foreground">
        <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No transactions yet</p>
        <p className="text-xs">Your spending activity will appear here</p>
       </div>
      )}
     </CardContent>
    </Card>
    )}
   </ClientOnly>

   {/* Create Permission Modal */}
   {showCreateModal && (
    <CreatePermissionModal
     currentAllowanceCap={allowanceCap}
     currentAvailableAllowance={availableAllowance}
     onClose={() => setShowCreateModal(false)}
     onSuccess={async (data) => {
      console.log('Permission created:', data)
      setShowCreateModal(false)
      
      // Immediately refresh allowance data
      try {
       console.log('🔄 Refreshing allowance data after assignment...')
       const result = await SecureAPI.getCredits(session.access_token)
       
       if (result.success && result.data) {
        const { 
         allowanceCap: cap, 
         availableAllowance: available, 
         usedAmount: used,
         totalLimit: total
        } = result.data
        
        if (total) {
         const totalInDollars = Number(total) / 100
         setAllowanceCap(totalInDollars)
         setCardEligible(totalInDollars >= 100)
        }
        
        if (used !== undefined) {
         const usedInDollars = Number(used) / 100
         setUsedAmount(usedInDollars)
        }
        
        console.log('✅ Allowance data refreshed after assignment')
       }
      } catch (error) {
       console.error('❌ Failed to refresh allowance data:', error)
      }
     }}
    />
   )}
  </div>
 )
}