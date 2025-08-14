'use client'

import { useMemo, useState, useEffect } from 'react'
import { 
  Gift, 
  Sparkles, 
  Star,
  Zap,
  ShoppingBag,
  Gamepad2,
  Code,
  Brain,
  TrendingUp,
  Award,
  Crown,
  Coins,
  ArrowRight,
  Clock,
  Flame,
  Target,
  CreditCard,
  Link2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs'
import { formatCurrency } from '../../lib/utils'
import { CreatePermissionModal } from '../CreatePermissionModal'
import { ClaimCardModal } from '../ClaimCardModal'
import { useAuth } from '../../hooks/useAuth'
import { SecureAPI } from '../../lib/secure-auth'

export function CashbackPromo() {
  const [showAllowanceModal, setShowAllowanceModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)
  const [whitelistEmail, setWhitelistEmail] = useState('')
  const [wlError, setWlError] = useState('')
  const [wlSubmitting, setWlSubmitting] = useState(false)
  const [wlDone, setWlDone] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { session, isAuthenticated } = useAuth()

  // Ensure hydration is complete before accessing sessionStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // Mock PGT Points balance (replace with rewards API later)
  const pgtPoints = 12450
  const pgtValue = pgtPoints * 0.01 // 1 PGT = $0.01
  const totalEarned = 5632
  const thisMonthEarned = 245

  // Determine whitelist tier and cashback percentage
  const { tierLabel, cashbackPercent } = useMemo(() => {
    try {
      const anyUser = (session as any)?.user
      const rankFromSession: number | undefined = anyUser?.user_metadata?.whitelist_rank
      const isWhitelisted: boolean = Boolean(anyUser?.user_metadata?.is_whitelisted)
      
      // Only access sessionStorage after hydration to prevent hydration mismatch
      const rankFromStorage = isHydrated ? Number(sessionStorage.getItem('whitelist_rank') || '0') : 0
      const wlFromStorage = isHydrated ? sessionStorage.getItem('is_whitelisted') === 'true' : false
      
      const rank = rankFromSession || rankFromStorage || 0
      const whitelisted = isWhitelisted || wlFromStorage

      if (rank > 0 && rank <= 100) return { tierLabel: 'Top 100', cashbackPercent: 10 }
      if (rank > 100 && rank <= 300) return { tierLabel: 'Top 300', cashbackPercent: 8 }
      if (whitelisted) return { tierLabel: 'Whitelist', cashbackPercent: 5 }
      return { tierLabel: 'Public', cashbackPercent: 0 }
    } catch {
      return { tierLabel: 'Public', cashbackPercent: 0 }
    }
  }, [session, isHydrated])

  const handleClaimCard = async (cardType: 'visa' | 'mastercard') => {
    if (!isAuthenticated || !session) return
    try {
      setClaimLoading(true)
      // Create a starter card with a reasonable demo limit
      await SecureAPI.createCard(session.access_token, 500)
    } finally {
      setClaimLoading(false)
    }
  }

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const handleWhitelistSubmit = async () => {
    setWlError('')
    if (!validateEmail(whitelistEmail)) {
      setWlError('Please enter a valid email')
      return
    }
    try {
      setWlSubmitting(true)
      const token = session?.access_token || sessionStorage.getItem('pagent_token') || ''
      if (token) {
        await SecureAPI.updateUserProfile(token, { } as any)
      }
      sessionStorage.setItem('pagent_whitelist_email', whitelistEmail)
      setWlDone(true)
    } catch (_) {
      setWlDone(true)
    } finally {
      setWlSubmitting(false)
    }
  }

  // Pagent Promo - Top Bundles (full-height cards)
  const topBundles = [
    {
      id: 1,
      title: 'ChatGPT Plus vs Pro',
      description: 'Extended GPT-5 Access, Deep Research, Sora Video',
      price: 180,
      pgtPrice: 16200, // 90% discount
      originalPrice: 200,
      category: 'top',
      discount: '10% Extra',
      icon: <Brain className="w-6 h-6" />,
      gradient: 'from-blue-500 to-indigo-600',
      badge: 'HOT',
      image: '/promo-images/chatgpt-plus.png',
      extraCashback: 8
    },
    {
      id: 2,
      title: 'Claude Code Pro',
      description: 'Research preview with advanced coding capabilities',
      price: 450,
      pgtPrice: 32400, // 72% discount  
      originalPrice: 520,
      category: 'top',
      discount: '28% Off',
      icon: <Code className="w-6 h-6" />,
      gradient: 'from-purple-500 to-pink-600',
      badge: 'BUNDLE',
      image: '/promo-images/claude-code.png',
      extraCashback: 8
    },
    {
      id: 3,
      title: 'Cursor AI Code Editor',
      description: 'AI-powered code completion and pair programming',
      price: 200,
      pgtPrice: 18000, // 10% discount
      originalPrice: 200,
      category: 'top',
      discount: '10% Cashback',
      icon: <Code className="w-6 h-6" />,
      gradient: 'from-green-500 to-emerald-600',
      badge: 'NEW',
      image: '/promo-images/cursor-ai.png',
      extraCashback: 8
    },
    {
      id: 4,
      title: 'Runway AI Creative Suite',
      description: 'AI video generation and creative editing tools',
      price: 1000,
      pgtPrice: 85000, // 15% discount
      originalPrice: 1000,
      category: 'top',
      discount: '15% Extra',
      icon: <Sparkles className="w-6 h-6" />,
      gradient: 'from-orange-500 to-red-600',
      badge: 'POPULAR',
      image: '/promo-images/runway-ai.png',
      extraCashback: 8
    }
  ]

  // Picked Promo - curated from Whop top picks (reference: https://whop.com/)
  const whopPicked = [
    {
      id: 'whop1',
      title: 'AI VIDEO LABS',
      description: 'Community of world class AI filmmakers & marketers',
      price: 997,
      pgtPrice: 89730, // 10% PGT bonus
      originalPrice: 997,
      category: 'picked',
      discount: '10% PGT Bonus',
      icon: <Sparkles className="w-6 h-6" />,
      gradient: 'from-sky-500 to-blue-600',
      badge: 'TOP PICK',
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=160&fit=crop&crop=center',
      extraCashback: 5
    },
    {
      id: 'whop2',
      title: 'PeloSwing Premium Access',
      description: 'Bringing Wall St. to Main St.',
      price: 39.99,
      pgtPrice: 3599,
      originalPrice: 39.99,
      category: 'picked',
      discount: '10% PGT Bonus',
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-green-600',
      badge: 'TRENDING',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=160&fit=crop&crop=center',
      extraCashback: 5
    },
    {
      id: 'whop3',
      title: 'PokeNotify Trainer Pass',
      description: 'Top Global Pokemon TCG alert community',
      price: 7.99,
      pgtPrice: 719,
      originalPrice: 7.99,
      category: 'picked',
      discount: '10% PGT Bonus',
      icon: <Gamepad2 className="w-6 h-6" />,
      gradient: 'from-fuchsia-500 to-pink-600',
      badge: 'HOT',
      image: 'https://images.unsplash.com/photo-1606503153255-59d8b8b3e7c5?w=400&h=160&fit=crop&crop=center',
      extraCashback: 5
    },
    {
      id: 'whop4',
      title: 'Wealth Group Credit Card Pay',
      description: 'Join a top crypto trading community',
      price: 225,
      pgtPrice: 20250,
      originalPrice: 225,
      category: 'picked',
      discount: '10% PGT Bonus',
      icon: <Coins className="w-6 h-6" />,
      gradient: 'from-amber-500 to-orange-600',
      badge: 'POPULAR',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=160&fit=crop&crop=center',
      extraCashback: 5
    }
  ]

  const recentCashbacks = [
    { id: 1, source: 'OpenAI API', amount: 2.5, pgt: 250, date: '2024-03-15' },
    { id: 2, source: 'Stripe Payment', amount: 6.25, pgt: 625, date: '2024-03-14' },
    { id: 3, source: 'AWS Services', amount: 10.0, pgt: 1000, date: '2024-03-13' },
    { id: 4, source: 'Google Cloud', amount: 3.75, pgt: 375, date: '2024-03-12' },
  ]

  // Helper: compute cashback lines
  const getCashbackLines = (extra: number) => {
    const base = cashbackPercent
    const total = base + extra
    return {
      base,
      extra,
      total
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero / Points Overview */}
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6B53FF] to-[#FEA611]" />
        <CardContent className="relative p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-6 h-6" />
                <span className="text-sm uppercase tracking-wider text-white/80">PGT Points Balance</span>
              </div>
              <p className="text-5xl font-bold mb-2">{pgtPoints.toLocaleString()}</p>
              <p className="text-white/80">≈ {formatCurrency(pgtValue)} value</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-2">
                <Crown className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">{tierLabel} • {cashbackPercent}% PGT</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-white/80 text-sm mb-1">Total Earned</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xl font-bold">{totalEarned.toLocaleString()} PGT</span>
              </div>
            </div>
            <div>
              <p className="text-white/80 text-sm mb-1">This Month</p>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xl font-bold">+{thisMonthEarned} PGT</span>
              </div>
            </div>
          </div>

          {/* Cashback Tiers integrated */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white/90">Cashback Tiers</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-lg border ${cashbackPercent === 10 ? 'bg-yellow-400/20 border-yellow-400/50' : 'bg-white/10 border-white/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/80">Top 100</span>
                  <span className="text-sm font-bold text-yellow-300">10%</span>
                </div>
                <p className="text-[10px] text-white/60">Invite only</p>
              </div>
              <div className={`p-3 rounded-lg border ${cashbackPercent === 8 ? 'bg-green-400/20 border-green-400/50' : 'bg-white/10 border-white/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/80">Top 300</span>
                  <span className="text-sm font-bold text-green-300">8%</span>
                </div>
                <p className="text-[10px] text-white/60">Limited spots</p>
              </div>
              <div className={`p-3 rounded-lg border ${cashbackPercent === 5 ? 'bg-blue-400/20 border-blue-400/50' : 'bg-white/10 border-white/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/80">Whitelist</span>
                  <span className="text-sm font-bold text-blue-300">5%</span>
                </div>
                <p className="text-[10px] text-white/60">Available now</p>
              </div>
            </div>
          </div>

          {/* CTA strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => setShowAllowanceModal(true)}
              className="w-full bg-white text-[#6B53FF] hover:bg-white/90 flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" /> Assign credits
            </Button>
            <Button
              onClick={() => setShowClaimModal(true)}
              className="w-full bg-[#0B0B0B] text-white hover:bg-black/80 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Claim Non-custodial card
            </Button>
          </div>
        </CardContent>
      </Card>



      {/* Pagent Promo */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Pagent Promo
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Picked promos curated from Whop top picks — see more at whop.com
          </p>
        </CardHeader>
      </Card>
      {/* Enhanced Tabs: Top Bundles | Promo Picked */}
      <Tabs defaultValue="top" className="w-full">
        <TabsList className="mb-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1">
          <TabsTrigger value="top" className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <Flame className="w-4 h-4 mr-2" />
            Top Bundles
            {/* Fire effect for active state */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse opacity-70" />
          </TabsTrigger>
          <TabsTrigger value="picked" className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Promo Picked
            {/* Sparkle effect for active state */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping opacity-70" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="top">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topBundles.map((item) => {
              const lines = getCashbackLines(item.extraCashback)
              return (
                <Card key={item.id} className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 min-h-[32rem] flex flex-col relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  {/* OnchainKit-style glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.gradient}`} />
                  
                  {/* Badge positioned properly */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-xl backdrop-blur-sm ${
                      item.badge === 'HOT' ? 'bg-red-500/90' :
                      item.badge === 'NEW' ? 'bg-green-500/90' :
                      item.badge === 'POPULAR' ? 'bg-blue-500/90' :
                      'bg-purple-500/90'
                    }`}>{item.badge}</span>
                  </div>

                  {/* Header with taller image banner */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-r ${item.gradient} rounded-xl text-white shadow-2xl backdrop-blur-sm border border-white/20`}>
                        {item.icon}
                      </div>
                      <div className="text-white">
                        <h3 className="font-semibold text-sm">{item.title}</h3>
                        <p className="text-xs text-white/80">{item.description}</p>
                      </div>
                    </div>
                  </div>

                  <CardHeader className="pb-2 pt-4">
                    {/* Title and description now in image overlay */}
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Cash Price</p>
                        <p className="font-semibold">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">PGT Price</p>
                        <p className="font-bold text-orange-600">{item.pgtPrice.toLocaleString()} PGT</p>
                        {item.originalPrice > item.price && (
                          <p className="text-xs text-green-600">{item.discount}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                      <ul className="text-xs space-y-1 text-orange-700 dark:text-orange-200">
                        <li className="flex items-center gap-2"><Coins className="w-3 h-3 flex-shrink-0" /> basic Pagent Cashback {lines.base}%</li>
                        <li className="flex items-center gap-2"><Flame className="w-3 h-3 flex-shrink-0" /> Bundle Extra Cashback {lines.extra}%</li>
                        <li className="flex items-center gap-2 font-semibold"><Award className="w-3 h-3 flex-shrink-0" /> total cashback {lines.total}%</li>
                      </ul>
                    </div>
                    
                    <button className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${item.gradient} text-white rounded-lg hover:shadow-lg transition-all mt-auto`}>
                      <ShoppingBag className="w-4 h-4" /> Buy it now
                    </button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        <TabsContent value="picked">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whopPicked.map((item) => {
              const lines = getCashbackLines(item.extraCashback)
              return (
                <Card key={item.id} className="group hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 min-h-[18rem] flex flex-col relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  {/* Subtle glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.gradient}`} />
                  
                  {/* Badge positioned properly */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-lg backdrop-blur-sm ${
                      item.badge === 'HOT' ? 'bg-red-500/90' :
                      item.badge === 'NEW' ? 'bg-green-500/90' :
                      item.badge === 'POPULAR' ? 'bg-blue-500/90' :
                      'bg-purple-500/90'
                    }`}>{item.badge}</span>
                  </div>

                  {/* Header with taller image banner */}
                  <div className="relative h-24 w-full overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-2">
                      <div className={`p-1.5 bg-gradient-to-r ${item.gradient} rounded-lg text-white shadow-lg backdrop-blur-sm border border-white/20`}>
                        {item.icon}
                      </div>
                    </div>
                  </div>

                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-base mb-1">{item.title}</CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-3 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Cash Price</span>
                      <span className="font-semibold text-sm">{formatCurrency(item.price)}</span>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                      <ul className="text-[11px] space-y-1 text-orange-700 dark:text-orange-200">
                        <li className="flex items-center gap-2"><Coins className="w-3 h-3 flex-shrink-0" /> basic {lines.base}%</li>
                        <li className="flex items-center gap-2"><Flame className="w-3 h-3 flex-shrink-0" /> extra {lines.extra}%</li>
                        <li className="flex items-center gap-2 font-semibold"><Award className="w-3 h-3 flex-shrink-0" /> total {lines.total}%</li>
                      </ul>
                    </div>
                    
                    <button className={`w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r ${item.gradient} text-white rounded-lg hover:shadow-lg transition-all text-sm mt-auto`}>
                      <ShoppingBag className="w-4 h-4" /> Buy it now
                    </button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Cashback History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recent Cashback
            </span>
            <button className="text-sm text-primary hover:underline">View All</button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentCashbacks.map((cashback) => (
              <div key={cashback.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg flex items-center justify-center">
                    <Coins className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cashback.source}</p>
                    <p className="text-xs text-muted-foreground">{cashback.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">+{cashback.pgt} PGT</p>
                  <p className="text-xs text-muted-foreground">≈ {formatCurrency(cashback.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Program */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-1">Gold Status Benefits</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Unlock exclusive rewards and higher cashback rates
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">2x</p>
              <p className="text-xs text-purple-600">Weekend Cashback</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">15%</p>
              <p className="text-xs text-purple-600">Promo Discount</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">24/7</p>
              <p className="text-xs text-purple-600">Priority Support</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAllowanceModal && (
        <CreatePermissionModal
          onClose={() => setShowAllowanceModal(false)}
          onSuccess={() => setShowAllowanceModal(false)}
        />
      )}
      <ClaimCardModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onClaim={handleClaimCard}
        loading={claimLoading}
      />
    </div>
  )
}