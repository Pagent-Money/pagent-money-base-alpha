'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'

/**
 * Debug panel for testing API connectivity
 * 用于测试 API 连接的调试面板
 */
export function DebugPanel() {
 const [result, setResult] = useState<string>('')
 const [loading, setLoading] = useState(false)

 const testSupabase = async () => {
  setLoading(true)
  setResult('')
  
  try {
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/receipts'
   const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
   }
   
   const response = await fetch(url, {
    method: 'GET',
    headers,
   })
   
   const data = await response.json()
   setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
  } catch (error) {
   setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
   setLoading(false)
  }
 }

 const testEtherscan = async () => {
  setLoading(true)
  setResult('')
  
  try {
   const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
   const url = `https://api-sepolia.basescan.org/api?module=proxy&action=eth_gasPrice&apikey=${apiKey}`
   
   const response = await fetch(url)
   const data = await response.json()
   setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
  } catch (error) {
   setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
   setLoading(false)
  }
 }

 return (
  <Card>
   <CardHeader>
    <CardTitle>Debug Panel</CardTitle>
   </CardHeader>
   <CardContent className="space-y-4">
    <div className="space-y-2">
     <h3 className="font-medium">Environment Check</h3>
     <div className="text-sm space-y-1">
      <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</div>
      <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</div>
      <div>Etherscan Key: {process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY ? 'Set' : 'Not set'}</div>
      <div>Chain ID: {process.env.NEXT_PUBLIC_CHAIN_ID || 'Not set'}</div>
     </div>
    </div>
    
    <div className="flex space-x-2">
     <Button onClick={testSupabase} disabled={loading}>
      Test Supabase
     </Button>
     <Button onClick={testEtherscan} disabled={loading}>
      Test Etherscan
     </Button>
    </div>
    
    {result && (
     <div className="mt-4">
      <h4 className="font-medium mb-2">Result:</h4>
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
       {result}
      </pre>
     </div>
    )}
   </CardContent>
  </Card>
 )
}
