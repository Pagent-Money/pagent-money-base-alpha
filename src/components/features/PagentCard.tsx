'use client'

import { useState } from 'react'
import { 
  CreditCard, 
  Plus, 
  Link2, 
  Shield, 
  Smartphone,
  Globe,
  Check,
  X,
  Copy,
  Eye,
  EyeOff,
  ShoppingBag,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { useVirtualCard } from '../../hooks/useVirtualCard'
import { formatCurrency } from '../../lib/utils'

export function PagentCard() {
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [isCardActive, setIsCardActive] = useState(true)
  const { card, createCard, loading } = useVirtualCard()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Mock card data
  const cardData = {
    number: '4532 •••• •••• 8976',
    fullNumber: '4532 1234 5678 8976',
    holder: 'JOHN DOE',
    expiry: '12/26',
    cvv: '123',
    type: 'visa',
    balance: 1250.00,
    limit: 5000.00
  }

  const linkedServices = [
    { id: 1, name: 'Stripe', icon: '💳', status: 'active', lastUsed: '2 hours ago' },
    { id: 2, name: 'Google Pay', icon: '🔷', status: 'active', lastUsed: '1 day ago' },
    { id: 3, name: 'Apple Pay', icon: '🍎', status: 'inactive', lastUsed: 'Never' },
    { id: 4, name: 'PayPal', icon: '💰', status: 'active', lastUsed: '3 days ago' },
  ]

  const recentTransactions = [
    { id: 1, merchant: 'OpenAI', amount: 49.99, date: '2024-03-15', status: 'completed' },
    { id: 2, merchant: 'AWS', amount: 125.00, date: '2024-03-14', status: 'completed' },
    { id: 3, merchant: 'Google Cloud', amount: 75.50, date: '2024-03-13', status: 'pending' },
  ]

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Virtual Card Display */}
      <div className="relative">
        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#6B53FF] to-[#FEA611]" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='10' cy='10' r='1' fill='white' fill-opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
              backgroundSize: '100px 100px'
            }} />
          </div>
          
          <CardContent className="relative p-8 text-white">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80 mb-1">Virtual Card</p>
                <p className="text-2xl font-bold">Pagent Card</p>
              </div>
              <div className="flex items-center gap-2">
                {cardData.type === 'visa' && (
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded">
                    <span className="text-xl font-bold">VISA</span>
                  </div>
                )}
                <button
                  onClick={() => setShowCardDetails(!showCardDetails)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {showCardDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Card Number */}
            <div className="mb-6">
              <p className="text-xs text-white/60 mb-1">Card Number</p>
              <div className="flex items-center gap-3">
                <p className="text-xl font-mono tracking-wider">
                  {showCardDetails ? cardData.fullNumber : cardData.number}
                </p>
                <button
                  onClick={() => copyToClipboard(cardData.fullNumber, 'number')}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {copiedField === 'number' ? 
                    <Check className="w-4 h-4 text-green-400" /> : 
                    <Copy className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Card Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Card Holder</p>
                <p className="font-medium">{cardData.holder}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Expires</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{showCardDetails ? cardData.expiry : '••/••'}</p>
                  {showCardDetails && (
                    <button
                      onClick={() => copyToClipboard(cardData.expiry, 'expiry')}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copiedField === 'expiry' ? 
                        <Check className="w-3 h-3 text-green-400" /> : 
                        <Copy className="w-3 h-3" />
                      }
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">CVV</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{showCardDetails ? cardData.cvv : '•••'}</p>
                  {showCardDetails && (
                    <button
                      onClick={() => copyToClipboard(cardData.cvv, 'cvv')}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copiedField === 'cvv' ? 
                        <Check className="w-3 h-3 text-green-400" /> : 
                        <Copy className="w-3 h-3" />
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card Balance */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/60">Available Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(cardData.balance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">Credit Limit</p>
                  <p className="text-lg">{formatCurrency(card?.spending_limit ?? cardData.limit)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Status Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsCardActive(!isCardActive)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              isCardActive 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
          >
            {isCardActive ? 'Active' : 'Frozen'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold mb-1">Enable Pagent Card</h3>
            <p className="text-sm text-muted-foreground">Requires active $100+ spend permission</p>
            <div className="mt-4">
              <button
                disabled={!!card || loading}
                onClick={async () => { await createCard(5000) }}
                className="px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[#6B53FF] to-[#FEA611] disabled:opacity-50"
              >
                {card ? 'Card Enabled' : (loading ? 'Creating...' : 'Enable')}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900/30 dark:to-orange-900/30 rounded-lg">
                <Link2 className="w-6 h-6 text-pink-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold mb-1">Link Services</h3>
            <p className="text-sm text-muted-foreground">Connect to payment platforms</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold mb-1">Security Settings</h3>
            <p className="text-sm text-muted-foreground">Manage card limits and controls</p>
          </CardContent>
        </Card>
      </div>

      {/* Linked Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Linked Services
            </span>
            <button className="text-sm text-primary hover:underline">Manage</button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{service.icon}</span>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">Last used: {service.lastUsed}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  service.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {service.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Recent Card Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{tx.merchant}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">-{formatCurrency(tx.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}