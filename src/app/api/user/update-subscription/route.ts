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
    
    // Type-safe status
    const subscriptionStatus = 
      subscription.status === 'active' || 
      subscription.status === 'canceled' || 
      subscription.status === 'past_due' || 
      subscription.status === 'trialing' || 
      subscription.status === 'incomplete' 
        ? subscription.status 
        : null
    
    user.subscriptionStatus = subscriptionStatus
    
    // Type-safe plan name
    const typedPlanName: 'Free' | 'Pro' | 'Premium' = 
      planName === 'Premium' ? 'Premium' : 
      planName === 'Pro' ? 'Pro' : 'Free'
    
    user.subscriptionPlan = typedPlanName
    
    // Type-safe period end
    const periodEnd = subscription['current_period_end' as keyof typeof subscription]
    if (periodEnd && typeof periodEnd === 'number') {
      user.subscriptionPeriodEnd = new Date(periodEnd * 1000)
    } else {
      user.subscriptionPeriodEnd = undefined
    }
    
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update subscription error:')
    return NextResponse.json(
      { error: `Failed to update subscription`},
      { status: 500 }
    )
  }
}