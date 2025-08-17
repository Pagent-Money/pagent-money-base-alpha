'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useSiweAuth'
import { useAccount } from 'wagmi'
import { AppHeader } from '../../components/AppHeader'
import { MiniNav } from '../../components/MiniNav'
import { PagentCard } from '../../components/features/PagentCard'
import { Button } from '../../components/ui/Button'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { Wallet } from 'lucide-react'

export default function CardsPage() {
 const { isAuthenticated, isLoading, authenticate, isConnecting } = useAuth()
 const { isConnected } = useAccount()
 const router = useRouter()

 // Show loading while checking auth
 if (isLoading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg animate-pulse mb-4 mx-auto" />
     <p className="text-gray-600">Loading cards...</p>
    </div>
   </div>
  )
 }

 // Show auth prompt if not authenticated
 if (!isAuthenticated) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center max-w-sm mx-auto px-4">
     <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
     <p className="text-gray-600 mb-6">Please connect your wallet and sign in to access your cards</p>
     
     <div className="space-y-3 mb-6">
      {!isConnected ? (
       <ConnectWallet>
        <Button
         size="lg"
         className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
         <Wallet className="w-4 h-4 mr-2" />
         Connect Wallet
        </Button>
       </ConnectWallet>
      ) : (
       <Button
        onClick={authenticate}
        disabled={isConnecting}
        size="lg"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
       >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? 'Authenticating...' : 'Sign In with Wallet'}
       </Button>
      )}
     </div>

     <Button
      onClick={() => router.push('/')}
      variant="outline"
      className="w-full"
     >
      Go to Home
     </Button>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
   <AppHeader title="Pagent Cards" subtitle="Virtual Cards & Payments" />
   
   {/* Main content area */}
   <main className="max-w-screen-sm mx-auto px-4 py-6 pb-24">
    <PagentCard />
   </main>
   
   <MiniNav />
  </div>
 )
}


