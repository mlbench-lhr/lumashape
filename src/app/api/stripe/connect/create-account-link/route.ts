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

    // Determine platform country to avoid mismatches (e.g., NL vs US)
    let platformCountry = 'US'
    try {
      const platformAccount = await stripe.accounts.retrieve()
      if (platformAccount.country) platformCountry = platformAccount.country
    } catch (e) {
      console.warn('Failed to retrieve platform Stripe account:', e)
    }

    let accountId = user.stripeAccountId

    if (!accountId) {
      // Create seller account in the same country as the platform
      try {
        const account = await stripe.accounts.create({
          type: 'express',
          country: platformCountry,
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
        if (isStripeError(e) && e.message.includes('signed up for Connect')) {
          return NextResponse.json(
            { error: 'Stripe Connect not enabled. Enable Connect (Express) in Dashboard settings and retry.' },
            { status: 400 }
          )
        }
        throw e
      }
    } else {
      // If existing account country mismatches, replace with a new account
      try {
        const sellerAccount = await stripe.accounts.retrieve(accountId)
        if (sellerAccount.country && sellerAccount.country !== platformCountry) {
          const newAccount = await stripe.accounts.create({
            type: 'express',
            country: platformCountry,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            metadata: { userId: String(user._id) },
          })
          accountId = newAccount.id
          user.stripeAccountId = accountId
          await user.save()
        }
      } catch (e: unknown) {
        if (isStripeError(e) && e.message.includes('signed up for Connect')) {
          return NextResponse.json(
            { error: 'Stripe Connect not enabled. Enable Connect (Express) in Dashboard settings and retry.' },
            { status: 400 }
          )
        }
        throw e
      }
    }

    // If onboarding is complete, open Express Dashboard; else resume onboarding
    const account = await stripe.accounts.retrieve(accountId)
    if (account.details_submitted) {
      const login = await stripe.accounts.createLoginLink(accountId)
      return NextResponse.json({ url: login.url })
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
