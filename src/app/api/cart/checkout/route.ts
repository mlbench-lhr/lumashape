import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import dbConnect from '@/utils/dbConnect'
import Cart from '@/lib/models/Cart'
import ManufacturingOrder from '@/lib/models/ManufacturingOrder'
import { calculateOrderPricing, DEFAULT_PRICING } from '@/utils/pricing'

const JWT_SECRET = process.env.JWT_SECRET!
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'https://lumashape.vercel.app'

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const buyerEmail = decoded.email

    const cart = await Cart.findOne({ userEmail: buyerEmail }).lean()
    if (!cart || !Array.isArray(cart.items)) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    const { selectedItemIds } = await req.json().catch(() => ({ selectedItemIds: [] as string[] }))
    const selected = cart.items.filter(i => i.selected && (selectedItemIds?.length ? selectedItemIds.includes(i.id) : true))
    if (selected.length === 0) {
      return NextResponse.json({ error: 'No selected items' }, { status: 400 })
    }

    const itemsForPricing = selected.map(i => {
      const canvas = i.layoutData?.canvas ? {
        width: i.layoutData.canvas.width,
        height: i.layoutData.canvas.height,
        unit: i.layoutData.canvas.unit,
        thickness: i.layoutData.canvas.thickness,
        materialColor: i.layoutData.canvas.materialColor,
      } : undefined

      const toolsMini = Array.isArray(i.layoutData?.tools)
        ? i.layoutData!.tools!.map(t => ({
            isText: Boolean((t as any)?.isText) || ((t as any)?.toolBrand === 'TEXT' || (t as any)?.toolType === 'text'),
          }))
        : undefined

      return { id: i.id, name: i.name, quantity: i.quantity, layoutData: canvas ? { canvas, tools: toolsMini } : undefined }
    })

    const pricing = calculateOrderPricing(itemsForPricing, DEFAULT_PRICING)

    const totalQty = selected.reduce((s, i) => s + i.quantity, 0)

    const order = await ManufacturingOrder.create({
      buyerEmail,
      items: selected.map(i => ({
        layoutId: i.id,
        name: i.name,
        quantity: i.quantity,
        canvas: i.layoutData?.canvas,
        hasTextEngraving: Array.isArray(i.layoutData?.tools) && i.layoutData!.tools!.some(t => (t as any)?.isText || (t as any)?.toolBrand === 'TEXT' || (t as any)?.toolType === 'text'),
      })),
      totals: pricing.totals,
      parameters: pricing.parameters,
      status: 'pending',
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Custom Foam Order (${totalQty} inserts)` },
          unit_amount: Math.round(pricing.totals.customerTotal * 100),
        },
        quantity: 1,
      }],
      success_url: `${DOMAIN}/payment/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${DOMAIN}/cart`,
      metadata: {
        orderId: String(order._id),
        buyerEmail,
        totalCents: String(Math.round(pricing.totals.customerTotal * 100)),
        kaiserPayoutCents: String(Math.round(pricing.totals.kaiserPayout * 100)),
        lumashapePayoutCents: String(Math.round(pricing.totals.lumashapePayout * 100)),
        materialVolumeIn3: String(pricing.totals.materialVolumeIn3),
      },
    })

    order.stripeSessionId = session.id
    await order.save()

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('Cart checkout error:', err)
    return NextResponse.json({ error: 'Failed to initiate checkout' }, { status: 500 })
  }
}