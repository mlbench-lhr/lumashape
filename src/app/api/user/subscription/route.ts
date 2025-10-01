import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'

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

    await dbConnect()

    const body = await req.json()
    const { plan_name, duration } = body

    if (plan_name === 'Free') {
      // Handle free trial
      const user = await User.findByIdAndUpdate(
        decoded._id || decoded.id,
        {
          plan: 'Free',
          hasSubscribed: 'trial',
          expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          charges: 0,
        },
        { new: true }
      )

      return NextResponse.json(
        {
          message: 'Free trial started successfully',
          data: {
            plan_name: 'Free',
            duration: '7 Days',
            user_id: user._id,
            added_on: new Date().toISOString(),
            expiry_on: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            charges: 0,
            status: 'Current',
            added_date: Date.now(),
            expiry_date: Date.now() + 7 * 24 * 60 * 60 * 1000,
          },
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid plan type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
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

    await dbConnect()

    const user = await User.findById(decoded.userId || decoded._id || decoded.id).select(
      'plan hasSubscribed expiry_date charges subscription_id'
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      subscription: {
        plan_name: user.plan || null,
        hasSubscribed: user.hasSubscribed || 'no',
        expiry_date: user.expiry_date || null,
        charges: user.charges || 0,
        subscription_id: user.subscription_id || null,
      },
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Error fetching subscription' },
      { status: 500 }
    )
  }
}