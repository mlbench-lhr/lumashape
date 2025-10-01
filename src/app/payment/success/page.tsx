'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import axios from 'axios'

export default function PaymentSuccess() {
  const router = useRouter()
  const { refreshUser } = useUser()
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)  // State to check if it's on the client side

  useEffect(() => {
    setIsClient(true)  // Indicate that we're now on the client-side
  }, [])

  useEffect(() => {
    if (!isClient) return // Only proceed if on the client

    const sessionId = new URLSearchParams(window.location.search).get('session_id')

    async function verifyPayment() {
      try {
        setLoading(true)

        if (sessionId) {
          // Get auth token
          const authToken = localStorage.getItem('auth-token')
          if (authToken) {
            // Update subscription directly from session
            await axios.post('/api/user/update-subscription', 
              { sessionId },
              {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                }
              }
            )
          }
        }

        // Refresh user data to get updated subscription info
        await refreshUser()

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/workspace')
        }, 3000)
      } catch (error) {
        console.error('Error verifying payment:', error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      verifyPayment()
    }
  }, [isClient, refreshUser, router])  // Added `isClient` dependency to trigger only after client-side

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg text-center">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your subscription. Your account has been upgraded.
        </p>
        <p className="text-sm text-gray-500">
          You will be redirected to your dashboard shortly...
        </p>
      </div>
    </div>
  )
}
