import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const JWT_SECRET = process.env.JWT_SECRET as string

// Define proper JWT payload interface
interface JWTPayload {
  _id?: string
  id?: string
  userId?: string
  email: string
  iat?: number
  exp?: number
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decoded: JWTPayload

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { price_id, plan_name } = body

    if (!price_id) {
      return NextResponse.json(
        { error: 'Missing Stripe price ID' },
        { status: 400 }
      )
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000'

    // Ensure all metadata values are strings (Stripe requirement)
    const userId = decoded._id || decoded.id || decoded.userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/workspace?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      customer_email: decoded.email,
      metadata: {
        user_id: userId,
        plan_name: plan_name || '',
        user_email: decoded.email,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Stripe Checkout Error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Something went wrong'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}