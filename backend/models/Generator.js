const mongoose = require('mongoose');

const GeneratorSchema = new mongoose.Schema({
  // Core generator information
  brand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  model: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  hours_run: {
    type: Number,
    required: true,
    min: 0
  },
  location_text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Media files
  images: [{
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number,
    mimetype: String
  }],
  
  // Status management
  status: {
    type: String,
    enum: ['pending_review', 'for_sale', 'sold', 'rejected', 'failed_parsing'],
    default: 'pending_review',
    required: true
  },
  
  // Relationships
  seller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Audit trail
  audit_trail: {
    whatsapp_message_id: {
      type: String,
      required: true,
      unique: true
    },
    original_message_text: String,
    parsed_at: {
      type: Date,
      default: Date.now
    },
    parsing_errors: [String],
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approved_at: Date,
    rejected_reason: String
  },
  
  // Auto-generated tags for searching
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Additional metadata
  views: {
    type: Number,
    default: 0
  },
  whatsapp_clicks: {
    type: Number,
    default: 0
  },
  
  // Sold information
  sold_date: Date,
  sold_price: Number
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'generators'
});

// Indexes for better query performance
GeneratorSchema.index({ status: 1 });
GeneratorSchema.index({ seller_id: 1 });
GeneratorSchema.index({ brand: 1 });
GeneratorSchema.index({ price: 1 });
GeneratorSchema.index({ hours_run: 1 });
GeneratorSchema.index({ tags: 1 });
GeneratorSchema.index({ createdAt: -1 });
GeneratorSchema.index({ 'audit_trail.whatsapp_message_id': 1 });

// Text index for search functionality
GeneratorSchema.index({
  brand: 'text',
  model: 'text',
  description: 'text',
  location_text: 'text',
  tags: 'text'
});

// Pre-save middleware to generate tags
GeneratorSchema.pre('save', function(next) {
  if (this.isModified('brand') || this.isModified('model') || this.isModified('location_text')) {
    const tags = new Set();
    
    // Add brand words
    if (this.brand) {
      this.brand.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) tags.add(word);
      });
    }
    
    // Add model words
    if (this.model) {
      this.model.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) tags.add(word);
      });
    }
    
    // Add location words
    if (this.location_text) {
      this.location_text.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) tags.add(word);
      });
    }
    
    this.tags = Array.from(tags);
  }
  next();
});

// Virtual for formatted price
GeneratorSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toLocaleString('en-IN')}`;
});

// Virtual for age calculation
GeneratorSchema.virtual('listingAge').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// Method to mark as sold
GeneratorSchema.methods.markAsSold = function(soldPrice = null) {
  this.status = 'sold';
  this.sold_date = new Date();
  if (soldPrice) this.sold_price = soldPrice;
  return this.save();
};

// Method to increment view count
GeneratorSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment WhatsApp clicks
GeneratorSchema.methods.incrementWhatsAppClicks = function() {
  this.whatsapp_clicks += 1;
  return this.save();
};

// Static method to find by WhatsApp message ID
GeneratorSchema.statics.findByMessageId = function(messageId) {
  return this.findOne({ 'audit_trail.whatsapp_message_id': messageId });
};

module.exports = mongoose.model('Generator', GeneratorSchema);
