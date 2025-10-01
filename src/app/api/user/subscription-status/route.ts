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

export async function GET(req: NextRequest) {
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

    const user = await User.findOne({ email: decoded.email }).select(
      'plan hasSubscribed subscription_id expiry_date charges'
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if subscription is expired
    const isExpired = user.expiry_date && new Date() > user.expiry_date
    
    return NextResponse.json({
      plan: user.plan || 'Free',
      hasSubscribed: user.hasSubscribed || 'no',
      subscription_id: user.subscription_id,
      expiry_date: user.expiry_date,
      charges: user.charges,
      isExpired: isExpired,
      status: isExpired ? 'expired' : (user.hasSubscribed === 'yes' ? 'active' : 'inactive')
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}