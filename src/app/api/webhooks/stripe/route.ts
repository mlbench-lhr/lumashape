import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

// Helper functions to handle different webhook events
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.subscription) return
  
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer.id

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription.id

  // Get subscription details - access the subscription data from the response
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
  const subscription = subscriptionResponse

  const planName = session.metadata?.plan || 'Pro'
  
  // Type-safe plan name
  const typedPlanName: 'Free' | 'Pro' | 'Premium' = 
    planName === 'Premium' ? 'Premium' : 
    planName === 'Pro' ? 'Pro' : 'Free'

  // Type-safe status
  const subscriptionStatus = 
    subscription.status === 'active' || 
    subscription.status === 'canceled' || 
    subscription.status === 'past_due' || 
    subscription.status === 'trialing' || 
    subscription.status === 'incomplete' 
      ? subscription.status 
      : null

  // Type-safe period end
  const periodEnd = subscription['current_period_end' as keyof typeof subscription]
  const subscriptionPeriodEnd = periodEnd && typeof periodEnd === 'number' 
    ? new Date(periodEnd * 1000) 
    : undefined

  await User.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      subscriptionId: subscriptionId,
      subscriptionStatus: subscriptionStatus,
      subscriptionPlan: typedPlanName,
      subscriptionPeriodEnd: subscriptionPeriodEnd,
    }
  )
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id
  
  // Type-safe plan name
  let typedPlanName: 'Free' | 'Pro' | 'Premium' = 'Pro'
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
    typedPlanName = 'Premium'
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
    typedPlanName = 'Pro'
  }
  
  // Type-safe status
  const subscriptionStatus = 
    subscription.status === 'active' || 
    subscription.status === 'canceled' || 
    subscription.status === 'past_due' || 
    subscription.status === 'trialing' || 
    subscription.status === 'incomplete' 
      ? subscription.status 
      : null

  // Type-safe period end
  const periodEnd = subscription['current_period_end' as keyof typeof subscription]
  const subscriptionPeriodEnd = periodEnd && typeof periodEnd === 'number' 
    ? new Date(periodEnd * 1000) 
    : undefined
  
  await User.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      subscriptionStatus: subscriptionStatus,
      subscriptionPlan: typedPlanName,
      subscriptionPeriodEnd: subscriptionPeriodEnd,
    }
  )
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Update user to free plan when subscription is canceled
  await User.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      subscriptionId: null,
      subscriptionStatus: null,
      subscriptionPlan: 'Free',
      subscriptionPeriodEnd: null,
    }
  )
}