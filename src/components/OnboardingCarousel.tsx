'use client'

import React, { useMemo, useRef, useState, useEffect, UIEvent } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, RefreshCw, Zap, Wallet, CreditCard, ShoppingBag, Check, Play, ChevronRight } from 'lucide-react'
import { Button } from './ui/Button'
import { AuthStatus } from './AuthStatus'

const slideVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export default function OnboardingCarousel() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [index, setIndex] = useState(0)
  const [isInteracting, setIsInteracting] = useState(false)

  // Detect prefers-reduced-motion to avoid auto-advance for sensitive users
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return false
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  const slides = useMemo(
    () => [
      {
        key: 'hero',
        content: (
          <div className="h-full flex flex-col justify-between">
            <div className="space-y-4 pt-8">
              <motion.h1 variants={slideVariants} initial="hidden" animate="visible" transition={{ duration: 0.2 }} className="text-3xl font-semibold tracking-tight">
                Allowance, not custody.
              </motion.h1>
              <motion.p variants={slideVariants} initial="hidden" animate="visible" transition={{ duration: 0.2, delay: 0.05 }} className="text-base text-muted-foreground">
                Pay with a virtual card while your USDC stays in your Base smart account. Set revocable limits. No lockups. No surprises.
              </motion.p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  <ShieldCheck className="w-4 h-4" /> Self-custodial
                </span>
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  <RefreshCw className="w-4 h-4" /> Revocable in one tap
                </span>
                <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                  <Zap className="w-4 h-4" /> Built on Base
                </span>
              </div>
            </div>
            <div className="pb-4 pt-6">
              <div className="rounded-2xl border bg-white shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#6B53FF] to-[#FEA611] rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Non-custody Credit Card</p>
                    <p className="text-xs text-gray-500">Weekly Allowance: 100 USDC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'features',
        content: (
          <div className="h-full flex flex-col justify-between">
            <div className="space-y-5 pt-8">
              <h2 className="text-2xl font-semibold tracking-tight">Three key features</h2>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Credits (On-chain Allowance)</p>
                    <p className="text-muted-foreground">Weekly/monthly caps that auto-renew. Funds stay in your wallet.</p>
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Programmable Virtual Card</p>
                    <p className="text-muted-foreground">JIT on-chain pulls. Works with existing checkouts.</p>
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Unified Cashback & AI Marketplace</p>
                    <p className="text-muted-foreground">Partner offers, usage billing, unified receipts.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pb-4 pt-6 text-xs text-muted-foreground">Keep full custody. Revoke anytime.</div>
          </div>
        ),
      },
      {
        key: 'steps',
        content: (
          <div className="h-full flex flex-col justify-between">
            <div className="space-y-5 pt-8">
              <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6B53FF] to-[#FEA611] text-white flex items-center justify-center text-xs font-bold">1</div>
                  <div className="text-sm">
                    <p className="font-medium">Create/Connect Base smart account</p>
                    <p className="text-muted-foreground">Use Coinbase Smart Wallet.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6B53FF] to-[#FEA611] text-white flex items-center justify-center text-xs font-bold">2</div>
                  <div className="text-sm">
                    <p className="font-medium">Grant an allowance</p>
                    <p className="text-muted-foreground">e.g., 100 USDC/week to Pagent spender.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6B53FF] to-[#FEA611] text-white flex items-center justify-center text-xs font-bold">3</div>
                  <div className="text-sm">
                    <p className="font-medium">Pay with your virtual card</p>
                    <p className="text-muted-foreground">On-chain pull and instant receipt.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pb-4 pt-6 text-xs text-muted-foreground">Revoke or change limits anytime.</div>
          </div>
        ),
      },
      {
        key: 'cta',
        content: (
          <div className="h-full flex flex-col justify-between">
            <div className="space-y-4 pt-8">
              <h2 className="text-2xl font-semibold tracking-tight">Get started</h2>
              <p className="text-sm text-muted-foreground">Connect your wallet and grant a weekly allowance. No custodial lockups.</p>
              <AuthStatus />
              <Button variant="outline" size="lg" className="rounded-2xl border-gray-200">
                <Play className="w-4 h-4 mr-2" /> Watch 60-sec demo
              </Button>
            </div>
            <div className="pb-4 text-xs text-muted-foreground">Toasts never block your primary action.</div>
          </div>
        ),
      },
    ],
    []
  )

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const newIndex = Math.round(el.scrollLeft / el.clientWidth)
    if (newIndex !== index) {
      setIndex(newIndex)
      // Light haptic feedback on slide change (supported on some devices)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.(10) } catch {}
      }
    }
  }

  const scrollToIndex = (nextIndex: number) => {
    if (!containerRef.current) return
    const clamped = Math.max(0, Math.min(slides.length - 1, nextIndex))
    containerRef.current.scrollTo({ left: clamped * containerRef.current.clientWidth, behavior: 'smooth' })
    setIndex(clamped)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onResize = () => scrollToIndex(index)
    window.addEventListener('resize', onResize)

    const onVisibility = () => {
      if (document.hidden) {
        setIsInteracting(true)
      } else {
        setIsInteracting(false)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const onPointerDown = () => setIsInteracting(true)
    const onPointerUp = () => setTimeout(() => setIsInteracting(false), 150)
    el.addEventListener('touchstart', onPointerDown, { passive: true })
    el.addEventListener('touchend', onPointerUp)
    el.addEventListener('mousedown', onPointerDown)
    el.addEventListener('mouseup', onPointerUp)

    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-advance slides every 4s when not interacting and not on last slide
  useEffect(() => {
    if (prefersReducedMotion) return
    if (isInteracting) return
    if (index >= slides.length - 1) return

    const id = setInterval(() => {
      scrollToIndex(index + 1)
    }, 4000)
    return () => clearInterval(id)
  }, [index, isInteracting, prefersReducedMotion, slides.length])

  const handleContinue = () => {
    // Haptic on CTA
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate?.([10, 20, 10]) } catch {}
    }
    scrollToIndex(index + 1)
  }

  const demoLink = useMemo(() => (
    (process.env.NEXT_PUBLIC_DEMO_DEEP_LINK as string) || (process.env.NEXT_PUBLIC_DEMO_URL as string) || ''
  ), [])

  return (
    <div className="relative w-full h-[88vh] overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {slides.map((s) => (
          <section key={s.key} className="min-w-full h-full snap-start px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+140px)]">
            {s.content}
          </section>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-16 left-0 right-0 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollToIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-gray-900' : 'w-2 bg-gray-300'}`}
          />
        ))}
      </div>

      {/* Sticky bottom actions */}
      {index < slides.length - 1 && (
        <div className="fixed left-0 right-0 bottom-0 pb-[calc(env(safe-area-inset-bottom)+12px)] px-4 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t">
          <div className="max-w-sm mx-auto pt-3 space-y-3">
            <Button size="lg" className="w-full rounded-2xl shadow" onClick={handleContinue}>
              Continue <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            {demoLink && (
              <Button
                onClick={() => { if (demoLink) window.location.href = demoLink }}
                variant="outline"
                size="lg"
                className="w-full rounded-2xl"
              >
                <Play className="w-4 h-4 mr-2" /> Watch 60-sec demo
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
