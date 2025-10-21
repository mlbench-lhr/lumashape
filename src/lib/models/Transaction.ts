import mongoose, { Document, Model, Schema } from 'mongoose'

export type ItemType = 'tool' | 'layout'
export type TxStatus = 'pending' | 'paid' | 'failed'

export interface ITransaction extends Document {
  buyerEmail: string
  sellerEmail: string
  sellerStripeAccountId?: string | null
  itemType: ItemType
  itemId: string
  itemName?: string
  currency: string
  amountCents: number
  platformShareCents: number
  sellerShareCents: number
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  status: TxStatus
  paidToSeller: boolean
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema: Schema<ITransaction> = new mongoose.Schema(
  {
    buyerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    sellerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    sellerStripeAccountId: { type: String, default: null },
    itemType: { type: String, required: true, enum: ['tool', 'layout'], index: true },
    itemId: { type: String, required: true, index: true },
    itemName: { type: String, default: '' },
    currency: { type: String, required: true, default: 'usd' },
    amountCents: { type: Number, required: true, default: 500 },
    platformShareCents: { type: Number, required: true, default: 250 },
    sellerShareCents: { type: Number, required: true, default: 250 },
    stripeSessionId: { type: String, default: null, index: true },
    stripePaymentIntentId: { type: String, default: null, index: true },
    status: { type: String, required: true, default: 'pending', enum: ['pending', 'paid', 'failed'] },
    paidToSeller: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
)

TransactionSchema.index({ buyerEmail: 1, createdAt: -1 })
TransactionSchema.index({ sellerEmail: 1, createdAt: -1 })

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema)

export default Transaction