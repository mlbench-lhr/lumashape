import mongoose, { Document, Model, Schema } from 'mongoose'

type Unit = 'mm' | 'inches'
type Status = 'pending' | 'paid' | 'failed'

export interface IOrderItem {
  layoutId: string
  name: string
  quantity: number
  canvas: { width: number; height: number; unit: Unit; thickness: number; materialColor?: string }
  hasTextEngraving: boolean
}

export interface IPricingTotals {
  materialVolumeIn3: number
  materialCost: number
  materialCostWithWaste: number
  engravingFee: number
  consumablesCost: number
  packagingCost: number
  totalCostBeforeMargins: number
  kaiserPayout: number
  lumashapePayout: number
  customerTotal: number
}

export interface IPricingParams {
  materialCostPerIn3: number
  engravingFlatFee: number
  wasteFactor: number
  consumablesCostPerInsert: number
  packagingCostPerOrder: number
  kaiserMarginPct: number
  lumashapeMarginPct: number
}

export interface IManufacturingOrder extends Document {
  buyerEmail: string
  items: IOrderItem[]
  totals: IPricingTotals
  parameters: IPricingParams
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  status: Status
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  layoutId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  canvas: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    unit: { type: String, required: true, enum: ['mm', 'inches'] },
    thickness: { type: Number, required: true },
    materialColor: { type: String, default: 'black' },
  },
  hasTextEngraving: { type: Boolean, required: true, default: false },
}, { _id: false })

const ManufacturingOrderSchema = new Schema<IManufacturingOrder>({
  buyerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  items: { type: [OrderItemSchema], required: true },
  totals: {
    materialVolumeIn3: { type: Number, required: true },
    materialCost: { type: Number, required: true },
    materialCostWithWaste: { type: Number, required: true },
    engravingFee: { type: Number, required: true },
    consumablesCost: { type: Number, required: true },
    packagingCost: { type: Number, required: true },
    totalCostBeforeMargins: { type: Number, required: true },
    kaiserPayout: { type: Number, required: true },
    lumashapePayout: { type: Number, required: true },
    customerTotal: { type: Number, required: true },
  },
  parameters: {
    materialCostPerIn3: { type: Number, required: true },
    engravingFlatFee: { type: Number, required: true },
    wasteFactor: { type: Number, required: true },
    consumablesCostPerInsert: { type: Number, required: true },
    packagingCostPerOrder: { type: Number, required: true },
    kaiserMarginPct: { type: Number, required: true },
    lumashapeMarginPct: { type: Number, required: true },
  },
  stripeSessionId: { type: String, default: null, index: true },
  stripePaymentIntentId: { type: String, default: null, index: true },
  status: { type: String, required: true, enum: ['pending', 'paid', 'failed'], default: 'pending' },
}, { timestamps: true })

ManufacturingOrderSchema.index({ buyerEmail: 1, createdAt: -1 })

const ManufacturingOrder: Model<IManufacturingOrder> =
  mongoose.models.ManufacturingOrder || mongoose.model<IManufacturingOrder>('ManufacturingOrder', ManufacturingOrderSchema)

export default ManufacturingOrder