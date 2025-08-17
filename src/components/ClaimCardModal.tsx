'use client'

import { useEffect, useState } from 'react'
import { X, CreditCard } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { SecureAPI } from '../lib/secure-auth'

interface ClaimCardModalProps {
 isOpen: boolean
 onClose: () => void
 onClaim: (cardType: 'visa' | 'mastercard') => Promise<void>
 loading?: boolean
}

export function ClaimCardModal({ isOpen, onClose, onClaim, loading = false }: ClaimCardModalProps) {
 const [selectedCard, setSelectedCard] = useState<'visa' | 'mastercard' | null>(null)
 const [step, setStep] = useState<'select' | 'email' | 'success'>('select')
 const [email, setEmail] = useState('')
 const [emailError, setEmailError] = useState('')
 const [prefillTried, setPrefillTried] = useState(false)

 const cardOptions = [
  {
   type: 'visa' as const,
   name: 'Visa Virtual Card',
   description: 'Widely accepted worldwide',
   gradientFrom: '#6B53FF',
   gradientTo: '#6A4BFF',
   accent: '#8B5CF6',
   benefits: [
    '5% cashback in $PGT',
    'Early access & 15% off for AI promo bundles',
    '50% off for 2025 Google AI Conference',
   ],
   sample: {
    balance: '$5,750.20',
    number: '5282 3456 7890 1289',
    last4: '1289',
    expiry: '09/25',
   },
  },
  {
   type: 'mastercard' as const,
   name: 'Mastercard Virtual Card',
   description: 'Global acceptance with premium benefits',
   gradientFrom: '#EF4444',
   gradientTo: '#F97316',
   accent: '#FB7185',
   benefits: [
    '5% cashback in $PGT',
    'Early access & 15% off for AI promo bundles',
    '50% off for 2025 Google AI Conference',
   ],
   sample: {
    balance: '$4,570.80',
    number: '5294 2436 4780 2468',
    last4: '2468',
    expiry: '12/24',
   },
  },
 ]

 const validateEmail = (value: string) => {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  setEmailError(ok ? '' : 'Please enter a valid email.')
  return ok
 }

 const handleProceedToEmail = (type: 'visa' | 'mastercard') => {
  setSelectedCard(type)
  setStep('email')
 }

 const handleEmailSubmit = async () => {
  if (!selectedCard) return
  if (!validateEmail(email)) return
  try {
   const token = sessionStorage.getItem('pagent_token')
   // Best-effort store; our profile may not support email in type defs yet
   if (token) {
    await SecureAPI.updateUserProfile(token, { } as any)
    sessionStorage.setItem('pagent_email', email)
   }
  } catch (e) {
   // Non-blocking: continue even if profile update fails
   console.warn('Email capture failed, continuing claim')
  }
  await onClaim(selectedCard)
  setStep('success')
  setTimeout(() => {
   onClose()
  }, 1800)
 }

 // Prefill email from profile if available
 useEffect(() => {
  const prefill = async () => {
   if (prefillTried) return
   try {
    const token = sessionStorage.getItem('pagent_token')
    if (!token) return
    const prof = await SecureAPI.getUserProfile(token)
    const fallback = sessionStorage.getItem('pagent_email')
    const maybe = prof?.data?.email || prof?.user?.email || prof?.email || fallback
    if (maybe && typeof maybe === 'string') {
     setEmail(maybe)
    }
   } catch (_) {
    // ignore
   } finally {
    setPrefillTried(true)
   }
  }
  if (isOpen) prefill()
 }, [isOpen, prefillTried])

 if (!isOpen) return null

 return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
   <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b">
     <div>
      <h2 className="text-xl font-bold text-gray-900">Claim Your Virtual Card</h2>
      <p className="text-sm text-gray-600 mt-1">Choose your preferred card type</p>
     </div>
     <button
      onClick={onClose}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
     >
      <X className="w-5 h-5 text-gray-500" />
     </button>
    </div>

    {/* Card Options or Email Step */}
    {step === 'select' ? (
     <div className="p-6 space-y-4">
      {cardOptions.map((option) => (
       <div
        key={option.type}
        className={`cursor-pointer transition-all ${
         selectedCard === option.type
          ? 'ring-2 ring-[#6B53FF] ring-offset-2'
          : 'hover:shadow-lg'
        }`}
        onClick={() => handleProceedToEmail(option.type)}
       >
       <Card className="relative overflow-hidden">
        {/* Card Design */}
        <div 
         className="relative h-56 text-white p-6 flex flex-col justify-between rounded-xl"
         style={{
          background: `linear-gradient(135deg, ${option.gradientFrom}, ${option.gradientTo})`
         }}
        >
         {/* Background decorative arcs */}
         <div className="pointer-events-none absolute inset-0 opacity-30">
          <svg viewBox="0 0 400 250" className="w-full h-full">
           <defs>
            <radialGradient id="g1" cx="30%" cy="30%" r="60%">
             <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
             <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="g2" cx="80%" cy="20%" r="50%">
             <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
             <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
           </defs>
           <circle cx="60" cy="200" r="180" fill="url(#g1)" />
           <circle cx="360" cy="0" r="160" fill="url(#g2)" />
          </svg>
         </div>

         {/* Header: Brand and Network */}
         <div className="relative z-10 flex items-start justify-between">
          <div>
           <p className="text-sm text-white/80">Max Month Limit</p>
           <p className="text-3xl md:text-4xl font-bold tracking-tight mt-1">{option.sample.balance}</p>
          </div>
          <div className="flex items-center gap-2">
           <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold">
            PagentMoney
           </div>
           {/* Network mark */}
           {option.type === 'visa' ? (
            <span className="text-white/90 font-extrabold text-lg tracking-widest">VISA</span>
           ) : (
            <div className="relative w-10 h-6">
             <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-yellow-400/90" />
             <span className="absolute right-0 top-0 w-6 h-6 rounded-full bg-red-500/90 mix-blend-lighten" />
            </div>
           )}
          </div>
         </div>

         {/* Middle: Masked number and chip */}
         <div className="relative z-10 flex items-center justify-between mt-2">
          <div className="font-mono tracking-widest text-lg md:text-xl">
           {option.type === 'visa' ? '5282 3456 7890 1289' : '5294 2436 4780 2468'}
          </div>
          {/* Simple chip */}
          <div className="w-10 h-7 bg-white/70 rounded-sm shadow-inner relative overflow-hidden">
           <div className="absolute inset-0 grid grid-cols-2">
            <span className="border-r border-white/60" />
            <span />
           </div>
          </div>
         </div>

         {/* Footer: last4 and expiry */}
         <div className="relative z-10 flex items-end justify-between mt-2">
          <div className="text-sm text-white/90">
           •••• {option.sample.last4}
          </div>
          <div className="text-right">
           <p className="text-xs text-white/70">EXP</p>
           <p className="text-sm font-mono">{option.sample.expiry}</p>
          </div>
         </div>
        </div>

        {/* Card Info below */}
        <CardContent className="p-4">
         <h3 className="font-semibold text-gray-900">{option.name}</h3>
         <p className="text-sm text-gray-600 mt-1">{option.description}</p>
         <ul className="mt-2 space-y-1.5">
          {option.benefits.map((b, idx) => (
           <li key={idx} className="text-xs text-gray-600 flex items-center gap-2 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full opacity-80" style={{ backgroundColor: option.accent }} />
            {b}
           </li>
          ))}
         </ul>
        </CardContent>
       </Card>
      </div>
      ))}
     </div>
    ) : step === 'email' ? (
     <div className="p-6 space-y-4">
      <div>
       <h3 className="text-lg font-semibold text-gray-900">Get early access</h3>
       <p className="text-sm text-gray-600 mt-1">Enter your email to receive early access and benefits updates.</p>
      </div>
      <div>
       <label className="block text-sm text-gray-700 mb-1">Email</label>
       <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={(e) => validateEmail(e.target.value)}
        placeholder="you@example.com"
        className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-[#6B53FF] ${emailError ? 'border-red-500' : 'border-gray-300'}`}
       />
       {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
      </div>
      <div className="flex gap-3">
       <Button variant="outline" className="flex-1" onClick={() => setStep('select')} disabled={loading}>Back</Button>
       <Button className="flex-1 bg-[#6B53FF] hover:bg-[#5A45E6] text-white" onClick={handleEmailSubmit} disabled={loading || !!emailError || !email}>
        {loading ? 'Creating...' : 'Continue'}
       </Button>
      </div>
      <p className="text-xs text-gray-500">We’ll send you early-access updates. You can unsubscribe anytime.</p>
     </div>
    ) : (
     <div className="p-6 space-y-4">
      <div className="text-center">
       <h3 className="text-lg font-semibold text-gray-900">You’re on the list!</h3>
       <p className="text-sm text-gray-600 mt-1">We’ve saved your email for early access. Your card is being created…</p>
      </div>
     </div>
    )}

    {/* Footer Actions */}
    <div className="flex gap-3 p-6 pt-0">
     <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>Close</Button>
     {step === 'select' ? (
      <Button onClick={() => selectedCard && setStep('email')} disabled={!selectedCard || loading} className="flex-1 bg-[#6B53FF] hover:bg-[#5A45E6] text-white">Next</Button>
     ) : null}
    </div>
   </div>
  </div>
 )
}
