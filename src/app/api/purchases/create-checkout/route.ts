import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'
import Tool from '@/lib/models/Tool'
import Layout from '@/lib/models/layout'

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
        const buyer = await User.findOne({ email: decoded.email })
        if (!buyer) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const { itemType, itemId } = await req.json() as { itemType: 'tool' | 'layout', itemId: string }
        if (!itemType || !itemId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

        const item = itemType === 'tool'
            ? await Tool.findById(itemId)
            : await Layout.findById(itemId)

        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

        const sellerEmail = item.userEmail
        const seller = await User.findOne({ email: sellerEmail })

        const amountCents = 500
        const sellerShareCents = 250
        const platformShareCents = 250
        const currency = 'usd'

        // Ensure or create Stripe customer for buyer
        let customerId = buyer.stripeCustomerId
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

        // Destination charge to seller if connected; otherwise platform collects full amount
        const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData | undefined =
            seller?.stripeAccountId
                ? {
                    application_fee_amount: platformShareCents,
                    transfer_data: { destination: seller.stripeAccountId },
                }
                : undefined

        // Type guards to safely access properties on union types
        const hasToolProps = (doc: unknown): doc is { toolType: string; toolBrand: string } => {
            return !!doc && typeof doc === 'object' && 'toolType' in (doc as any) && 'toolBrand' in (doc as any)
        }
        const hasLayoutProps = (doc: unknown): doc is { name: string } => {
            return !!doc && typeof doc === 'object' && 'name' in (doc as any)
        }

        // Use guards to compute itemName without TypeScript errors
        const itemName = hasToolProps(item)
            ? `${item.toolType} (${item.toolBrand})`
            : hasLayoutProps(item)
                ? item.name
                : 'Item'

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency,
                    product_data: { name: itemName },
                    unit_amount: amountCents,
                },
                quantity: 1,
            }],
            success_url: `${DOMAIN}/payment/import-success?session_id={CHECKOUT_SESSION_ID}&item_type=${itemType}&item_id=${itemId}`,
            cancel_url: `${DOMAIN}/explore`,
            payment_intent_data: paymentIntentData,
            metadata: {
                buyerEmail: buyer.email,
                sellerEmail,
                sellerStripeAccountId: seller?.stripeAccountId || '',
                itemType,
                itemId,
                itemName,
                sellerShareCents: String(sellerShareCents),
                platformShareCents: String(platformShareCents),
            },
        })

        return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (err) {
        console.error('Create checkout error:', err)
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }
}