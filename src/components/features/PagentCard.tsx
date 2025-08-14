'use client'

import { useMemo, useState } from 'react'
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
  ArrowRight,
  Settings,
  Receipt
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs'
import { Button } from '../ui/Button'
import { ClaimCardModal } from '../ClaimCardModal'
import { useVirtualCard } from '../../hooks/useVirtualCard'
import { formatCurrency } from '../../lib/utils'

export function PagentCard() {
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [isCardActive, setIsCardActive] = useState(true)
  const { card, createCard, loading, updateSpendingLimit, toggleCardStatus } = useVirtualCard()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [pendingLimit, setPendingLimit] = useState<number>(card?.spending_limit || 5000)

  // Mock card data - use 0 balance and limit if no card exists
  const cardData = {
    number: card ? '4532 •••• •••• 8976' : '•••• •••• •••• ••••',
    fullNumber: card ? '4532 1234 5678 8976' : '•••• •••• •••• ••••',
    holder: 'JOHN DOE',
    expiry: card ? '12/26' : '••/••',
    cvv: card ? '123' : '•••',
    type: 'visa',
    balance: card ? 1250.00 : 0,
    limit: card ? (card.spending_limit || 5000.00) : 0
  }

  const linkedServices = useMemo(() => ([
    { id: 1, name: 'Stripe', icon: '💳', status: 'active', lastUsed: '2 hours ago' },
    { id: 2, name: 'Google Pay', icon: '🔷', status: 'active', lastUsed: '1 day ago' },
    { id: 3, name: 'Apple Pay', icon: '🍎', status: 'inactive', lastUsed: 'Never' },
    { id: 4, name: 'PayPal', icon: '💰', status: 'active', lastUsed: '3 days ago' },
    { id: 5, name: 'Shopify', icon: '🛍️', status: 'active', lastUsed: '5 hours ago' },
    { id: 6, name: 'Amazon Pay', icon: '🅰️', status: 'inactive', lastUsed: 'Never' },
    { id: 7, name: 'Notion', icon: '📝', status: 'active', lastUsed: '4 days ago' },
  ]), [])

  const recentTransactions = useMemo(() => ([
    { id: 1, merchant: 'OpenAI', amount: 49.99, date: '2025-03-15', status: 'completed' },
    { id: 2, merchant: 'AWS', amount: 125.0, date: '2025-03-14', status: 'completed' },
    { id: 3, merchant: 'Google Cloud', amount: 75.5, date: '2025-03-13', status: 'pending' },
    { id: 4, merchant: 'Figma', amount: 19.0, date: '2025-03-12', status: 'completed' },
    { id: 5, merchant: 'Vercel', amount: 12.0, date: '2025-03-11', status: 'completed' },
    { id: 6, merchant: 'Notion', amount: 8.0, date: '2025-03-10', status: 'completed' },
    { id: 7, merchant: 'Stripe Test', amount: 1.0, date: '2025-03-10', status: 'completed' },
    { id: 8, merchant: 'Base Gas', amount: 3.2, date: '2025-03-09', status: 'completed' },
    { id: 9, merchant: 'Adobe', amount: 29.99, date: '2025-03-09', status: 'pending' },
    { id: 10, merchant: 'GitHub', amount: 9.0, date: '2025-03-08', status: 'completed' },
  ]), [])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleClaimCard = async (cardType: 'visa' | 'mastercard') => {
    try {
      // Create card with default spending limit based on card type
      const defaultLimit = cardType === 'visa' ? 5000 : 7500
      await createCard(defaultLimit)
      setShowClaimModal(false)
    } catch (error) {
      console.error('Failed to claim card:', error)
    }
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
          
          <CardContent className="relative p-6 md:p-8 text-white">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80 mb-1">Virtual Card</p>
                <p className="text-2xl font-bold">Pagent Card</p>
              </div>
              <div className="flex items-center gap-2">
                {cardData.type === 'visa' && card && (
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded">
                    <span className="text-xl font-bold">VISA</span>
                  </div>
                )}
                {card && (
                  <button
                    onClick={() => setShowCardDetails(!showCardDetails)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {showCardDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
                {!card && (
                  <Button
                    onClick={() => setShowClaimModal(true)}
                    className="px-3 py-1 bg-[#6B53FF] hover:bg-[#5A45E6] text-white rounded-md text-xs disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Claim Card'}
                  </Button>
                )}
              </div>
            </div>

            {/* Card Number */}
            <div className="mb-6">
              <p className="text-xs text-white/60 mb-1">Card Number</p>
              <div className="flex items-center gap-3">
                <p className="text-xl font-mono tracking-wider">
                  {showCardDetails && card ? cardData.fullNumber : cardData.number}
                </p>
                {card && (
                  <button
                    onClick={() => copyToClipboard(cardData.fullNumber, 'number')}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedField === 'number' ? 
                      <Check className="w-4 h-4 text-green-400" /> : 
                      <Copy className="w-4 h-4" />
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Card Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Card Holder</p>
                <p className="font-medium">{card ? cardData.holder : '••••••••'}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Expires</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{showCardDetails && card ? cardData.expiry : '••/••'}</p>
                  {showCardDetails && card && (
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
                  <p className="font-medium">{showCardDetails && card ? cardData.cvv : '•••'}</p>
                  {showCardDetails && card && (
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
                  <p className="text-xl font-semibold">{formatCurrency(cardData.balance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">Credit Limit</p>
                  <p className="text-sm font-medium">{formatCurrency(cardData.limit)}</p>
                </div>
              </div>
            </div>

            {/* Intentionally no claim button here to avoid duplication */}
          </CardContent>
        </Card>

        {/* Primary claim CTA placed just below the card for first-screen visibility */}
        {!card && (
          <div className="mt-4">
            <Button
              onClick={() => setShowClaimModal(true)}
              className="w-full bg-[#6B53FF] hover:bg-[#5A45E6] text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Claim a Virtual Credit Card'}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">Instant activation • Sandbox demo</p>
          </div>
        )}

        {/* Card Status Toggle - Only show if card exists */}
        {card && (
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
        )}
      </div>

      {/* Tabs are always visible; content adapts based on card presence */}
      <Tabs defaultValue="services" className="w-full">
          <TabsList className="sticky top-2 z-10 grid w-full grid-cols-3 bg-gray-100">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Services linked
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Linked Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Linked Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!card && (
                  <div className="mb-3 text-xs text-gray-500">Demo data shown — claim a card to link real services.</div>
                )}
                <div className="space-y-3">
                  {linkedServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{service.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-gray-500">Last used: {service.lastUsed}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.status}
                        </span>
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Settings className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Service
                </button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Credit Cap */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium">Credit Cap</p>
                        <p className="text-xs text-gray-500">Current limit: {formatCurrency(cardData.limit)}</p>
                      </div>
                      <span className="text-sm text-gray-700">{formatCurrency(pendingLimit)}</span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={20000}
                      step={500}
                      value={pendingLimit}
                      onChange={(e) => setPendingLimit(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-end mt-3">
                      <Button
                        className="bg-[#6B53FF] hover:bg-[#5A45E6] text-white"
                        disabled={loading || !card}
                        onClick={async () => {
                          if (!card) return
                          await updateSpendingLimit(pendingLimit)
                        }}
                      >
                        Update Limit
                      </Button>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">Freeze Card</p>
                          <p className="text-xs text-gray-500">Temporarily disable all authorizations</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => { if (card) { setIsCardActive(!isCardActive); await toggleCardStatus(); } }}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${isCardActive ? 'bg-green-100 text-green-800' : 'bg-gray-300 text-gray-800'}`}
                        disabled={!card}
                      >
                        {isCardActive ? 'Active' : 'Frozen'}
                      </button>
                    </div>
                  </div>

                  {/* Unlink */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-700">Unlink</p>
                    <p className="text-xs text-red-600 mt-1">Remove card from your wallet integrations. Demo only.</p>
                    <div className="flex justify-end mt-3">
                      <Button className="bg-red-600 hover:bg-red-700 text-white" disabled>
                        Unlink Card (Demo)
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!card && (
                  <div className="mb-3 text-xs text-gray-500">Demo transactions shown — claim a card to see real activity.</div>
                )}
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.merchant}</p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">-{formatCurrency(transaction.amount)}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 p-3 text-center text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-2">
                  View All Transactions
                  <ArrowRight className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Claim Card Modal */}
      <ClaimCardModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onClaim={handleClaimCard}
        loading={loading}
      />
    </div>
  )
}