import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  whatsapp_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d{10,15}$/, 'Please enter a valid WhatsApp ID']
  },
  display_name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['seller', 'admin'],
    default: 'seller'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  total_listings: {
    type: Number,
    default: 0
  },
  successful_sales: {
    type: Number,
    default: 0
  },
  first_message_date: {
    type: Date,
    default: Date.now
  },
  last_activity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes
UserSchema.index({ whatsapp_id: 1 });
UserSchema.index({ role: 1 });

export interface IUser extends mongoose.Document {
  whatsapp_id: string;
  display_name?: string;
  role: 'seller' | 'admin';
  is_active: boolean;
  total_listings: number;
  successful_sales: number;
  first_message_date: Date;
  last_activity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
