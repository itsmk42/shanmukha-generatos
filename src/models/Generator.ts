import mongoose from 'mongoose';

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
  timestamps: true,
  collection: 'generators'
});

// Indexes
GeneratorSchema.index({ status: 1 });
GeneratorSchema.index({ seller_id: 1 });
GeneratorSchema.index({ brand: 1 });
GeneratorSchema.index({ price: 1 });
GeneratorSchema.index({ hours_run: 1 });
GeneratorSchema.index({ tags: 1 });
GeneratorSchema.index({ createdAt: -1 });
GeneratorSchema.index({ 'audit_trail.whatsapp_message_id': 1 });

// Text index for search
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
    const tags = new Set<string>();
    
    if (this.brand) {
      this.brand.toLowerCase().split(/\s+/).forEach((word: string) => {
        if (word.length > 2) tags.add(word);
      });
    }
    
    if (this.model) {
      this.model.toLowerCase().split(/\s+/).forEach((word: string) => {
        if (word.length > 2) tags.add(word);
      });
    }
    
    if (this.location_text) {
      this.location_text.toLowerCase().split(/\s+/).forEach((word: string) => {
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
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

export interface IGenerator extends mongoose.Document {
  brand: string;
  model: string;
  price: number;
  hours_run: number;
  location_text: string;
  description: string;
  images: Array<{
    url: string;
    filename?: string;
    size?: number;
    mimetype?: string;
  }>;
  status: 'pending_review' | 'for_sale' | 'sold' | 'rejected' | 'failed_parsing';
  seller_id: mongoose.Types.ObjectId;
  audit_trail: {
    whatsapp_message_id: string;
    original_message_text?: string;
    parsed_at: Date;
    parsing_errors?: string[];
    approved_by?: mongoose.Types.ObjectId;
    approved_at?: Date;
    rejected_reason?: string;
  };
  tags: string[];
  views: number;
  whatsapp_clicks: number;
  sold_date?: Date;
  sold_price?: number;
  createdAt: Date;
  updatedAt: Date;
  formattedPrice: string;
  listingAge: string;
}

export default mongoose.models.Generator || mongoose.model<IGenerator>('Generator', GeneratorSchema);
