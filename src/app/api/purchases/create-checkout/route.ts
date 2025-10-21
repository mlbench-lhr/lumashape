import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'
import Tool from '@/lib/models/Tool'
import Layout from '@/lib/models/layout'

// Env vars
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const JWT_SECRET = process.env.JWT_SECRET!
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'https://lumashape.vercel.app'

// Stripe init
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

// --- Type Definitions ---

interface JwtPayload {
  email: string
}

interface CheckoutPayload {
  itemType: 'tool' | 'layout'
  itemId: string
}

interface ToolDoc {
  _id: string
  toolType: string
  toolBrand: string
  userEmail: string
}

interface LayoutDoc {
  _id: string
  name: string
  userEmail: string
}

type ItemDoc = ToolDoc | LayoutDoc

// --- Type Guards ---

function isToolDoc(doc: unknown): doc is ToolDoc {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    'toolType' in doc &&
    'toolBrand' in doc &&
    'userEmail' in doc
  )
}

function isLayoutDoc(doc: unknown): doc is LayoutDoc {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    'name' in doc &&
    'userEmail' in doc
  )
}

// --- Main Handler ---

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const buyer = await User.findOne({ email: decoded.email })
    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { itemType, itemId }: CheckoutPayload = await req.json()
    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const item = itemType === 'tool'
      ? await Tool.findById(itemId)
      : await Layout.findById(itemId)

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Strongly typed after guards
    const sellerEmail = (isToolDoc(item) || isLayoutDoc(item)) ? item.userEmail : ''
    const seller = await User.findOne({ email: sellerEmail })

    const amountCents = 500
    const sellerShareCents = 250
    const platformShareCents = 250
    const currency = 'usd'

    // Ensure Stripe customer exists
    let customerId = buyer.stripeCustomerId as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: buyer.email,
        name: buyer.username,
        metadata: { userId: String(buyer._id) },
      })
      customerId = customer.id
      buyer.stripeCustomerId = customerId
      await buyer.save()
    }

    // Seller connected account setup (+ capability check)
    const sellerStripeAccountId = seller?.stripeAccountId
    let canDestinationCharge = false

    // Get platform account country
    let platformCountry: string | undefined
    try {
      const platformAccount = await stripe.accounts.retrieve()
      platformCountry = platformAccount.country
    } catch (e) {
      console.warn('Failed to retrieve platform Stripe account:', e)
    }

    if (sellerStripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(sellerStripeAccountId)
        const transfersActive = account.capabilities?.transfers === 'active'
        canDestinationCharge = Boolean(transfersActive)
      } catch (e) {
        console.warn('Failed to retrieve seller Stripe account:', e)
      }
    }

    const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData | undefined =
      sellerStripeAccountId && canDestinationCharge
        ? {
            application_fee_amount: platformShareCents,
            transfer_data: { destination: sellerStripeAccountId },
            on_behalf_of: sellerStripeAccountId,
          }
        : undefined

    // Determine item name safely
    const itemName = isToolDoc(item)
      ? `${item.toolType} (${item.toolBrand})`
      : isLayoutDoc(item)
        ? item.name
        : 'Item'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: itemName },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${DOMAIN}/payment/import-success?session_id={CHECKOUT_SESSION_ID}&item_type=${itemType}&item_id=${itemId}`,
      cancel_url: `${DOMAIN}/explore`,
      payment_intent_data: paymentIntentData,
      metadata: {
        buyerEmail: buyer.email,
        sellerEmail,
        sellerStripeAccountId: sellerStripeAccountId || '',
        itemType,
        itemId,
        itemName,
        sellerShareCents: String(sellerShareCents),
        platformShareCents: String(platformShareCents),
        payoutDeferred: String(Boolean(sellerStripeAccountId) && !canDestinationCharge),
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('Create checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
