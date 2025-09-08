const express = require('express');
const router = express.Router();
const Release = require('../models/Release');
const Artist = require('../models/Artist');
const { validateRelease } = require('../middleware/validation');
const { auth, adminAuth } = require('../middleware/auth');

// GET /api/releases - Get all releases
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      genre, 
      artist, 
      releaseType,
      featured, 
      search,
      sort = '-releaseDate'
    } = req.query;

    const query = { published: true };
    
    // Filter by genre
    if (genre) {
      query.genre = { $in: genre.split(',') };
    }
    
    // Filter by artist
    if (artist) {
      query.artist = artist;
    }
    
    // Filter by release type
    if (releaseType) {
      query.releaseType = releaseType;
    }
    
    // Filter by featured status
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    const releases = await Release.find(query)
      .populate('artist', 'name slug profileImage')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Release.countDocuments(query);

    res.json({
      success: true,
      data: releases,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch releases'
    });
  }
});

// GET /api/releases/featured - Get featured releases
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const releases = await Release.find({ 
      featured: true, 
      published: true 
    })
    .populate('artist', 'name slug profileImage')
    .limit(parseInt(limit))
    .sort('-releaseDate -totalPlays');

    res.json({
      success: true,
      data: releases
    });
  } catch (error) {
    console.error('Error fetching featured releases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured releases'
    });
  }
});

// GET /api/releases/latest - Get latest releases
router.get('/latest', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const releases = await Release.find({ published: true })
      .populate('artist', 'name slug profileImage')
      .sort('-releaseDate')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: releases
    });
  } catch (error) {
    console.error('Error fetching latest releases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest releases'
    });
  }
});

// GET /api/releases/:slug - Get single release by slug
router.get('/:slug', async (req, res) => {
  try {
    const release = await Release.findOne({ 
      slug: req.params.slug, 
      published: true 
    })
    .populate('artist', 'name slug profileImage bio socialLinks');

    if (!release) {
      return res.status(404).json({
        success: false,
        error: 'Release not found'
      });
    }

    res.json({
      success: true,
      data: release
    });
  } catch (error) {
    console.error('Error fetching release:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch release'
    });
  }
});

// POST /api/releases - Create new release (admin only)
router.post('/', adminAuth, validateRelease, async (req, res) => {
  try {
    // Verify artist exists
    const artist = await Artist.findById(req.body.artist);
    if (!artist) {
      return res.status(400).json({
        success: false,
        error: 'Artist not found'
      });
    }

    const release = new Release(req.body);
    await release.save();
    
    await release.populate('artist', 'name slug profileImage');

    res.status(201).json({
      success: true,
      data: release,
      message: 'Release created successfully'
    });
  } catch (error) {
    console.error('Error creating release:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Release with this catalog number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create release'
    });
  }
});

// PUT /api/releases/:id - Update release (admin only)
router.put('/:id', adminAuth, validateRelease, async (req, res) => {
  try {
    const release = await Release.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('artist', 'name slug profileImage');

    if (!release) {
      return res.status(404).json({
        success: false,
        error: 'Release not found'
      });
    }

    res.json({
      success: true,
      data: release,
      message: 'Release updated successfully'
    });
  } catch (error) {
    console.error('Error updating release:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update release'
    });
  }
});

// DELETE /api/releases/:id - Delete release (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const release = await Release.findByIdAndDelete(req.params.id);
    
    if (!release) {
      return res.status(404).json({
        success: false,
        error: 'Release not found'
      });
    }

    res.json({
      success: true,
      message: 'Release deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting release:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete release'
    });
  }
});

// POST /api/releases/:id/play - Increment play count for a track
router.post('/:id/play', async (req, res) => {
  try {
    const { trackId } = req.body;
    
    const release = await Release.findById(req.params.id);
    if (!release) {
      return res.status(404).json({
        success: false,
        error: 'Release not found'
      });
    }

    if (trackId) {
      // Increment specific track play count
      const track = release.tracks.id(trackId);
      if (track) {
        track.plays = (track.plays || 0) + 1;
      }
    }

    // Recalculate total plays
    release.totalPlays = release.tracks.reduce((total, track) => total + (track.plays || 0), 0);
    
    await release.save();

    // Update artist total plays
    const artist = await Artist.findById(release.artist);
    if (artist) {
      const artistReleases = await Release.find({ artist: artist._id });
      const totalPlays = artistReleases.reduce((total, rel) => total + (rel.totalPlays || 0), 0);
      artist.totalPlays = totalPlays;
      await artist.save();
    }

    res.json({
      success: true,
      data: { plays: trackId ? release.tracks.id(trackId).plays : release.totalPlays }
    });
  } catch (error) {
    console.error('Error updating play count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update play count'
    });
  }
});

// POST /api/releases/:id/toggle-featured - Toggle featured status (admin only)
router.post('/:id/toggle-featured', adminAuth, async (req, res) => {
  try {
    const release = await Release.findById(req.params.id);
    
    if (!release) {
      return res.status(404).json({
        success: false,
        error: 'Release not found'
      });
    }

    release.featured = !release.featured;
    await release.save();

    res.json({
      success: true,
      data: release,
      message: `Release ${release.featured ? 'featured' : 'unfeatured'} successfully`
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
