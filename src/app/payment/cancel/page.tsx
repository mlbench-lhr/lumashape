'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentCancel() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to pricing page after 3 seconds
    const timeout = setTimeout(() => {
      router.push('/#pricing')
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg text-center">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges were made.
        </p>
        <p className="text-sm text-gray-500">
          You will be redirected to the pricing page shortly...
        </p>
      </div>
    </div>
  )
}