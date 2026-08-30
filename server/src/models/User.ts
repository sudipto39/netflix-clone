import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISubscription {
  status: 'none' | 'active' | 'canceled' | 'past_due' | 'unpaid';
  planId: 'mobile' | 'standard' | 'premium' | 'none';
  planName: string;
  planSpecs: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  cardLast4: string;
  cardBrand: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface IInvoice {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: string;
  card: string;
  paymentMethod?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  role: 'user' | 'admin';
  avatar?: string;
  subscription: ISubscription;
  invoices: IInvoice[];
  refreshTokens: string[];
  otpCode?: string | null;
  otpExpiresAt?: Date | null;
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    status: {
      type: String,
      enum: ['none', 'active', 'canceled', 'past_due', 'unpaid'],
      default: 'none',
    },
    planId: {
      type: String,
      enum: ['mobile', 'standard', 'premium', 'none'],
      default: 'none',
    },
    planName: {
      type: String,
      default: 'NO ACTIVE PLAN',
    },
    planSpecs: {
      type: String,
      default: 'No active subscription',
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    cardLast4: {
      type: String,
      default: '',
    },
    cardBrand: {
      type: String,
      default: '',
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: String, required: true },
    status: { type: String, default: 'Paid' },
    card: { type: String, default: 'Card' },
    paymentMethod: { type: String, default: 'card' },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: 'linear-gradient(135deg,#0072d2,#62d5ff)',
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({
        status: 'none',
        planId: 'none',
        planName: 'NO ACTIVE PLAN',
        planSpecs: 'No active subscription',
        cardLast4: '',
        cardBrand: '',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }),
    },
    invoices: {
      type: [invoiceSchema],
      default: [],
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    otpCode: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        delete obj.password;
        delete obj.refreshTokens;
        delete obj.__v;
        obj.id = obj._id;
        delete obj._id;
        return obj;
      },
    },
  }
);

// Compound index for instant OTP verification lookups
userSchema.index({ email: 1, otpCode: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
