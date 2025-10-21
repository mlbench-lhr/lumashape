import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import Transaction from '@/lib/models/Transaction'

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const email = decoded.email

    const payments = await Transaction.find({ buyerEmail: email }).sort({ createdAt: -1 }).lean()
    const earnings = await Transaction.find({ sellerEmail: email }).sort({ createdAt: -1 }).lean()

    const totalSpentCents = payments.reduce((s, t) => s + (t.amountCents || 0), 0)
    const totalEarnedCents = earnings.reduce((s, t) => s + (t.sellerShareCents || 0), 0)

    return NextResponse.json({
      payments,
      earnings,
      totals: {
        spentCents: totalSpentCents,
        earnedCents: totalEarnedCents,
      }
    })
  } catch (err) {
    console.error('List transactions error:', err)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}