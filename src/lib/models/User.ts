import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  _id: string
  username: string
  name: string
  email: string
  password: string
  image?: string
  plan?: string | null
  description?: string | null
  charges?: number | null
  subscription_id?: string | null
  hasSubscribed?: string
  expiry_date?: Date | null
  phone?: string | null
  company?: string | null
  avatar?: string | null
  avatarPublicId?: string
  isVerified: boolean
  verificationToken?: string
  verificationTokenExpires?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    image: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    charges: {
      type: Number,
      default: null,
    },
    subscription_id: {
      type: String,
      default: null,
    },
    hasSubscribed: {
      type: String,
      enum: ['yes', 'no', 'trial'],
      default: 'no',
    },
    expiry_date: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    company: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarPublicId: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
)

// Create indexes for better performance
UserSchema.index({ subscription_id: 1 })

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
