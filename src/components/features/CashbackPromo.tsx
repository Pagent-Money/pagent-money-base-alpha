'use client'

import { useState } from 'react'
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
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { formatCurrency } from '../../lib/utils'

export function CashbackPromo() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Mock PGT Points balance
  const pgtPoints = 12450
  const pgtValue = pgtPoints * 0.01 // 1 PGT = $0.01
  const totalEarned = 5632
  const thisMonthEarned = 245

  const promoItems = [
    {
      id: 1,
      title: 'ChatGPT Plus Annual',
      description: 'AI-powered conversations and productivity boost',
      price: 180,
      pgtPrice: 16200, // 90% discount
      originalPrice: 200,
      category: 'ai',
      discount: '10% Extra',
      icon: <Brain className="w-6 h-6" />,
      gradient: 'from-blue-500 to-indigo-600',
      badge: 'HOT',
      cashback: '5x'
    },
    {
      id: 2,
      title: 'Premium Dev Bundle',
      description: 'GitHub Pro + Figma + Notion - Complete developer toolkit',
      price: 450,
      pgtPrice: 32400, // 72% discount  
      originalPrice: 520,
      category: 'dev',
      discount: '28% Off',
      icon: <Code className="w-6 h-6" />,
      gradient: 'from-purple-500 to-pink-600',
      badge: 'BUNDLE',
      cashback: '3x'
    },
    {
      id: 3,
      title: 'Gaming Credit Pack',
      description: 'Steam + Epic + PlayStation - Gaming essentials',
      price: 200,
      pgtPrice: 18000, // 10% discount
      originalPrice: 200,
      category: 'gaming',
      discount: '10% Cashback',
      icon: <Gamepad2 className="w-6 h-6" />,
      gradient: 'from-green-500 to-emerald-600',
      badge: 'NEW',
      cashback: '2x'
    },
    {
      id: 4,
      title: 'Cloud Computing Credits',
      description: 'AWS + Google Cloud + Azure credits bundle',
      price: 1000,
      pgtPrice: 85000, // 15% discount
      originalPrice: 1000,
      category: 'cloud',
      discount: '15% Extra',
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-orange-500 to-red-600',
      badge: 'POPULAR',
      cashback: '4x'
    }
  ]

  const recentCashbacks = [
    { id: 1, source: 'OpenAI API', amount: 2.5, pgt: 250, date: '2024-03-15' },
    { id: 2, source: 'Stripe Payment', amount: 6.25, pgt: 625, date: '2024-03-14' },
    { id: 3, source: 'AWS Services', amount: 10.0, pgt: 1000, date: '2024-03-13' },
    { id: 4, source: 'Google Cloud', amount: 3.75, pgt: 375, date: '2024-03-12' },
  ]

  const categories = [
    { id: 'all', name: 'All Items', icon: <Star className="w-4 h-4" /> },
    { id: 'ai', name: 'AI Tools', icon: <Brain className="w-4 h-4" /> },
    { id: 'dev', name: 'Developer', icon: <Code className="w-4 h-4" /> },
    { id: 'gaming', name: 'Gaming', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'cloud', name: 'Cloud', icon: <Zap className="w-4 h-4" /> },
  ]

  const filteredItems = selectedCategory === 'all' 
    ? promoItems 
    : promoItems.filter(item => item.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* PGT Points Overview */}
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
                 <span className="text-sm font-medium">Gold Status</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
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
        </CardContent>
      </Card>

      {/* Cashback Rate Info */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">1:1 Cashback Rate</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Earn 1 PGT point for every $1 spent with Pagent Card
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">100%</p>
              <p className="text-xs text-green-600">Cashback</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border'
            }`}
          >
            {category.icon}
            {category.name}
          </button>
        ))}
      </div>

      {/* Promo Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.gradient}`} />
            
            {/* Badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                item.badge === 'HOT' ? 'bg-red-500' :
                item.badge === 'NEW' ? 'bg-green-500' :
                item.badge === 'POPULAR' ? 'bg-blue-500' :
                'bg-purple-500'
              }`}>
                {item.badge}
              </span>
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-gradient-to-r ${item.gradient} rounded-lg text-white`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cash Price</span>
                  <span className="font-semibold">{formatCurrency(item.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">PGT Price</span>
                  <div className="text-right">
                    <span className="font-bold text-lg text-orange-600">{item.pgtPrice.toLocaleString()} PGT</span>
                    {item.originalPrice > item.price && (
                      <p className="text-xs text-green-600">{item.discount}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cashback */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Extra Cashback</span>
                </div>
                <span className="font-bold text-orange-600">{item.cashback}</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-sm font-medium">Buy with Cash</span>
                </button>
                <button className={`flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${item.gradient} text-white rounded-lg hover:shadow-lg transition-all`}>
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-medium">Buy with PGT</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  )
}