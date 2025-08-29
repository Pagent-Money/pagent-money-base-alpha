'use client'

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { config } from '../lib/wagmi'
import { useState, useEffect, Suspense } from 'react'
import { SiweAuthProvider } from '../hooks/useSiweAuth'
import { ErrorBoundary, setupGlobalErrorHandlers } from '../components/ErrorBoundary'
import { getDefaultChain, getCurrentChainConfig } from '../config/chains'
import { ChainProvider, useActiveChain } from './chain-provider'

// Inner providers that need chain context
function InnerProviders({ children }: { children: React.ReactNode }) {
 const { activeChain } = useActiveChain()
 const [queryClient] = useState(() => new QueryClient({
  defaultOptions: {
   queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
   },
  },
 }))

 // Set up global error handlers on mount
 useEffect(() => {
  setupGlobalErrorHandlers()
  
  // Log configuration status for debugging
  if (process.env.NODE_ENV === 'development') {
   console.log('🔧 Pagent Configuration Status:', {
    hasCoinbaseApiKey: !!process.env.NEXT_PUBLIC_COINBASE_API_KEY,
    analyticsEnabled: !!process.env.NEXT_PUBLIC_COINBASE_API_KEY,
    chain: `${activeChain.name} (${activeChain.id})`,
    authSystem: 'Coinbase Smart Wallet + Supabase Edge Functions'
   })
  }
 }, [activeChain])

 return (
  <WagmiProvider config={config}>
   <QueryClientProvider client={queryClient}>
    <OnchainKitProvider
     apiKey={process.env.NEXT_PUBLIC_COINBASE_API_KEY}
     chain={activeChain}
     config={{
      analytics: {
       // Disable analytics if you want to avoid console errors
       // You can set NEXT_PUBLIC_DISABLE_ANALYTICS=true in your .env to disable
       enabled: process.env.NEXT_PUBLIC_DISABLE_ANALYTICS !== 'true' && !!process.env.NEXT_PUBLIC_COINBASE_API_KEY
      }
     }}
    >
     <SiweAuthProvider>
      {children}
     </SiweAuthProvider>
    </OnchainKitProvider>
   </QueryClientProvider>
  </WagmiProvider>
 )
}

// Main providers component with chain provider wrapper
export function Providers({ children }: { children: React.ReactNode }) {
 return (
  <ErrorBoundary>
   <Suspense fallback={<div>Loading...</div>}>
    <ChainProvider>
     <InnerProviders>
      {children}
     </InnerProviders>
    </ChainProvider>
   </Suspense>
  </ErrorBoundary>
 )
}
