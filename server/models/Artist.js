const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Artist name is required'],
    trim: true,
    maxlength: [100, 'Artist name cannot exceed 100 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  bio: {
    type: String,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  
  profileImage: {
    type: String, // URL or file path
    default: null
  },
  
  genre: [{
    type: String,
    enum: ['electronic', 'techno', 'house', 'ambient', 'experimental', 'drum-and-bass', 'dubstep', 'trance', 'other'],
    lowercase: true
  }],
  
  socialLinks: {
    instagram: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?instagram\.com\//.test(v);
        },
        message: 'Invalid Instagram URL'
      }
    },
    twitter: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?twitter\.com\//.test(v);
        },
        message: 'Invalid Twitter URL'
      }
    },
    soundcloud: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?soundcloud\.com\//.test(v);
        },
        message: 'Invalid SoundCloud URL'
      }
    },
    spotify: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(open\.)?spotify\.com\//.test(v);
        },
        message: 'Invalid Spotify URL'
      }
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Invalid website URL'
      }
    }
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  active: {
    type: Boolean,
    default: true
  },
  
  joinedDate: {
    type: Date,
    default: Date.now
  },
  
  totalReleases: {
    type: Number,
    default: 0
  },
  
  totalPlays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug from name before saving
artistSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Virtual for releases
artistSchema.virtual('releases', {
  ref: 'Release',
  localField: '_id',
  foreignField: 'artist'
});

// Index for search and performance
artistSchema.index({ name: 'text', bio: 'text' });
artistSchema.index({ slug: 1 });
artistSchema.index({ featured: -1, createdAt: -1 });
artistSchema.index({ genre: 1 });

module.exports = mongoose.model('Artist', artistSchema);
