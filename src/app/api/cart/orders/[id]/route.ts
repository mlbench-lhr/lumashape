import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import ManufacturingOrder from '@/lib/models/ManufacturingOrder'

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const order = await ManufacturingOrder.findById(params.id).lean()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.buyerEmail.toLowerCase().trim() !== decoded.email.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}