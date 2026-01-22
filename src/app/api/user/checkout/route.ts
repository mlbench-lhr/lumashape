import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET!
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'https://lumashape.com'

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

        // Get request body
        const { price_id, plan_name } = await req.json()
        console.log('Request body:', { price_id, plan_name })
        
        if (!price_id) {
            return NextResponse.json({ error: 'Price ID is required' }, { status: 400 })
        }

        // Create or retrieve Stripe customer (validate existing ID)
        let customerId = user.stripeCustomerId
        let validCustomer = false
        if (customerId) {
            try {
                const existing = await stripe.customers.retrieve(customerId)
                validCustomer = Boolean(existing && (existing as any).id === customerId)
            } catch (e) {
                console.warn('Existing Stripe customer invalid or not found, recreating:', customerId)
                validCustomer = false
            }
        }
        if (!customerId || !validCustomer) {
            console.log('Creating new Stripe customer')
            try {
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: user.username,
                    metadata: {
                        userId: String(user._id),
                    },
                })
                customerId = customer.id
                user.stripeCustomerId = customerId
                await user.save()
            } catch (customerError) {
                console.error('Error creating customer:', customerError)
                return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
            }
        }

        // Ensure plan_name is a valid value
        const typedPlanName: 'Free' | 'Pro' | 'Premium' = 
            plan_name === 'Premium' ? 'Premium' : 
            plan_name === 'Pro' ? 'Pro' : 'Free'

        // Create checkout session
        console.log('Creating checkout session with price_id:', price_id)
        try {
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                line_items: [
                    {
                        price: price_id,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${DOMAIN}/payment/cancel`,
                metadata: {
                    userId: String(user._id),
                    plan: typedPlanName,
                },
            })

            return NextResponse.json({ sessionId: session.id, url: session.url })
        } catch (sessionError) {
            // Type-safe error handling
            const errorMessage = sessionError instanceof Error 
                ? sessionError.message 
                : 'Unknown error occurred';
                
            console.error('Error creating session:', errorMessage)
            return NextResponse.json(
                { error: `Failed to create checkout session: ${errorMessage}` },
                { status: 500 }
            )
        }
    } catch (error) {
        // Type-safe error handling
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred';
            
        console.error('Checkout error:', errorMessage)
        return NextResponse.json(
            { error: `Failed to create checkout session: ${errorMessage}` },
            { status: 500 }
        )
    }
}