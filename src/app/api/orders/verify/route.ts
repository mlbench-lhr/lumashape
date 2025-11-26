import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import ManufacturingOrder from '@/lib/models/ManufacturingOrder'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const JWT_SECRET = process.env.JWT_SECRET!

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    jwt.verify(token, JWT_SECRET)

    const { sessionId, orderId } = await req.json() as { sessionId: string; orderId: string }
    if (!sessionId || !orderId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ verified: false }, { status: 400 })
    }

    const order = await ManufacturingOrder.findById(orderId)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    order.status = 'paid'
    order.stripePaymentIntentId = (session.payment_intent as Stripe.PaymentIntent | null)?.id || null
    await order.save()

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('Order verify error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}