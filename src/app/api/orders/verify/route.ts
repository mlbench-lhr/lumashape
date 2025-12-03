import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import ManufacturingOrder, { IShipping } from '@/lib/models/ManufacturingOrder'
import Cart from '@/lib/models/Cart'
import nodemailer from 'nodemailer'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const JWT_SECRET = process.env.JWT_SECRET!

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    jwt.verify(token, JWT_SECRET)

    const { sessionId, orderId } = await req.json() as { sessionId: string; orderId: string }
    if (!sessionId || !orderId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ verified: false }, { status: 400 })
    }

    const order = await ManufacturingOrder.findById(orderId)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    order.status = 'paid'
    order.stripePaymentIntentId = (session.payment_intent as Stripe.PaymentIntent | null)?.id || null
    await order.save()

    try {
      const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}mailLogo.jpg`
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      const ship: Partial<IShipping> = (order.shipping || {}) as Partial<IShipping>
      const itemsHtml = Array.isArray(order.items) ? order.items.map(i => {
        const dims = i.canvas ? `${i.canvas.width} x ${i.canvas.height} ${i.canvas.unit}, ${i.canvas.thickness}"` : ''
        return `<tr><td style="padding:8px;border:1px solid #eee;">${i.name}</td><td style="padding:8px;border:1px solid #eee;">${i.quantity}</td><td style="padding:8px;border:1px solid #eee;">${dims}</td></tr>`
      }).join('') : ''
      const totalQty = Array.isArray(order.items) ? order.items.reduce((s, x) => s + x.quantity, 0) : 0
      const total = order.totals?.customerTotal || 0
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #000;">
          <div style="text-align:center;margin-bottom:16px;">
            <img src="${logoUrl}" alt="Lumashape" width="200" style="pointer-events:none; user-drag:none; -webkit-user-drag:none;" />
          </div>
          <h2 style="text-align:center;color:#2E6C99;margin:0 0 8px;">Order Confirmation</h2>
          <p style="text-align:center;margin:0 0 24px;">Thank you for your order. Please review your shipping details and items below.</p>
          <h3 style="margin:16px 0 8px;">Shipping Address</h3>
          <div style="border:1px solid #eee;border-radius:8px;padding:12px;">
            <div>${ship.name || ''}</div>
            <div>${ship.address1 || ''}${ship.address2 ? ', ' + ship.address2 : ''}</div>
            <div>${ship.city || ''}${ship.state ? ', ' + ship.state : ''} ${ship.postalCode || ''}</div>
            <div>${ship.country || ''}</div>
            <div>${ship.phone ? 'Phone: ' + ship.phone : ''}</div>
            <div>${ship.email ? 'Email: ' + ship.email : ''}</div>
          </div>
          <h3 style="margin:16px 0 8px;">Items</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;border:1px solid #eee;">Item</th>
                <th style="text-align:left;padding:8px;border:1px solid #eee;">Qty</th>
                <th style="text-align:left;padding:8px;border:1px solid #eee;">Dimensions</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top:16px;">
            <div style="font-weight:600;">Total Inserts: ${totalQty}</div>
            <div style="font-weight:600;">Order Total: ${Number(total).toFixed(2)}</div>
          </div>
        </div>
      `
      const text = `Order Confirmation\n\nShipping:\n${ship.name || ''}\n${ship.address1 || ''}${ship.address2 ? ', ' + ship.address2 : ''}\n${ship.city || ''}${ship.state ? ', ' + ship.state : ''} ${ship.postalCode || ''}\n${ship.country || ''}\n${ship.phone ? 'Phone: ' + ship.phone : ''}\n${ship.email ? 'Email: ' + ship.email : ''}\n\nItems:\n${Array.isArray(order.items) ? order.items.map(i => `- ${i.name} x${i.quantity}`).join('\n') : ''}\n\nTotal Inserts: ${totalQty}\nOrder Total: ${Number(total).toFixed(2)}`
      await transporter.sendMail({
        from: `"Lumashape" <${process.env.SMTP_USER}>`,
        to: order.buyerEmail,
        subject: 'Order Confirmation - Lumashape',
        html,
        text,
      })
    } catch {}

    try {
      const cart = await Cart.findOne({ userEmail: order.buyerEmail })
      if (cart && Array.isArray(order.items) && order.items.length > 0) {
        const removeIds = order.items.map(i => i.layoutId)
        cart.items = cart.items.filter(item => !removeIds.includes(item.id))
        await cart.save()
      }
    } catch {}

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('Order verify error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}