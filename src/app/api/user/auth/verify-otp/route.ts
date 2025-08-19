import { NextRequest, NextResponse } from 'next/server'
import User from '@/lib/models/User'
import dbConnect from '@/utils/dbConnect'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { email, otp }: { email: string; otp: string } = await req.json()
    console.log("OTP verification request for email:", email)

    // Validate inputs
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 })
    }

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: new Date() }
    })

    if (!user) {
      return NextResponse.json({ 
        message: 'Invalid or expired OTP' 
      }, { status: 400 })
    }

    // Generate a temporary token for password reset
    const resetToken = jwt.sign(
      { 
        userId: user._id?.toString(), 
        email: user.email,
        purpose: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: '15m' } // 15 minutes to reset password
    )

    // Clear OTP fields
    await User.findByIdAndUpdate(user._id, {
      $unset: {
        resetPasswordOTP: 1,
        resetPasswordExpires: 1
      },
       $set: {
    isVerified: true
  }
    })

    return NextResponse.json({ 
      message: 'OTP verified successfully',
      resetToken,
      verified: true
    }, { status: 200 })

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}