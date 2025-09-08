const Joi = require('joi');

// Artist validation schema
const artistSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().trim(),
  bio: Joi.string().max(2000).allow('').optional(),
  profileImage: Joi.string().uri().allow('').optional(),
  genre: Joi.array().items(
    Joi.string().valid('electronic', 'techno', 'house', 'ambient', 'experimental', 'drum-and-bass', 'dubstep', 'trance', 'other')
  ).optional(),
  socialLinks: Joi.object({
    instagram: Joi.string().uri().allow('').optional(),
    twitter: Joi.string().uri().allow('').optional(),
    soundcloud: Joi.string().uri().allow('').optional(),
    spotify: Joi.string().uri().allow('').optional(),
    website: Joi.string().uri().allow('').optional()
  }).optional(),
  featured: Joi.boolean().optional(),
  active: Joi.boolean().optional()
});

// Track validation schema
const trackSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().trim(),
  duration: Joi.string().pattern(/^\d{1,2}:\d{2}$/).optional(),
  audioFile: Joi.string().required(),
  trackNumber: Joi.number().integer().min(1).required(),
  featured: Joi.boolean().optional()
});

// Release validation schema
const releaseSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().trim(),
  artist: Joi.string().hex().length(24).required(), // MongoDB ObjectId
  releaseType: Joi.string().valid('single', 'ep', 'album', 'compilation', 'remix').required(),
  genre: Joi.array().items(
    Joi.string().valid('electronic', 'techno', 'house', 'ambient', 'experimental', 'drum-and-bass', 'dubstep', 'trance', 'other')
  ).optional(),
  description: Joi.string().max(1000).allow('').optional(),
  artwork: Joi.string().required(),
  tracks: Joi.array().items(trackSchema).min(1).required(),
  releaseDate: Joi.date().required(),
  catalogNumber: Joi.string().min(1).max(20).required().trim(),
  price: Joi.number().min(0).optional(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP').optional(),
  streamingLinks: Joi.object({
    spotify: Joi.string().uri().allow('').optional(),
    appleMusic: Joi.string().uri().allow('').optional(),
    soundcloud: Joi.string().uri().allow('').optional(),
    bandcamp: Joi.string().uri().allow('').optional(),
    beatport: Joi.string().uri().allow('').optional(),
    youtube: Joi.string().uri().allow('').optional()
  }).optional(),
  featured: Joi.boolean().optional(),
  published: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().trim()).optional()
});

// Contact form validation schema
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  email: Joi.string().email().required().trim(),
  subject: Joi.string().min(5).max(200).required().trim(),
  message: Joi.string().min(10).max(2000).required().trim(),
  type: Joi.string().valid('general', 'booking', 'demo', 'press', 'support').optional()
});

// Middleware functions
const validateArtist = (req, res, next) => {
  const { error } = artistSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details
    });
  }
  
  next();
};

const validateRelease = (req, res, next) => {
  const { error } = releaseSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details
    });
  }
  
  next();
};

const validateContact = (req, res, next) => {
  const { error } = contactSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details
    });
  }
  
  next();
};

// Additional validation helpers
const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  validateArtist,
  validateRelease,
  validateContact,
  validateObjectId,
  validateEmail,
  validateUrl,
  schemas: {
    artistSchema,
    releaseSchema,
    contactSchema,
    trackSchema
  }
};
