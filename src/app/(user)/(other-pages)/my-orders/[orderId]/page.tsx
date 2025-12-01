'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, Download, Eye, MapPin, Phone, Mail } from 'lucide-react'

type Canvas = { width: number; height: number; unit: 'mm' | 'inches'; thickness: number; materialColor?: string }
type OrderItem = { layoutId: string; name: string; quantity: number; canvas?: Canvas; hasTextEngraving: boolean; dxfUrl?: string }
type Totals = {
  materialVolumeIn3: number
  materialCost: number
  materialCostWithWaste: number
  engravingFee: number
  consumablesCost: number
  packagingCost: number
  totalCostBeforeMargins: number
  kaiserPayout: number
  lumashapePayout: number
  customerTotal: number
}
type Shipping = { name?: string; email?: string; address1?: string; address2?: string; city?: string; state?: string; postalCode?: string; country?: string; phone?: string }
type Order = { _id: string; status: 'pending' | 'paid' | 'failed'; items: OrderItem[]; totals: Totals; shipping?: Shipping; createdAt: string; updatedAt?: string }

const StatusBadge = ({ status }: { status: 'pending' | 'paid' | 'failed' }) => {
  const configs = {
    paid: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle, label: 'Paid' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Failed' },
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: 'Pending' }
  }
  const config = configs[status]
  const Icon = config.icon
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
    </div>
  )
}

export default function OrderDetails() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        if (!token) { router.push('/auth/login'); return }
        const res = await fetch(`/api/cart/orders/${params.orderId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) { router.push('/my-orders'); return }
        const data = await res.json()
        setOrder(data.order)
      } finally {
        setLoading(false)
      }
    }
    if (params.orderId) load()
  }, [params.orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 rounded"></div>
              <div className="w-32 h-5 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <Link href="/my-orders" className="text-[#2E6C99] hover:text-[#235478] font-medium transition-colors">
              Back to My Orders
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">The order you're looking for does not exist or you don't have access to view it.</p>
            <Link href="/my-orders" className="inline-flex items-center gap-2 px-6 py-3 bg-[#2E6C99] text-white rounded-lg hover:bg-[#235478] transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Return to My Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const shortId = `#${order._id.slice(-8).toUpperCase()}`
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const subtotal = order.totals.customerTotal
  const estimatedTax = subtotal * 0.08
  const shipping = 15.00
  const total = subtotal + estimatedTax + shipping

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <Link href="/my-orders" className="text-[#2E6C99] hover:text-[#235478] font-medium transition-colors">
              Back to My Orders
            </Link>
          </div>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Print Order
          </button>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Order {shortId}</h1>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Placed on {orderDate}</span>
              </div>
            </div>
            <div className="lg:text-right">
              <div className="text-sm text-gray-600 mb-1">Order Total</div>
              <div className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <div key={item.layoutId} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                Quantity: {item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Specifications */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {item.canvas && (
                            <>
                              <div className="text-sm">
                                <span className="text-gray-600">Dimensions:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {item.canvas.width} × {item.canvas.height} {item.canvas.unit}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Thickness:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {item.canvas.thickness}"
                                </span>
                              </div>
                              {item.canvas.materialColor && (
                                <div className="text-sm">
                                  <span className="text-gray-600">Foam Color:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {item.canvas.materialColor}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          {item.hasTextEngraving && (
                            <div className="text-sm col-span-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Text Engraving Included
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                          <Link 
                            href={`/inspect-layout/${item.layoutId}`}
                            className="inline-flex items-center gap-2 text-sm text-[#2E6C99] hover:text-[#235478] font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Layout
                          </Link>
                          {item.dxfUrl && (
                            <>
                              <span className="text-gray-300">|</span>
                              <a 
                                href={item.dxfUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-[#2E6C99] hover:text-[#235478] font-medium transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                Download DXF
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Card */}
            {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Tax (8%)</span>
                  <span className="font-medium text-gray-900">${estimatedTax.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                </div>
              </div>
              <div className="p-6">
                {order.shipping?.name ? (
                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">{order.shipping.name}</div>
                      {order.shipping.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Mail className="w-4 h-4" />
                          <span>{order.shipping.email}</span>
                        </div>
                      )}
                      {order.shipping.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{order.shipping.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{order.shipping.address1}</div>
                          {order.shipping.address2 && <div>{order.shipping.address2}</div>}
                          <div>{order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}</div>
                          <div className="font-medium mt-1">{order.shipping.country === 'US' ? 'United States' : order.shipping.country}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No shipping information available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Status Timeline */}
            {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    order.status === 'paid' || order.status === 'pending' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`w-4 h-4 ${
                      order.status === 'paid' || order.status === 'pending' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Order Placed</div>
                    <div className="text-sm text-gray-600">{orderDate}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    order.status === 'paid' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {order.status === 'paid' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : order.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Payment</div>
                    <div className="text-sm text-gray-600">
                      {order.status === 'paid' ? 'Payment confirmed' : 
                       order.status === 'failed' ? 'Payment failed' : 
                       'Awaiting payment'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100`}>
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Processing</div>
                    <div className="text-sm text-gray-600">
                      {order.status === 'paid' ? 'Your order is being prepared' : 'Pending'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100`}>
                    <Truck className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Shipped</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}