import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import User from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET as string

interface JWTPayload {
  email: string
  _id?: string
  id?: string
  userId?: string
  iat?: number
  exp?: number
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    const { plan_name = 'Pro' } = await req.json()

    // Manually update subscription for testing
    const updatedUser = await User.findOneAndUpdate(
      { email: decoded.email },
      {
        plan: plan_name,
        hasSubscribed: 'yes',
        subscription_id: `test_sub_${Date.now()}`,
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        charges: 20,
      },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Subscription updated successfully',
      user: {
        email: updatedUser.email,
        plan: updatedUser.plan,
        hasSubscribed: updatedUser.hasSubscribed,
        subscription_id: updatedUser.subscription_id,
        expiry_date: updatedUser.expiry_date
      }
    })
  } catch (error) {
    console.error('Test subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}