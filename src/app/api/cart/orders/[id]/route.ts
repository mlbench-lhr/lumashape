import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import ManufacturingOrder from '@/lib/models/ManufacturingOrder'

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }

    const url = new URL(req.url)
    const id = url.pathname.split('/').filter(Boolean).pop()
    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
    }
    const order = await ManufacturingOrder.findById(id).lean()
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.buyerEmail.toLowerCase().trim() !== decoded.email.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}
