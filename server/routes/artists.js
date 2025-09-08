const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const Release = require('../models/Release');
const { validateArtist } = require('../middleware/validation');
const { auth, adminAuth } = require('../middleware/auth');

// GET /api/artists - Get all artists
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      genre, 
      featured, 
      search,
      sort = '-createdAt'
    } = req.query;

    const query = { active: true };
    
    // Filter by genre
    if (genre) {
      query.genre = { $in: genre.split(',') };
    }
    
    // Filter by featured status
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: {
        path: 'releases',
        match: { published: true },
        select: 'title artwork releaseDate totalPlays',
        options: { sort: { releaseDate: -1 }, limit: 5 }
      }
    };

    const artists = await Artist.paginate(query, options);
    
    res.json({
      success: true,
      data: artists.docs,
      pagination: {
        page: artists.page,
        pages: artists.totalPages,
        total: artists.totalDocs,
        limit: artists.limit,
        hasNext: artists.hasNextPage,
        hasPrev: artists.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artists'
    });
  }
});

// GET /api/artists/featured - Get featured artists
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const artists = await Artist.find({ 
      featured: true, 
      active: true 
    })
    .limit(parseInt(limit))
    .sort('-totalPlays -createdAt')
    .populate({
      path: 'releases',
      match: { published: true },
      select: 'title artwork releaseDate',
      options: { sort: { releaseDate: -1 }, limit: 3 }
    });

    res.json({
      success: true,
      data: artists
    });
  } catch (error) {
    console.error('Error fetching featured artists:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured artists'
    });
  }
});

// GET /api/artists/:slug - Get single artist by slug
router.get('/:slug', async (req, res) => {
  try {
    const artist = await Artist.findOne({ 
      slug: req.params.slug, 
      active: true 
    })
    .populate({
      path: 'releases',
      match: { published: true },
      options: { sort: { releaseDate: -1 } }
    });

    if (!artist) {
      return res.status(404).json({
        success: false,
        error: 'Artist not found'
      });
    }

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artist'
    });
  }
});

// POST /api/artists - Create new artist (admin only)
router.post('/', adminAuth, validateArtist, async (req, res) => {
  try {
    const artist = new Artist(req.body);
    await artist.save();
    
    res.status(201).json({
      success: true,
      data: artist,
      message: 'Artist created successfully'
    });
  } catch (error) {
    console.error('Error creating artist:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Artist with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create artist'
    });
  }
});

// PUT /api/artists/:id - Update artist (admin only)
router.put('/:id', adminAuth, validateArtist, async (req, res) => {
  try {
    const artist = await Artist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!artist) {
      return res.status(404).json({
        success: false,
        error: 'Artist not found'
      });
    }

    res.json({
      success: true,
      data: artist,
      message: 'Artist updated successfully'
    });
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update artist'
    });
  }
});

// DELETE /api/artists/:id - Delete artist (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        error: 'Artist not found'
      });
    }

    // Check if artist has releases
    const releaseCount = await Release.countDocuments({ artist: artist._id });
    
    if (releaseCount > 0) {
      // Soft delete - mark as inactive
      artist.active = false;
      await artist.save();
      
      return res.json({
        success: true,
        message: 'Artist deactivated (has releases)'
      });
    } else {
      // Hard delete if no releases
      await artist.deleteOne();
      
      res.json({
        success: true,
        message: 'Artist deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete artist'
    });
  }
});

// POST /api/artists/:id/toggle-featured - Toggle featured status (admin only)
router.post('/:id/toggle-featured', adminAuth, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        error: 'Artist not found'
      });
    }

    artist.featured = !artist.featured;
    await artist.save();

    res.json({
      success: true,
      data: artist,
      message: `Artist ${artist.featured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle featured status'
    });
  }
});

module.exports = router;
