import React, { Suspense } from 'react'
import OrderSuccessClient from './OrderSuccessClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-4">Thank You</h1>
        <p className="text-gray-700 mb-6">Loading...</p>
      </div>
    }>
      <OrderSuccessClient />
    </Suspense>
  )
}