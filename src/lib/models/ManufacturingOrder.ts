import mongoose, { Document, Model, Schema } from 'mongoose'

type Unit = 'mm' | 'inches'
type Status = 'pending' | 'paid' | 'failed'

export interface IOrderItem {
  layoutId: string
  name: string
  quantity: number
  canvas: { width: number; height: number; unit: Unit; thickness: number; materialColor?: string }
  hasTextEngraving: boolean
  dxfUrl?: string
}

export interface IPricingTotals {
  materialVolumeIn3: number
  materialCost: number
  materialCostWithWaste: number
  engravingFee: number
  designTimeCost: number
  machineTimeCost: number
  consumablesCost: number
  packagingCost: number
  totalCostBeforeMargins: number
  kaiserPayout: number
  lumashapePayout: number
  customerSubtotal: number
  discountPct: number
  discountAmount: number
  customerSubtotalAfterDiscount: number
  shippingCost: number
  customerTotal: number
}

export interface IPricingParams {
  materialCostPerIn3: number
  engravingFlatFee: number
  designTimeFlatFee: number
  wasteFactor: number
  machineTimeFlatFee: number
  consumablesFlatFee: number
  shippingFlatFee: number
  packagingCostPerOrder: number
  kaiserMarginPct: number
  lumashapeMarginPct: number
}

export interface IShipping {
  name: string
  email?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export interface IManufacturingOrder extends Document {
  buyerEmail: string
  items: IOrderItem[]
  totals: IPricingTotals
  parameters: IPricingParams
  shipping?: IShipping
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
  dxfUrl: { type: String },
}, { _id: false })

const ManufacturingOrderSchema = new Schema<IManufacturingOrder>({
  buyerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  items: { type: [OrderItemSchema], required: true },
  totals: {
    materialVolumeIn3: { type: Number, required: true },
    materialCost: { type: Number, required: true },
    materialCostWithWaste: { type: Number, required: true },
    engravingFee: { type: Number, required: true },
    designTimeCost: { type: Number, required: true, default: 0 },
    machineTimeCost: { type: Number, required: true, default: 0 },
    consumablesCost: { type: Number, required: true },
    packagingCost: { type: Number, required: true },
    totalCostBeforeMargins: { type: Number, required: true },
    kaiserPayout: { type: Number, required: true },
    lumashapePayout: { type: Number, required: true },
    customerSubtotal: { type: Number, required: true, default: 0 },
    discountPct: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    customerSubtotalAfterDiscount: { type: Number, required: true, default: 0 },
    shippingCost: { type: Number, required: true, default: 0 },
    customerTotal: { type: Number, required: true },
  },
  parameters: {
    materialCostPerIn3: { type: Number, required: true },
    engravingFlatFee: { type: Number, required: true },
    designTimeFlatFee: { type: Number, required: true, default: 0 },
    wasteFactor: { type: Number, required: true },
    machineTimeFlatFee: { type: Number, required: true, default: 0 },
    consumablesFlatFee: { type: Number, required: true, default: 0 },
    shippingFlatFee: { type: Number, required: true, default: 0 },
    packagingCostPerOrder: { type: Number, required: true },
    kaiserMarginPct: { type: Number, required: true },
    lumashapeMarginPct: { type: Number, required: true },
  },
  shipping: {
    name: { type: String },
    email: { type: String },
    address1: { type: String },
    address2: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    phone: { type: String },
  },
  stripeSessionId: { type: String, default: null, index: true },
  stripePaymentIntentId: { type: String, default: null, index: true },
  status: { type: String, required: true, enum: ['pending', 'paid', 'failed'], default: 'pending' },
}, { timestamps: true })

ManufacturingOrderSchema.index({ buyerEmail: 1, createdAt: -1 })

const ManufacturingOrder: Model<IManufacturingOrder> =
  mongoose.models.ManufacturingOrder || mongoose.model<IManufacturingOrder>('ManufacturingOrder', ManufacturingOrderSchema)

export default ManufacturingOrder