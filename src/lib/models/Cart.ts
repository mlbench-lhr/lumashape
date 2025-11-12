import mongoose, { Document, Model, Schema } from 'mongoose'

// Define the interface for a Cart Item
export interface ICartItem {
  id: string
  name: string
  brand?: string
  containerSize: string
  price: number
  snapshotUrl?: string
  quantity: number
  selected: boolean
  layoutData?: {
    canvas: {
      width: number
      height: number
      unit: 'mm' | 'inches'
      thickness: number
      materialColor?: string
    }
    tools: Array<{
      id: string
      name: string
      x: number
      y: number
      rotation: number
      flipHorizontal: boolean
      flipVertical: boolean
      depth: number
      unit: 'mm' | 'inches'
      opacity: number
      smooth: number
      image: string
      groupId?: string | null
    }>
  }
  createdAt: Date
  updatedAt: Date
}

// Define the interface for a Cart document
export interface ICart extends Document {
  userEmail: string
  items: ICartItem[]
  createdAt: Date
  updatedAt: Date
}

// Define the Cart Item schema
const CartItemSchema: Schema<ICartItem> = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    containerSize: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    snapshotUrl: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    selected: {
      type: Boolean,
      required: true,
      default: true,
    },
    layoutData: {
      canvas: {
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        unit: { type: String, required: true, enum: ['mm', 'inches'] },
        thickness: { type: Number, required: true },
        materialColor: { type: String, default: 'black' },
      },
      tools: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        rotation: { type: Number, required: true, default: 0 },
        flipHorizontal: { type: Boolean, required: true, default: false },
        flipVertical: { type: Boolean, required: true, default: false },
        depth: { type: Number, required: true },
        unit: { type: String, required: true, enum: ['mm', 'inches'] },
        opacity: { type: Number, required: true, default: 100 },
        smooth: { type: Number, required: true, default: 0 },
        image: { type: String, required: true },
        groupId: { type: String, default: null },
      }],
    },
  },
  {
    timestamps: true,
    _id: false,
  }
)

// Define the Cart schema
const CartSchema: Schema<ICart> = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // Removed index: true to avoid duplicate index warning
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes
CartSchema.index({ userEmail: 1 })
CartSchema.index({ 'items.id': 1 })

// Export the model
const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema)

export default Cart