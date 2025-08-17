'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { X, Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface WaitlistModalProps {
 isOpen: boolean
 onClose: () => void
}

/**
 * Waitlist modal component for collecting user emails
 * Provides form validation and API integration for waitlist signup
 */
export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
 const [email, setEmail] = useState('')
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [isSuccess, setIsSuccess] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
 }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!email || !validateEmail(email)) {
   setError('Please enter a valid email address')
   return
  }

  setIsSubmitting(true)
  setError(null)

  try {
   // Try Supabase Edge Function directly first (with improved headers)
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   
   console.log('Debug - Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
   console.log('Debug - Anon Key:', supabaseAnonKey ? 'Set' : 'Missing')
   
   if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing')
   }

   const endpoint = `${supabaseUrl}/functions/v1/waitlist`
   const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'apikey': supabaseAnonKey,
    'x-client-info': 'pagent-credits-waitlist',
   }
   const requestBody = JSON.stringify({ email })
   
   console.log('Debug - Calling endpoint:', endpoint)
   console.log('Debug - Request headers:', requestHeaders)
   console.log('Debug - Request body:', requestBody)
   console.log('Debug - Email being sent:', email)

   const response = await fetch(endpoint, {
    method: 'POST',
    headers: requestHeaders,
    body: requestBody,
   })

   console.log('Debug - Response status:', response.status)
   console.log('Debug - Response ok:', response.ok)
   
   if (!response.ok) {
    const errorText = await response.text()
    console.log('Debug - Error response:', errorText)
    throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to join waitlist'}`)
   }

   const data = await response.json()
   console.log('Debug - Direct success response:', data)

   setIsSuccess(true)
   setEmail('')
  } catch (err) {
   console.error('Debug - Error caught:', err)
   setError(err instanceof Error ? err.message : 'Something went wrong')
  } finally {
   setIsSubmitting(false)
  }
 }

 const handleClose = () => {
  setEmail('')
  setError(null)
  setIsSuccess(false)
  onClose()
 }

 console.log('Debug - WaitlistModal render, isOpen:', isOpen)
 
 if (!isOpen) return null

 return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
   <Card className="w-full max-w-md mx-auto relative">
    <button
     onClick={handleClose}
     className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
    >
     <X className="w-5 h-5" />
    </button>

    <CardHeader className="text-center pb-4">
     <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      Join the Waitlist
     </CardTitle>
     <p className="text-gray-600 mt-2">
      Be the first to experience the future of non-custodial payments
     </p>
    </CardHeader>

    <CardContent>
     {isSuccess ? (
      <div className="text-center py-8">
       <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
       <h3 className="text-xl font-semibold text-gray-900 mb-2">
        You're on the list! 🎉
       </h3>
       <p className="text-gray-600 mb-6">
        We'll notify you as soon as Pagent Credits launches on Base.
       </p>
       <Button onClick={handleClose} className="w-full">
        Continue
       </Button>
      </div>
     ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
       <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
         Email Address
        </label>
        <div className="relative">
         <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
         <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          required
         />
        </div>
        {error && (
         <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
         </div>
        )}
       </div>

       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Early Access Benefits:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
         <li>• First access to Pagent Credits beta</li>
         <li>• Exclusive onboarding rewards</li>
         <li>• Priority customer support</li>
         <li>• Shape the future of the product</li>
        </ul>
       </div>

       <Button 
        type="submit" 
        disabled={isSubmitting || !email} 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
       >
        {isSubmitting ? (
         <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Joining Waitlist...
         </div>
        ) : (
         'Join Waitlist'
        )}
       </Button>

       <p className="text-xs text-gray-500 text-center">
        We'll never spam you. Unsubscribe at any time.
       </p>
      </form>
     )}
    </CardContent>
   </Card>
  </div>
 )
}
