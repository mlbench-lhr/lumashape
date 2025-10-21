import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const JWT_SECRET = process.env.JWT_SECRET!
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'https://lumashape.vercel.app'

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const user = await User.findOne({ email: decoded.email })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let accountId = user.stripeAccountId

    if (!accountId) {
      try {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { userId: String(user._id) },
        })
        accountId = account.id
        user.stripeAccountId = accountId
        await user.save()
      } catch (e: unknown) {
        if (isStripeError(e)) {
          if (e.message.includes('signed up for Connect')) {
            return NextResponse.json(
              {
                error:
                  'Stripe Connect is not enabled on your Stripe account. Enable Connect in Dashboard > Settings > Connect (Express) and retry.',
              },
              { status: 400 }
            )
          }
        }
        throw e
      }
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${DOMAIN}/profile/edit`,
      return_url: `${DOMAIN}/profile/edit`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: link.url })
  } catch (err) {
    console.error('Create account link error:', err)
    return NextResponse.json({ error: 'Failed to create account link' }, { status: 500 })
  }
}

// type guard for Stripe errors
function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    typeof (error as Stripe.errors.StripeError).message === 'string'
  )
}
