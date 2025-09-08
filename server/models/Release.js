const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Track title is required'],
    trim: true,
    maxlength: [200, 'Track title cannot exceed 200 characters']
  },
  
  duration: {
    type: String, // Format: "mm:ss"
    validate: {
      validator: function(v) {
        return !v || /^\d{1,2}:\d{2}$/.test(v);
      },
      message: 'Duration must be in mm:ss format'
    }
  },
  
  audioFile: {
    type: String, // URL or file path
    required: [true, 'Audio file is required']
  },
  
  trackNumber: {
    type: Number,
    required: true,
    min: 1
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  plays: {
    type: Number,
    default: 0
  }
});

const releaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Release title is required'],
    trim: true,
    maxlength: [200, 'Release title cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: [true, 'Artist is required']
  },
  
  releaseType: {
    type: String,
    enum: ['single', 'ep', 'album', 'compilation', 'remix'],
    required: [true, 'Release type is required'],
    lowercase: true
  },
  
  genre: [{
    type: String,
    enum: ['electronic', 'techno', 'house', 'ambient', 'experimental', 'drum-and-bass', 'dubstep', 'trance', 'other'],
    lowercase: true
  }],
  
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  artwork: {
    type: String, // URL or file path
    required: [true, 'Artwork is required']
  },
  
  tracks: [trackSchema],
  
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required']
  },
  
  catalogNumber: {
    type: String,
    unique: true,
    required: [true, 'Catalog number is required'],
    uppercase: true,
    trim: true
  },
  
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD',
    uppercase: true
  },
  
  streamingLinks: {
    spotify: String,
    appleMusic: String,
    soundcloud: String,
    bandcamp: String,
    beatport: String,
    youtube: String
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  published: {
    type: Boolean,
    default: false
  },
  
  totalPlays: {
    type: Number,
    default: 0
  },
  
  totalDownloads: {
    type: Number,
    default: 0
  },
  
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug from title and artist before saving
releaseSchema.pre('save', async function(next) {
  if (this.isModified('title') || this.isNew) {
    try {
      const artist = await mongoose.model('Artist').findById(this.artist);
      if (artist) {
        const baseSlug = `${artist.name}-${this.title}`
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Ensure uniqueness
        let slug = baseSlug;
        let counter = 1;
        while (await mongoose.model('Release').findOne({ slug, _id: { $ne: this._id } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        this.slug = slug;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Update artist's total releases count
releaseSchema.post('save', async function() {
  try {
    const count = await this.constructor.countDocuments({ artist: this.artist, published: true });
    await mongoose.model('Artist').findByIdAndUpdate(this.artist, { totalReleases: count });
  } catch (error) {
    console.error('Error updating artist release count:', error);
  }
});

// Update total plays when track plays change
releaseSchema.pre('save', function(next) {
  if (this.isModified('tracks')) {
    this.totalPlays = this.tracks.reduce((total, track) => total + (track.plays || 0), 0);
  }
  next();
});

// Virtual for formatted release date
releaseSchema.virtual('formattedReleaseDate').get(function() {
  return this.releaseDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Index for search and performance
releaseSchema.index({ title: 'text', description: 'text', 'tracks.title': 'text' });
releaseSchema.index({ slug: 1 });
releaseSchema.index({ artist: 1, releaseDate: -1 });
releaseSchema.index({ featured: -1, releaseDate: -1 });
releaseSchema.index({ genre: 1 });
releaseSchema.index({ releaseDate: -1 });
releaseSchema.index({ published: 1, releaseDate: -1 });

module.exports = mongoose.model('Release', releaseSchema);
