'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/context/UserContext'

export default function PaymentSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser, refreshSubscription } = useUser()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (sessionId) {
      // Refresh user and subscription data after successful payment
      const refreshData = async () => {
        try {
          await refreshUser()
          await refreshSubscription()
        } catch (error) {
          console.error('Error refreshing data:', error)
        } finally {
          setLoading(false)
        }
      }

      // Wait a moment for webhook to process
      setTimeout(refreshData, 2000)
    } else {
      setLoading(false)
    }
  }, [searchParams, refreshUser, refreshSubscription])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Processing your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for subscribing to Lumashape. Your subscription is now active.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/workspace')}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Workspace
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}