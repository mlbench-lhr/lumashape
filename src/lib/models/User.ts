import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

// 1. Define the interface for a User document
// interface IUser
export interface IUser extends Document {
  firstName: string
  lastName: string
  username: string
  bio?: string
  email: string
  password: string
  resetPasswordOTP?: string
  resetPasswordExpires?: Date
  avatar?: string
  avatarPublicId?: string
  profilePic?: string
  phone?: string
  company?: string
  isDeleted: boolean
  deletedAt?: Date
  isVerified: boolean
  isPublic?: boolean
  // Subscription fields
  stripeCustomerId?: string
  subscriptionId?: string
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | null
  subscriptionPlan?: 'Free' | 'Pro' | 'Premium' | null
  subscriptionPeriodEnd?: Date
  createdAt: Date
  updatedAt: Date

  // Profit sharing / Stripe Connect
  stripeAccountId?: string

  comparePassword(candidatePassword: string): Promise<boolean>
}

// 2. Define the schema
const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot be more than 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot be more than 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot be more than 20 characters'],
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot be more than 200 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    avatar: {
      type: String,
    },
    avatarPublicId: {
      type: String,
    },
    profilePic: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
    },
    company: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Subscription fields
    stripeCustomerId: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete', null],
      default: null,
    },
    subscriptionPlan: {
      type: String,
      enum: ['Free', 'Pro', 'Premium', null],
      default: 'Free',
    },
    subscriptionPeriodEnd: {
      type: Date,
      default: null,
    },

    // Profit sharing / Stripe Connect
    stripeAccountId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// 3. Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// 4. Add password comparison method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// 5. Export the model
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User