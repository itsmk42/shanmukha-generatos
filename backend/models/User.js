const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  whatsapp_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Format: "9198xxxxxxxx"
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
  // Additional fields for better user management
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
  // Track when user was first seen
  first_message_date: {
    type: Date,
    default: Date.now
  },
  // Track last activity
  last_activity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users'
});

// Index for faster queries
UserSchema.index({ whatsapp_id: 1 });
UserSchema.index({ role: 1 });

// Virtual for user's active listings
UserSchema.virtual('activeListings', {
  ref: 'Generator',
  localField: '_id',
  foreignField: 'seller_id',
  match: { status: 'for_sale' }
});

// Method to update last activity
UserSchema.methods.updateActivity = function() {
  this.last_activity = new Date();
  return this.save();
};

// Static method to find or create user
UserSchema.statics.findOrCreate = async function(whatsappId, displayName = null) {
  let user = await this.findOne({ whatsapp_id: whatsappId });
  
  if (!user) {
    user = new this({
      whatsapp_id: whatsappId,
      display_name: displayName || `User ${whatsappId.slice(-4)}`
    });
    await user.save();
  } else if (displayName && !user.display_name) {
    user.display_name = displayName;
    await user.save();
  }
  
  return user;
};

module.exports = mongoose.model('User', UserSchema);
