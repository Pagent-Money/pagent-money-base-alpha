'use client'

import { useAuth } from '../hooks/useSiweAuth'
import { AuthStatus } from '../components/AuthStatus'
import { CreditDashboard } from '../components/CreditDashboard'
import { ClientOnly } from '../components/ClientOnly'
import { WaitlistModal } from '../components/WaitlistModal'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import OnboardingCarousel from '../components/OnboardingCarousel'
import { CreditCard, Wallet, ShieldCheck, ShoppingBag, Check, Play, ArrowRight, Zap, RefreshCw, FileText, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { MiniNav } from '../components/MiniNav'
import { AppHeader } from '../components/AppHeader'

/**
 * Loading screen to prevent hydration mismatch
 * Loading screen to prevent hydration mismatches and ensure smooth user experience
 */
function LoadingScreen() {
 return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
   <div className="text-center">
    <div className="relative inline-block mb-6">
     <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl animate-pulse" />
     <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative animate-bounce">
      <img src="/pagentmoney_p_logo.png" alt="Pagent" className="h-12 w-auto" />
     </div>
    </div>
    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Loading Pagent</h1>
    <div className="flex items-center justify-center space-x-1">
     <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
     <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
     <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
   </div>
  </div>
 )
}

/**
 * Main application page for Pagent Money
 * Main application page for Pagent Credits with dashboard and navigation
 */
export default function HomePage() {
 return (
  <ClientOnly fallback={<LoadingScreen />}>
   <MainApp />
  </ClientOnly>
 )
}

function MainApp() {
 const { isAuthenticated, isLoading, user, isNewUser } = useAuth()
 const router = useRouter()
 const [hasRedirected, setHasRedirected] = useState(() => {
  // Check if we've already redirected in this session
  if (typeof window !== 'undefined') {
   return sessionStorage.getItem('pagent-has-redirected') === 'true'
  }
  return false
 })

 // Redirect to /credits after successful authentication
 useEffect(() => {
  // Only redirect if:
  // 1. User is authenticated
  // 2. We haven't redirected yet in this session
  // 3. Not currently loading
  // 4. User data is available
  // 5. We're on the home page (not navigating from another page)
  if (isAuthenticated && user && !hasRedirected && !isLoading) {
   const currentPath = window.location.pathname
   if (currentPath === '/' || currentPath === '') {
    console.log('🚀 Authentication successful, redirecting to /credits')
    setHasRedirected(true)
    // Store in session to prevent redirect on back navigation
    sessionStorage.setItem('pagent-has-redirected', 'true')
    // Small delay to ensure state is settled
    setTimeout(() => {
     router.push('/credits')
    }, 100)
   }
  }
 }, [isAuthenticated, user, hasRedirected, isLoading, router])

 // Clear redirect flag when user logs out
 useEffect(() => {
  if (!isAuthenticated && !isLoading) {
   sessionStorage.removeItem('pagent-has-redirected')
   setHasRedirected(false)
  }
 }, [isAuthenticated, isLoading])

 if (isLoading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center animate-pulse mb-4">
      <CreditCard className="w-8 h-8 text-white" />
     </div>
     <p className="text-gray-600">Loading Pagent Credits...</p>
    </div>
   </div>
  )
 }

 // Show loading state while redirecting
 if (isAuthenticated && user && hasRedirected) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center animate-pulse mb-4">
      <CreditCard className="w-8 h-8 text-white" />
     </div>
     <p className="text-gray-600">Redirecting to your dashboard...</p>
    </div>
   </div>
  )
 }

 // Show authenticated dashboard if logged in
 // (This is for users who manually navigate back to home)
 if (isAuthenticated && user) {
  return <AuthenticatedHomePage />
 }

 // Show welcome screen if not authenticated
 return (
  <>
   {/* Mobile: horizontal carousel */}
   <div className="md:hidden">
    <OnboardingCarousel />
   </div>
   {/* Desktop: full welcome page */}
   <div className="hidden md:block">
    <WelcomeScreen />
   </div>
  </>
 )
}

/**
 * Authenticated homepage - shows when user is logged in
 */
function AuthenticatedHomePage() {
 const { user, logout } = useAuth()
 const router = useRouter()
 
 return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
   <AppHeader title="Pagent Money" subtitle="Welcome Back" />
   
   <main className="max-w-screen-sm mx-auto px-4 py-6 pb-24">
    {/* Welcome Header */}
    <div className="text-center mb-8">
     <h2 className="text-2xl font-bold text-gray-900 mb-2">
      Welcome back!
     </h2>
     <p className="text-sm text-gray-600">
      {user?.address.slice(0, 6)}...{user?.address.slice(-4)}
     </p>
    </div>

    {/* Quick Navigation Cards */}
    <div className="space-y-4 mb-8">
     <Card 
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push('/credits')}
     >
      <div className="flex items-center gap-4">
       <CreditCard className="w-10 h-10 text-indigo-600" />
       <div className="flex-1">
        <h3 className="font-semibold text-gray-900">Pagent Credits</h3>
        <p className="text-sm text-gray-600">Manage your credit allowances</p>
       </div>
       <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>
     </Card>

     <Card 
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push('/cards')}
     >
      <div className="flex items-center gap-4">
       <CreditCard className="w-10 h-10 text-purple-600" />
       <div className="flex-1">
        <h3 className="font-semibold text-gray-900">Virtual Cards</h3>
        <p className="text-sm text-gray-600">View your payment cards</p>
       </div>
       <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>
     </Card>

     <Card 
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push('/promos')}
     >
      <div className="flex items-center gap-4">
       <ShoppingBag className="w-10 h-10 text-orange-600" />
       <div className="flex-1">
        <h3 className="font-semibold text-gray-900">Cashback & Promos</h3>
        <p className="text-sm text-gray-600">Explore offers and promotions</p>
       </div>
       <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>
     </Card>
    </div>

    {/* Account Actions */}
    <div className="space-y-3">
     <Button
      onClick={() => router.push('/credits')}
      size="lg"
      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
     >
      Go to Dashboard
     </Button>
     <Button
      onClick={logout}
      size="lg"
      variant="outline"
      className="w-full"
     >
      Sign Out
     </Button>
    </div>
   </main>
   
   <MiniNav />
  </div>
 )
}

/**
 * Welcome screen for unauthenticated users
 * Welcome screen for non-authenticated users with signup prompts
 */
function WelcomeScreen() {
 const { isConnected } = useAccount()
 const { authenticate, isConnecting, error, isAuthenticated } = useAuth()
 const router = useRouter()
 const [allowanceAmount, setAllowanceAmount] = useState(72)
 const [showWaitlistModal, setShowWaitlistModal] = useState(false)

 // Load Twitter embed script
 useEffect(() => {
  const script = document.createElement('script')
  script.src = 'https://platform.twitter.com/widgets.js'
  script.async = true
  script.charset = 'utf-8'
  document.body.appendChild(script)

  // Reload Twitter widgets if script is already loaded
  if ((window as any).twttr?.widgets) {
   (window as any).twttr.widgets.load()
  }

  return () => {
   // Cleanup if needed
   const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')
   if (existingScript && existingScript.parentNode) {
    existingScript.parentNode.removeChild(existingScript)
   }
  }
 }, [])

 // Count-up animation for allowance
 useEffect(() => {
  const interval = setInterval(() => {
   setAllowanceAmount(prev => prev === 72 ? 72 : prev + 1)
  }, 50)
  return () => clearInterval(interval)
 }, [])

 // Redirect after successful authentication
 useEffect(() => {
  if (isAuthenticated) {
   console.log('✅ Authentication successful, redirecting to /credits')
   router.push('/credits')
  }
 }, [isAuthenticated, router])

 // Handle wallet authentication after connection
 const handleAuthenticate = async () => {
  if (!isConnected) {
   console.log('Wallet not connected yet')
   return
  }
  
  try {
   await authenticate()
   // Redirect will happen automatically via the useEffect above
  } catch (err) {
   console.error('Authentication failed:', err)
  }
 }

 return (
  <div className="min-h-screen bg-white">
   {/* Wallet Status Banner */}
   {isConnected && (
    <motion.div 
     initial={{ y: -50, opacity: 0 }}
     animate={{ y: 0, opacity: 1 }}
     className="bg-green-50 border-b border-green-200 px-4 py-3"
    >
     <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2 text-green-700">
       <Check className="w-4 h-4" />
       <span className="text-sm font-medium">Wallet connected · Base</span>
      </div>
      <div className="text-sm text-green-600">
       ⏱ Allowance: {allowanceAmount} USDC remaining · resets in 3d 11h
      </div>
     </div>
    </motion.div>
   )}

   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Hero Section */}
    <motion.section 
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6 }}
     className="pt-20 pb-16 lg:pt-32 lg:pb-24"
    >
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Left: Text Content */}
      <div className="lg:col-span-6 space-y-8">
       <div className="space-y-6">
        <motion.h1 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.6, delay: 0.1 }}
         className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900"
        >
         Allowance, not custody.
        </motion.h1>
        
        <motion.p 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.6, delay: 0.2 }}
         className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl"
        >
         Pay with a virtual card while your USDC stays in your Base smart account. Set revocable limits. No lockups. No surprises.
        </motion.p>
       </div>

       {/* CTAs */}
       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
       >
        <Button
         onClick={() => {
          console.log('Debug - Join the Waitlist button clicked')
          setShowWaitlistModal(true)
         }}
         size="lg"
         className="bg-gradient-to-r from-[#6B53FF] to-[#FEA611] hover:from-[#5B43EF] hover:to-[#E89501] text-white py-4 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
        >
         <Mail className="w-5 h-5 mr-2" />
         Join the Waitlist
        </Button>

        {/* Wallet Connect Button - Hidden for now */}
        {!isConnected ? (
         <ConnectWallet className="w-auto">
          <Button
           size="lg"
           variant="outline"
           className="rounded-2xl shadow border-gray-200 hover:bg-gray-50 text-gray-700 py-4 px-8 text-lg font-semibold"
          >
           <Wallet className="w-5 h-5 mr-2" />
           Connect Wallet
          </Button>
         </ConnectWallet>
        ) : (
         // Hide the Sign In button for now
         null
        )}
        
        {((process.env.NEXT_PUBLIC_DEMO_DEEP_LINK as string) || (process.env.NEXT_PUBLIC_DEMO_URL as string)) && (
         <Button
          onClick={() => {
           const url = (process.env.NEXT_PUBLIC_DEMO_DEEP_LINK as string) || (process.env.NEXT_PUBLIC_DEMO_URL as string)
           if (typeof navigator !== 'undefined' && 'vibrate' in navigator && document.hasStoredUserActivation) {
            try { navigator.vibrate?.(20) } catch {}
           }
           if (url) window.location.href = url
          }}
          variant="outline"
          size="lg"
          className="rounded-2xl shadow border-gray-200 hover:bg-gray-50 text-gray-700"
         >
          <Play className="w-4 h-4 mr-2" />
          Watch 60-sec demo
         </Button>
        )}
       </motion.div>

       {/* Error Display */}
       {error && (
        <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm"
        >
         <p><strong>Authentication Error:</strong> {error}</p>
         <p className="mt-1 text-xs">Please try connecting your wallet again.</p>
        </motion.div>
       )}

       {/* Trust Badges */}
       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-wrap gap-3"
       >
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
         <ShieldCheck className="w-4 h-4" />
         Self-custodial
        </div>
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
         <RefreshCw className="w-4 h-4" />
         Revocable in one tap
        </div>
        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium">
         <Zap className="w-4 h-4" />
         Built on Base
        </div>
       </motion.div>
      </div>

      {/* Right: Card Illustration */}
      <motion.div 
       initial={{ opacity: 0, x: 20 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ duration: 0.6, delay: 0.3 }}
       className="lg:col-span-6"
      >
       <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-3xl blur-2xl opacity-20 transform rotate-6" />
        <Card className="rounded-2xl border bg-white shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300 relative">
         <div className="space-y-4">
          <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
           </div>
           <div>
            <h3 className="font-semibold text-gray-900">Non-custody Credit Card</h3>
            <p className="text-sm text-gray-500">•••• •••• •••• 4721</p>
           </div>
          </div>
          <div className="space-y-2">
           <div className="flex justify-between text-sm">
            <span className="text-gray-600">Weekly Allowance</span>
            <span className="font-medium">100 USDC</span>
           </div>
           <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="font-medium text-green-600">{allowanceAmount} USDC</span>
           </div>
           <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
             className="bg-gradient-to-r from-[#6B53FF] to-[#FEA611] h-2 rounded-full transition-all duration-1000" 
             style={{ width: `${allowanceAmount}%` }}
            />
           </div>
          </div>
          <div className="pt-2 text-xs text-gray-500">
           Resets in 3 days, 11 hours
          </div>
         </div>
        </Card>
       </div>
      </motion.div>
     </div>
    </motion.section>

    {/* Three Key Features */}
    <motion.section 
     initial={{ opacity: 0, y: 40 }}
     whileInView={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6 }}
     viewport={{ once: true }}
     className="py-16 lg:py-24"
    >
     <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
       How it works
      </h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
       Three simple components that revolutionize how you manage digital payments
      </p>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Feature 1: Credits */}
      <motion.div
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6, delay: 0.1 }}
       viewport={{ once: true }}
      >
       <Card className="rounded-2xl border bg-card shadow-sm p-5 md:p-6 h-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-4">
         <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
          <Wallet className="w-6 h-6 text-blue-600" />
         </div>
         <CardTitle className="text-xl font-semibold">Credits (On-chain Allowance)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
         <p className="text-muted-foreground leading-relaxed">
          Set a weekly or monthly cap (e.g., 100–2,000 USDC) that auto-renews. Adjust or revoke anytime; funds remain in your wallet until spent.
         </p>
         <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           Revocable & time-boxed
          </li>
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           Per-merchant labels
          </li>
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           Real-time receipts
          </li>
         </ul>
        </CardContent>
       </Card>
      </motion.div>

      {/* Feature 2: Virtual Card */}
      <motion.div
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6, delay: 0.2 }}
       viewport={{ once: true }}
      >
       <Card className="rounded-2xl border bg-card shadow-sm p-5 md:p-6 h-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-4">
         <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
          <CreditCard className="w-6 h-6 text-purple-600" />
         </div>
         <CardTitle className="text-xl font-semibold">Programmable Virtual Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
         <p className="text-muted-foreground leading-relaxed">
          Issue a virtual Visa card connected to your allowance. Every authorization triggers an on-chain pull—no repeated signatures, no custodial balance.
         </p>
         <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           JIT on-chain settlement
          </li>
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           Works with existing checkouts
          </li>
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           Clear audit trail
          </li>
         </ul>
        </CardContent>
       </Card>
      </motion.div>

      {/* Feature 3: Marketplace */}
      <motion.div
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6, delay: 0.3 }}
       viewport={{ once: true }}
      >
       <Card className="rounded-2xl border bg-card shadow-sm p-5 md:p-6 h-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-4">
         <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
          <ShoppingBag className="w-6 h-6 text-orange-600" />
         </div>
         <CardTitle className="text-xl font-semibold">Unified Cashback & AI Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
         <p className="text-muted-foreground leading-relaxed">
          Earn % back across partner merchants and pay usage-based AI tools automatically—one allowance, many touchpoints, unified receipts.
         </p>
         <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           Partner offers in one place
          </li>
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           Usage billing without popups
          </li>
          <li className="flex items-center gap-2">
           <Check className="w-4 h-4 text-green-500" />
           Exportable statements
          </li>
         </ul>
        </CardContent>
       </Card>
      </motion.div>
     </div>
    </motion.section>

    {/* How it Works - 3 Steps */}
    <motion.section 
     initial={{ opacity: 0, y: 40 }}
     whileInView={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6 }}
     viewport={{ once: true }}
     className="py-16 lg:py-24 bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
    >
     <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
       <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
        Three simple steps
       </h2>
       <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Get started with Pagent Credits in under 2 minutes
       </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
       {/* Step 1 */}
       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
        className="text-center"
       >
        <div className="relative inline-block mb-6">
         <div className="absolute inset-0 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-full blur-lg opacity-25" />
         <div className="w-16 h-16 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-full flex items-center justify-center relative shadow-lg">
          <span className="text-white text-xl font-bold">1</span>
         </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
         Create/Connect your Base smart account
        </h3>
        <p className="text-muted-foreground leading-relaxed">
         Link your Coinbase Smart Wallet or create a new Base account in seconds
        </p>
       </motion.div>

       {/* Step 2 */}
       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-center"
       >
        <div className="relative inline-block mb-6">
         <div className="absolute inset-0 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-full blur-lg opacity-25" />
         <div className="w-16 h-16 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-full flex items-center justify-center relative shadow-lg">
          <span className="text-white text-xl font-bold">2</span>
         </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
         Grant an allowance to Pagent spender
        </h3>
        <p className="text-muted-foreground leading-relaxed">
         Set your weekly limit (e.g., 100 USDC/week) with one signature
        </p>
       </motion.div>

       {/* Step 3 */}
       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="text-center"
       >
        <div className="relative inline-block mb-6">
         <div className="absolute inset-0 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-full blur-lg opacity-25" />
         <div className="w-16 h-16 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-full flex items-center justify-center relative shadow-lg">
          <span className="text-white text-xl font-bold">3</span>
         </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
         Pay with your virtual card
        </h3>
        <p className="text-muted-foreground leading-relaxed">
         Settlement pulls USDC on-chain automatically and logs a receipt
        </p>
       </motion.div>
      </div>

      <motion.div 
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6, delay: 0.4 }}
       viewport={{ once: true }}
       className="text-center mt-12"
      >
       <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
        <strong>Revoke or change limits anytime.</strong> Your funds never leave your wallet until you spend within your allowance.
       </p>
      </motion.div>
     </div>
    </motion.section>

    {/* Social Proof - X/Twitter Posts */}
    <motion.section 
     initial={{ opacity: 0, y: 40 }}
     whileInView={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6 }}
     viewport={{ once: true }}
     className="py-16 lg:py-24 bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
    >
     <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
       <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
        Learn More About Pagent
       </h2>
       <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        See what we're building and how cashback works
       </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
       {/* Pagent Intro Tweet */}
       <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
       >
        <div className="flex items-center gap-2 mb-4">
         <div className="w-10 h-10 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-full flex items-center justify-center">
          <span className="text-white font-bold">P</span>
         </div>
         <div>
          <h3 className="font-semibold text-gray-900">Introduction</h3>
          <p className="text-xs text-gray-500">What is Pagent Money?</p>
         </div>
        </div>
        <blockquote className="twitter-tweet" data-theme="light" data-conversation="none">
         <p lang="en" dir="ltr">Introducing Pagent Money (v0) 👻<br/><br/>Credit limits granted to Base smart accounts. Spend with virtual cards, pay with crypto as it happens—no upfront loading.<br/><br/>→ Revocable credits,~$100 weekly cycle<br/>→ JIT crypto settlement<br/>→ Receipts logged<br/><br/>All on Base, starting 2025. <a href="https://t.co/8mGx5MhxDS">pic.twitter.com/8mGx5MhxDS</a></p>&mdash; Pagent Money (@PagentMoney) <a href="https://twitter.com/PagentMoney/status/1956164698690478520?ref_src=twsrc%5Etfw">January 23, 2025</a>
        </blockquote>
       </motion.div>

       {/* Cashback Feature Tweet */}
       <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
       >
        <div className="flex items-center gap-2 mb-4">
         <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">%</span>
         </div>
         <div>
          <h3 className="font-semibold text-gray-900">Cashback Feature</h3>
          <p className="text-xs text-gray-500">Earn rewards on every purchase</p>
         </div>
        </div>
        <blockquote className="twitter-tweet" data-theme="light" data-conversation="none">
         <p lang="en" dir="ltr">Earn Cashback % in USDC on partner merchant<br/><br/>Using the same credit limit you can shop at partner merchants with cashback (e.g., 5–10% back on Base) to save money.<br/><br/>Unified dashboard for receipts, cashback tracking, automatic rewards. <a href="https://t.co/jWkQzQCdGf">pic.twitter.com/jWkQzQCdGf</a></p>&mdash; Pagent Money (@PagentMoney) <a href="https://twitter.com/PagentMoney/status/1956167155973808195?ref_src=twsrc%5Etfw">January 23, 2025</a>
        </blockquote>
       </motion.div>
      </div>

      {/* Follow CTA */}
      <motion.div 
       initial={{ opacity: 0, y: 20 }}
       whileInView={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.6, delay: 0.3 }}
       viewport={{ once: true }}
       className="text-center mt-8"
      >
       <a
        href="https://x.com/PagentMoney"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
       >
        Follow @PagentMoney on X for updates
        <ArrowRight className="w-4 h-4" />
       </a>
      </motion.div>
     </div>
    </motion.section>

    {/* Live Receipts Preview */}
    <motion.section 
     initial={{ opacity: 0, y: 40 }}
     whileInView={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6 }}
     viewport={{ once: true }}
     className="py-16 lg:py-24"
    >
     <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
       Live transaction receipts
      </h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
       Every payment is recorded on-chain with full transparency
      </p>
     </div>

     <Card className="rounded-2xl border bg-card shadow-sm p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
       <div className="flex items-center gap-3 mb-6">
        <FileText className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
       </div>

       {/* Mock receipts */}
       <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
         <div className="flex items-center gap-3">
          <Check className="w-4 h-4 text-green-600" />
          <div>
           <p className="text-sm font-medium text-gray-900">OpenAI API Usage</p>
           <p className="text-xs text-gray-600">2 minutes ago</p>
          </div>
         </div>
         <div className="text-right">
          <p className="text-sm font-medium text-gray-900">12.90 USDC</p>
          <button className="text-xs text-blue-600 hover:text-blue-800">View on Base ↗</button>
         </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
         <div className="flex items-center gap-3">
          <Check className="w-4 h-4 text-green-600" />
          <div>
           <p className="text-sm font-medium text-gray-900">Spotify Premium</p>
           <p className="text-xs text-gray-600">1 day ago</p>
          </div>
         </div>
         <div className="text-right">
          <p className="text-sm font-medium text-gray-900">9.99 USDC</p>
          <button className="text-xs text-blue-600 hover:text-blue-800">View on Base ↗</button>
         </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
         <div className="flex items-center gap-3">
          <Check className="w-4 h-4 text-green-600" />
          <div>
           <p className="text-sm font-medium text-gray-900">Netflix Subscription</p>
           <p className="text-xs text-gray-600">3 days ago</p>
          </div>
         </div>
         <div className="text-right">
          <p className="text-sm font-medium text-gray-900">15.49 USDC</p>
          <button className="text-xs text-blue-600 hover:text-blue-800">View on Base ↗</button>
         </div>
        </div>
       </div>

       <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
         No charges yet—your first receipt will appear here.
        </p>
       </div>
      </div>
     </Card>
    </motion.section>
   </div>

   {/* Waitlist Modal */}
   <WaitlistModal 
    isOpen={showWaitlistModal} 
    onClose={() => setShowWaitlistModal(false)} 
   />
  </div>
 )
}