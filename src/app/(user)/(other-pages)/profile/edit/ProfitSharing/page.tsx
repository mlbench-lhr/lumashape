'use client'

import React, { useEffect, useState, useRef } from 'react'
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
    details_submitted?: boolean
    transfers_active?: boolean
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
    const [filter, setFilter] = useState<'all' | 'tool' | 'layout'>('all')
    const loadOnceRef = useRef(false)
    const autoSettleRef = useRef(false)

    // --- Auth Header Builder ---
    const authHeaders = () => {
        const token = localStorage.getItem('auth-token')
        return token ? { Authorization: `Bearer ${token}` } : {}
    }


    const connected = status?.connected
    const earnedDollar = (totals.earnedCents / 100).toFixed(2)
    const spentDollar = (totals.spentCents / 100).toFixed(2)

    const paidCents = earnings.filter(e => e.paidToSeller).reduce((s, t) => s + t.sellerShareCents, 0)
    const owedCents = earnings.filter(e => !e.paidToSeller).reduce((s, t) => s + t.sellerShareCents, 0)
    const platformShareCents = earnings.reduce((s, t) => s + t.platformShareCents, 0)
    const avgPerSale = earnings.length ? (totals.earnedCents / earnings.length / 100).toFixed(2) : "0.00"

    // Add a clear flag for missing details or pending payouts/capabilities
    const needsAction = Boolean(
        connected &&
        (!status?.payouts_enabled || !status?.details_submitted || !status?.transfers_active)
    )

    // Check if account is fully ready for automatic transfers
    const accountReady = Boolean(
        connected &&
        status?.payouts_enabled &&
        status?.details_submitted &&
        status?.transfers_active
    )
    const filteredEarnings = earnings.filter(e => filter === 'all' ? true : e.itemType === filter)
    const filteredPayments = payments.filter(p => filter === 'all' ? true : p.itemType === filter)


    useEffect(() => {
        if (loadOnceRef.current) return
        loadOnceRef.current = true

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

    useEffect(() => {
        const hasOwed = earnings.some(e => !e.paidToSeller)
        const eligible = status?.connected && status?.details_submitted && status?.transfers_active && status?.payouts_enabled

        if (!autoSettleRef.current && hasOwed && eligible) {
            autoSettleRef.current = true
            settleOwed().finally(() => {
                // Set a timeout before allowing another auto-settle attempt
                setTimeout(() => {
                    autoSettleRef.current = false
                }, 30000) // 30 second cooldown
            })
        }
    }, [status?.connected, status?.details_submitted, status?.transfers_active, status?.payouts_enabled])

    const settleOwed = async () => {
        try {
            const res = await axios.post('/api/purchases/settle-owed', {}, { headers: authHeaders() })

            // Show success message if transfers were made
            if (res.data?.settledCount > 0) {
                alert(res.data.message || `Successfully transferred ${res.data.settledCount} payment(s) to your account.`)
            } else if (res.data?.settledCount === 0) {
                console.log('No transfers needed - all balances already settled')
            }

            // Refresh transaction data
            const txRes = await axios.get<TransactionsResponse>('/api/purchases/transactions', { headers: authHeaders() })
            setPayments(txRes.data.payments || [])
            setEarnings(txRes.data.earnings || [])
            setTotals(txRes.data.totals || { spentCents: 0, earnedCents: 0 })
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data
                const details = [
                    data?.error,
                    !data?.transfersActive ? 'Transfers capability inactive.' : undefined,
                    !data?.payoutsEnabled ? 'Payouts not enabled.' : undefined,
                    !data?.detailsSubmitted ? 'Account details incomplete.' : undefined,
                    data?.platformCountry && data?.sellerCountry ? `Platform: ${data.platformCountry}, Seller: ${data.sellerCountry}` : undefined,
                ].filter(Boolean).join(' ')
                console.error('Settle owed error:', details || 'Unable to settle owed. Please complete Stripe account setup.')
            } else {
                console.error('Settle owed error:', err)
            }
        }
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

    return (
        <div className="space-y-6">
            {/* Header & Status */}
            <div className="flex items-center justify-between py-4">
                <div>
                    <h2 className="text-xl font-semibold">Profit Sharing</h2>
                    <p className="text-sm text-gray-600">Connect Stripe to receive payouts for your sales.</p>
                </div>
                <div className="flex items-center gap-2">
                    {!connected ? (
                        <button
                            onClick={connectBank}
                            className="px-4 py-2 bg-primary text-white rounded-md"
                        >
                            Connect Bank Account
                        </button>
                    ) : (
                        <>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                                Connected
                            </span>
                            <span className={`px-3 py-1 rounded-md text-sm ${status?.payouts_enabled ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>
                                {status?.payouts_enabled ? "Payouts Enabled" : "Payouts Pending"}
                            </span>
                            <span className={`px-3 py-1 rounded-md text-sm ${status?.details_submitted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                Details {status?.details_submitted ? "Submitted" : "Missing"}
                            </span>
                            {needsAction && (
                                <button
                                    onClick={connectBank}
                                    className="px-4 py-2 bg-primary text-white rounded-md cursor-pointer"
                                >
                                    Details Missing
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Earned</div>
                    <div className="text-xl font-semibold">${earnedDollar}</div>
                    <div className="text-xs text-gray-500">Avg per sale: ${avgPerSale}</div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Owed</div>
                    <div className="text-xl font-semibold">${(owedCents / 100).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                        {accountReady && owedCents > 0
                            ? "Will transfer automatically"
                            : owedCents > 0
                                ? "Pending account setup"
                                : "Unpaid earnings"
                        }
                    </div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Platform Share</div>
                    <div className="text-xl font-semibold">${(platformShareCents / 100).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Lifetime fees</div>
                </div>
                <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Spent</div>
                    <div className="text-xl font-semibold">${spentDollar}</div>
                    <div className="text-xs text-gray-500">Purchases</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter:</span>
                <button
                    className={`text-sm px-3 py-1 rounded ${filter === 'all' ? 'bg-gray-200' : 'bg-gray-100'}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`text-sm px-3 py-1 rounded ${filter === 'tool' ? 'bg-gray-200' : 'bg-gray-100'}`}
                    onClick={() => setFilter('tool')}
                >
                    Tools
                </button>
                <button
                    className={`text-sm px-3 py-1 rounded ${filter === 'layout' ? 'bg-gray-200' : 'bg-gray-100'}`}
                    onClick={() => setFilter('layout')}
                >
                    Layouts
                </button>
            </div>

            {/* Earnings Table */}
            <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Your Earnings</h3>
                    <span className="text-sm text-gray-600">Count: {filteredEarnings.length}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600">
                                <th className="py-2 pr-3">Date</th>
                                <th className="py-2 pr-3">Type</th>
                                <th className="py-2 pr-3">Item</th>
                                <th className="py-2 pr-3">Seller Share</th>
                                <th className="py-2 pr-3">Platform Share</th>
                                <th className="py-2 pr-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="align-top">
                            {filteredEarnings.length === 0 ? (
                                <tr><td className="py-3 text-gray-500" colSpan={6}>No earnings yet.</td></tr>
                            ) : (
                                filteredEarnings.map((tx) => (
                                    <tr key={tx._id} className="border-t">
                                        <td className="py-2 pr-3">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        <td className="py-2 pr-3 capitalize">{tx.itemType}</td>
                                        <td className="py-2 pr-3">{tx.itemName || tx.itemId}</td>
                                        <td className="py-2 pr-3">${(tx.sellerShareCents / 100).toFixed(2)}</td>
                                        <td className="py-2 pr-3">${(tx.platformShareCents / 100).toFixed(2)}</td>
                                        <td className="py-2 pr-3">
                                            <span className={`px-2 py-0.5 rounded text-xs ${tx.paidToSeller ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {tx.paidToSeller ? 'Paid' : 'Owed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payments Table */}
            <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Your Payments</h3>
                    <span className="text-sm text-gray-600">Count: {filteredPayments.length}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600">
                                <th className="py-2 pr-3">Date</th>
                                <th className="py-2 pr-3">Type</th>
                                <th className="py-2 pr-3">Item</th>
                                <th className="py-2 pr-3">Amount</th>
                                <th className="py-2 pr-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.length === 0 ? (
                                <tr><td className="py-3 text-gray-500" colSpan={5}>No payments yet.</td></tr>
                            ) : (
                                filteredPayments.map((tx) => (
                                    <tr key={tx._id} className="border-t">
                                        <td className="py-2 pr-3">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                        <td className="py-2 pr-3 capitalize">{tx.itemType}</td>
                                        <td className="py-2 pr-3">{tx.itemName || tx.itemId}</td>
                                        <td className="py-2 pr-3">-${(tx.amountCents / 100).toFixed(2)}</td>
                                        <td className="py-2 pr-3">
                                            <span className={`px-2 py-0.5 rounded text-xs ${tx.status === 'paid' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}