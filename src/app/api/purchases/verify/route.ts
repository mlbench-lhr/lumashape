import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import Transaction from '@/lib/models/Transaction'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const JWT_SECRET = process.env.JWT_SECRET!

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const { sessionId } = await req.json() as { sessionId: string }
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })

    if (session.mode !== 'payment' || session.payment_status !== 'paid') {
      return NextResponse.json({ verified: false }, { status: 400 })
    }

    const pi = session.payment_intent as Stripe.PaymentIntent | null
    const meta = session.metadata || {}
    const paidToSeller = !(meta.payoutDeferred === 'true') && Boolean(meta.sellerStripeAccountId)

    const tx = await Transaction.create({
      buyerEmail: meta.buyerEmail,
      sellerEmail: meta.sellerEmail,
      sellerStripeAccountId: meta.sellerStripeAccountId || null,
      itemType: meta.itemType,
      itemId: meta.itemId,
      itemName: meta.itemName,
      currency: session.currency || 'usd',
      amountCents: session.amount_total || 500,
      platformShareCents: Number(meta.platformShareCents || 250),
      sellerShareCents: Number(meta.sellerShareCents || 250),
      stripeSessionId: session.id,
      stripePaymentIntentId: pi?.id || null,
      status: 'paid',
      paidToSeller,
    })

    return NextResponse.json({ verified: true, itemType: meta.itemType, itemId: meta.itemId, transactionId: tx._id })
  } catch (err) {
    console.error('Verify purchase error:', err)
    return NextResponse.json({ error: 'Failed to verify purchase' }, { status: 500 })
  }
}