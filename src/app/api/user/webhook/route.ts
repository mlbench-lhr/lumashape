import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await dbConnect()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Safely extract metadata
        if (!session.metadata) {
          console.error('No metadata found in checkout session')
          break
        }
        
        const { user_id, plan_name, user_email } = session.metadata

        // Safely handle subscription ID
        let subscriptionId: string | null = null
        if (session.subscription) {
          subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id
        }

        // Update user subscription in database
        await User.findByIdAndUpdate(user_id, {
          plan: plan_name,
          hasSubscribed: 'yes',
          subscription_id: subscriptionId,
          charges: session.amount_total ? session.amount_total / 100 : 0,
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        })

        console.log(`Subscription created for user ${user_email}: ${plan_name}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Handle subscription property safely - use lines instead of subscription
        if (!invoice.lines?.data?.[0]?.subscription) {
          console.log('Invoice has no subscription associated')
          break
        }
        
        // Get subscription ID from invoice line items
        const subscriptionId = invoice.lines.data[0].subscription as string

        if (invoice.billing_reason === 'subscription_cycle') {
          // Renew subscription
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          // Safely handle customer
          let customerEmail = 'Unknown'
          if (subscription.customer) {
            const customerId = typeof subscription.customer === 'string' 
              ? subscription.customer 
              : subscription.customer.id
            
            const customer = await stripe.customers.retrieve(customerId)
            if (customer && !customer.deleted && customer.email) {
              customerEmail = customer.email
            }
          }

          await User.findOneAndUpdate(
            { subscription_id: subscriptionId },
            {
              expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              charges: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
            }
          )

          console.log(`Subscription renewed for customer ${customerEmail}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await User.findOneAndUpdate(
          { subscription_id: subscription.id },
          {
            plan: null,
            hasSubscribed: 'no',
            subscription_id: null,
            expiry_date: null,
          }
        )

        console.log(`Subscription cancelled: ${subscription.id}`)
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}