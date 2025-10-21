'use client'

import React, { useEffect, useState } from 'react'
import axios, { AxiosError } from 'axios'

type Tx = {
  _id: string
  itemType: 'tool' | 'layout'
  itemName?: string
  itemId: string
  amountCents: number
  sellerShareCents: number
  platformShareCents: number
  buyerEmail: string
  sellerEmail: string
  status: 'pending' | 'paid' | 'failed'
  paidToSeller: boolean
  createdAt: string
}

type StripeStatus = {
  connected: boolean
  charges_enabled?: boolean
  payouts_enabled?: boolean
}

type Totals = {
  spentCents: number
  earnedCents: number
}

type TransactionsResponse = {
  payments: Tx[]
  earnings: Tx[]
  totals: Totals
}

export default function ProfitSharing() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StripeStatus | null>(null)
  const [payments, setPayments] = useState<Tx[]>([])
  const [earnings, setEarnings] = useState<Tx[]>([])
  const [totals, setTotals] = useState<Totals>({ spentCents: 0, earnedCents: 0 })

  // --- Auth Header Builder ---
  const authHeaders = () => {
    const token = localStorage.getItem('auth-token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // --- Connect Stripe Bank Account ---
  const connectBank = async () => {
    try {
      const res = await axios.post<{ url: string }>('/api/stripe/connect/create-account-link', {}, { headers: authHeaders() })
      if (res.data?.url) window.location.href = res.data.url
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.error ?? 'Failed to start Stripe onboarding.'
        console.error('Onboarding link error:', message)
        alert(message)
      } else {
        console.error('Unexpected onboarding error:', err)
      }
    }
  }

  // --- Fetch Data ---
  useEffect(() => {
    const load = async () => {
      try {
        const [statusRes, txRes] = await Promise.all([
          axios.get<StripeStatus>('/api/stripe/connect/account-status', { headers: authHeaders() }),
          axios.get<TransactionsResponse>('/api/purchases/transactions', { headers: authHeaders() }),
        ])

        setStatus(statusRes.data)
        setPayments(txRes.data.payments || [])
        setEarnings(txRes.data.earnings || [])
        setTotals(txRes.data.totals || { spentCents: 0, earnedCents: 0 })
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error('Profit sharing load error:', err.response?.data || err.message)
        } else {
          console.error('Unknown profit sharing error:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <div className="p-4">Loading...</div>

  const connected = status?.connected
  const earnedDollar = (totals.earnedCents / 100).toFixed(2)
  const spentDollar = (totals.spentCents / 100).toFixed(2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profit Sharing</h2>
        {!connected ? (
          <button
            onClick={connectBank}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Connect Bank Account
          </button>
        ) : (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm">
            Connected {status?.payouts_enabled ? '(payouts enabled)' : '(pending payouts)'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- Earnings --- */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Your Earnings</h3>
          <p className="text-sm text-gray-600 mb-3">Total: ${earnedDollar}</p>
          <div className="space-y-2 max-h-64 overflow-auto">
            {earnings.length === 0 ? (
              <p className="text-sm text-gray-500">No earnings yet.</p>
            ) : (
              earnings.map((tx) => (
                <div key={tx._id} className="text-sm flex items-center justify-between">
                  <span>
                    + ${(tx.sellerShareCents / 100).toFixed(2)} · {tx.itemType} ·{' '}
                    {tx.itemName || tx.itemId}
                  </span>
                  <span className={tx.paidToSeller ? 'text-green-600' : 'text-orange-600'}>
                    {tx.paidToSeller ? 'Paid' : 'Owed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- Payments --- */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Your Payments</h3>
          <p className="text-sm text-gray-600 mb-3">Total: ${spentDollar}</p>
          <div className="space-y-2 max-h-64 overflow-auto">
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments yet.</p>
            ) : (
              payments.map((tx) => (
                <div key={tx._id} className="text-sm flex items-center justify-between">
                  <span>
                    - ${(tx.amountCents / 100).toFixed(2)} · {tx.itemType} ·{' '}
                    {tx.itemName || tx.itemId}
                  </span>
                  <span
                    className={tx.status === 'paid' ? 'text-green-600' : 'text-gray-600'}
                  >
                    {tx.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
