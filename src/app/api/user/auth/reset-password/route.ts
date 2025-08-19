import { NextRequest, NextResponse } from "next/server"
import User from "@/lib/models/User"
import dbConnect from "@/utils/dbConnect"
import jwt, { JwtPayload as JwtDefaultPayload } from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET as string

// Custom payload interface
export interface JwtPayload extends JwtDefaultPayload {
  userId: string
  email: string
  username: string
  purpose: string
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const {
      resetToken,
      newPassword,
    }: { resetToken: string; newPassword: string } = await req.json()

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { message: "Reset token and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Safely decode JWT
    const decoded = jwt.verify(resetToken, JWT_SECRET)

    if (
      typeof decoded !== "object" ||
      !("userId" in decoded) ||
      !("purpose" in decoded) ||
      (decoded as JwtPayload).purpose !== "password-reset"
    ) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    const { userId } = decoded as JwtPayload

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    user.password = hashedPassword
    await user.save()

    return NextResponse.json(
      { message: "Password reset successful", success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
