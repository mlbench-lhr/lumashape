import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const JWT_SECRET = process.env.JWT_SECRET!

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const user = await User.findOne({ email: decoded.email })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (!user.stripeAccountId) {
      return NextResponse.json({ connected: false })
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId)
    return NextResponse.json({
      connected: true,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      transfers_active: account.capabilities?.transfers === 'active',
    })
  } catch (err) {
    console.error('Account status error:', err)
    return NextResponse.json({ error: 'Failed to fetch account status' }, { status: 500 })
  }
}