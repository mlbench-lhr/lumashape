'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'

export default function OrderSuccessClient() {
  const router = useRouter()
  const search = useSearchParams()
  const [message, setMessage] = useState('Finalizing your order...')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true
    const run = async () => {
      const sessionId = search.get('session_id')
      if (!sessionId) {
        if (active) setMessage('Missing payment details.')
        return
      }
      try {
        const token = localStorage.getItem('auth-token') || ''
        const res = await axios.post('/api/orders/verify', { sessionId }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data?.verified) {
          if (active) {
            setMessage('Order confirmed! We’ll start processing your inserts.')
            setDone(true)
          }
        } else {
          if (active) setMessage('Payment verification failed.')
        }
      } catch (err) {
        console.error('Order success error:', err)
        if (active) setMessage('An error occurred while confirming your order.')
      }
    }
    run()
    return () => { active = false }
  }, [search])

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">Thank You</h1>
      <p className="text-gray-700 mb-6">{message}</p>
      <button
        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
        onClick={() => router.push('/workspace')}
      >
        {done ? 'Go to Workspace' : 'Return to Workspace'}
      </button>
    </div>
  )
}