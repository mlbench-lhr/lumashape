'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@/context/UserContext'
import { Eye } from 'lucide-react'

type OrderItem = {
  layoutId: string
  name: string
  quantity: number
}

type Totals = {
  customerTotal: number
}

type Order = {
  _id: string
  status: 'pending' | 'paid' | 'failed'
  items: OrderItem[]
  totals: Totals
  createdAt: string
}

export default function MyOrders() {
  const { user } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserLoading, setIsUserLoading] = useState(true)

  const isAuthenticated = () => {
    if (user) return true
    try { return !!localStorage.getItem('auth-token') } catch { return false }
  }

  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    setIsUserLoading(!!token && !user)
    const timeout = setTimeout(() => setIsUserLoading(false), 3000)
    return () => clearTimeout(timeout)
  }, [user])

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) return
        const res = await fetch('/api/cart/orders', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      } finally {
        setLoading(false)
      }
    }
    if (isAuthenticated()) load()
  }, [])

  if (isUserLoading || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">My Orders</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">My Orders</h1>
        <div className="text-center py-12">
          <div className="mb-4">
            <Image src="/images/icons/workspace/noLayouts.svg" alt="Login Required" width={120} height={120} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Please log in to view your orders</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access your order history</p>
          <button onClick={() => window.location.href = '/auth/login'} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90">
            Log In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 pt-24">
          <div className="mb-4">
            <Image src="/images/icons/workspace/noLayouts.svg" alt="No Orders" width={120} height={120} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-4">Place an order from your cart to see it here</p>
          <button onClick={() => window.location.href = '/cart'} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90">
            Go to Cart
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Inserts</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(order => {
                  const totalQty = order.items.reduce((s, i) => s + (i.quantity || 0), 0)
                  const date = new Date(order.createdAt).toLocaleString()
                  const total = `$${(order.totals?.customerTotal ?? 0).toFixed(2)}`
                  const shortId = `ORD-${order._id.slice(-6).toUpperCase()}`
                  const statusColor =
                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  return (
                    <tr key={order._id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{shortId}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{date}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded ${statusColor}`}>{order.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{totalQty}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{total}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/my-orders/${order._id}`} className="inline-flex items-center gap-2 text-[#2E6C99] hover:underline">
                          <Eye className="w-4 h-4" /> View Details
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}