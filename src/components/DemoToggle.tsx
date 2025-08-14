'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { TestTube, Wallet, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

export function DemoToggle() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    // Show demo toggle in development or if demo mode is enabled
    const showDemo = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true' ||
                     window.location.search.includes('demo=true')
    setIsVisible(showDemo)
    
    // Check if demo mode is currently active
    const currentDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
                       localStorage.getItem('pagent-demo-mode') === 'true'
    setIsDemoMode(currentDemo)
    
    // Remember expansion state
    const savedExpanded = localStorage.getItem('pagent-demo-panel-expanded')
    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === 'true')
    }
  }, [])

  const toggleDemo = () => {
    const newDemoMode = !isDemoMode
    setIsDemoMode(newDemoMode)
    
    // Store in localStorage and reload to apply changes
    localStorage.setItem('pagent-demo-mode', newDemoMode.toString())
    
    // Reload page to apply demo mode changes
    window.location.reload()
  }

  const toggleExpanded = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    
    // Save expansion preference
    localStorage.setItem('pagent-demo-panel-expanded', newExpanded.toString())
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`border border-orange-200 bg-orange-50/95 backdrop-blur-sm shadow-lg transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-auto'
      }`}>
        <CardHeader 
          className="pb-2 cursor-pointer select-none hover:bg-orange-100/50 transition-colors rounded-t-lg"
          onClick={toggleExpanded}
        >
          <CardTitle className="text-sm flex items-center justify-between text-orange-800">
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              <span>Demo Mode</span>
              {!isExpanded && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  isDemoMode 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {isDemoMode ? 'DEMO' : 'LIVE'}
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-orange-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-orange-600" />
            )}
          </CardTitle>
        </CardHeader>
        
        <div className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <CardContent className="space-y-3 pt-0">
            <div className="text-xs text-orange-700">
              {isDemoMode ? (
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Demo Mode Active</p>
                    <p className="text-green-700">Using simulated wallet and authentication for testing</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Wallet className="w-4 h-4 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Live Mode Active</p>
                    <p className="text-blue-700">Using real wallet connection and SIWE authentication</p>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={toggleDemo}
              size="sm"
              variant={isDemoMode ? "outline" : "default"}
              className={`w-full text-xs ${
                isDemoMode 
                  ? 'border-orange-300 text-orange-800 hover:bg-orange-100' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {isDemoMode ? 'Switch to Live Mode' : 'Switch to Demo Mode'}
            </Button>
            
            <div className="text-xs text-orange-600 border-t border-orange-200 pt-2">
              <p><strong>Demo Mode:</strong> Test without wallet</p>
              <p><strong>Live Mode:</strong> Real Coinbase wallet required</p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
