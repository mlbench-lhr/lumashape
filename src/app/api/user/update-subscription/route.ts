import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET!
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // Verify authentication
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Decode token to get user email
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const userEmail = decoded.email

    // Find user in database
    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get session ID from request
    const { sessionId } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    if (!session.subscription) {
      return NextResponse.json({ error: 'No subscription found in session' }, { status: 400 })
    }

    // Get subscription details
    const subscription = session.subscription as Stripe.Subscription
    const planName = session.metadata?.plan || 'Pro'

    // Update user with subscription details
    user.subscriptionId = subscription.id
    
    // Fix for status type error - ensure it matches the enum in User model
    if (subscription.status === 'active' || 
        subscription.status === 'canceled' || 
        subscription.status === 'past_due' || 
        subscription.status === 'trialing' || 
        subscription.status === 'incomplete') {
      user.subscriptionStatus = subscription.status
    } else {
      // Default to null for any other status
      user.subscriptionStatus = null
    }
    
    // Fix for plan type error - ensure it matches the enum in User model
    if (planName === 'Pro' || planName === 'Premium') {
      user.subscriptionPlan = planName
    } else {
      user.subscriptionPlan = 'Free'
    }
    
    // Fix for subscriptionPeriodEnd - use the correct property access
    // The property exists in the Stripe API but TypeScript doesn't recognize it
    const periodEnd = (subscription as any).current_period_end
    if (periodEnd && typeof periodEnd === 'number') {
      user.subscriptionPeriodEnd = new Date(periodEnd * 1000)
    } else {
      // Use undefined instead of null to match the IUser interface
      user.subscriptionPeriodEnd = undefined
    }
    
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update subscription error:', error.message)
    return NextResponse.json(
      { error: `Failed to update subscription: ${error.message}` },
      { status: 500 }
    )
  }
}