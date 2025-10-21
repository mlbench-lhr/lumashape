'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'

export default function ImportSuccess() {
  const router = useRouter()
  const search = useSearchParams()
  const [message, setMessage] = useState('Verifying payment and unlocking your item...')

  useEffect(() => {
    const run = async () => {
      const sessionId = search.get('session_id')
      const itemType = search.get('item_type')
      const itemId = search.get('item_id')

      if (!sessionId || !itemType || !itemId) {
        setMessage('Missing payment information.')
        return
      }

      try {
        const authToken = localStorage.getItem('auth-token')
        if (!authToken) {
          setMessage('Please log in to continue.')
          router.push('/auth/login')
          return
        }

        // Verify payment with server
        const verifyRes = await axios.post('/api/purchases/verify', { sessionId }, {
          headers: { Authorization: `Bearer ${authToken}` }
        })

        if (!verifyRes.data?.verified) {
          setMessage('Payment verification failed.')
          return
        }

        // Unlock: add item to workspace / inventory
        if (itemType === 'layout') {
          await axios.post('/api/layouts/addToWorkspace', { layoutId: itemId }, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
        } else if (itemType === 'tool') {
          await axios.post('/api/user/tool/addToInventory', { toolId: itemId }, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
        }

        setMessage('Item unlocked! Redirecting to workspace...')
        setTimeout(() => router.push('/workspace'), 1200)
      } catch (err) {
        console.error('Import success error:', err)
        setMessage('An error occurred while unlocking your item.')
      }
    }
    run()
  }, [router, search])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg text-center">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Import Successful</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}