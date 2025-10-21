import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'
import dbConnect from '@/utils/dbConnect'
import Transaction from '@/lib/models/Transaction'
import User from '@/lib/models/User'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const JWT_SECRET = process.env.JWT_SECRET!
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' })

export async function POST(req: NextRequest) {
    try {
        await dbConnect()

        const token = req.headers.get('Authorization')?.split(' ')[1]
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
        const seller = await User.findOne({ email: decoded.email })
        if (!seller) return NextResponse.json({ error: 'User not found' }, { status: 404 })
        if (!seller.stripeAccountId) {
            return NextResponse.json({ error: 'Stripe account not connected' }, { status: 400 })
        }

        // Check capabilities and country match
        const platformAccount = await stripe.accounts.retrieve()
        const sellerAccount = await stripe.accounts.retrieve(seller.stripeAccountId)

        const transfersActive = sellerAccount.capabilities?.transfers === 'active'
        const countryMatch = platformAccount.country && sellerAccount.country && platformAccount.country === sellerAccount.country

        if (!transfersActive || !countryMatch) {
            return NextResponse.json({
                error: 'Transfers not eligible. Complete onboarding or ensure same-country accounts.',
                transfersActive,
                platformCountry: platformAccount.country,
                sellerCountry: sellerAccount.country,
            }, { status: 400 })
        }

        // Find owed transactions for this seller
        const owedTxs = await Transaction.find({
            sellerEmail: seller.email,
            status: 'paid',
            paidToSeller: false,
            sellerStripeAccountId: seller.stripeAccountId,
        }).lean()

        if (!owedTxs.length) {
            return NextResponse.json({ settledCount: 0, message: 'No owed transactions found.' })
        }

        const results: Array<{ id: string; transferId?: string; error?: string }> = []

        for (const tx of owedTxs) {
            try {
                if (!tx.stripePaymentIntentId) {
                    results.push({ id: String(tx._id), error: 'Missing payment intent id' })
                    continue
                }

                const pi = await stripe.paymentIntents.retrieve(tx.stripePaymentIntentId as string)
                const chargeId =
                    typeof pi.latest_charge === 'string'
                        ? (pi.latest_charge as string)
                        : (pi.latest_charge as Stripe.Charge | null)?.id

                const transferParams: Stripe.TransferCreateParams = {
                    amount: tx.sellerShareCents,
                    currency: tx.currency || 'usd',
                    destination: seller.stripeAccountId,
                    ...(chargeId ? { source_transaction: chargeId } : {}),
                }

                const transfer = await stripe.transfers.create(transferParams)

                await Transaction.updateOne(
                    { _id: tx._id },
                    { $set: { paidToSeller: true, stripeTransferId: transfer.id } }
                )

                results.push({ id: String(tx._id), transferId: transfer.id })
            } catch (e: unknown) {
                results.push({ id: String(tx._id), error: e instanceof Error ? e.message : 'Transfer failed' })
            }
        }

        const settledCount = results.filter(r => r.transferId).length
        return NextResponse.json({ settledCount, results })
    } catch (err) {
        console.error('Settle owed error:', err)
        return NextResponse.json({ error: 'Failed to settle owed transactions' }, { status: 500 })
    }
}