const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Artist = require('../models/Artist');
const Release = require('../models/Release');
const { adminAuth, generateAdminToken } = require('../middleware/auth');

// Admin login (simplified for demonstration)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple hardcoded admin credentials for demonstration
    // In production, use a proper user management system
    const adminCredentials = {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    };
    
    if (username !== adminCredentials.username || password !== adminCredentials.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    const token = generateAdminToken();
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: 'admin',
          username: adminCredentials.username,
          role: 'admin'
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalArtists,
      activeArtists,
      totalReleases,
      publishedReleases,
      featuredArtists,
      featuredReleases,
      recentReleases,
      topArtists
    ] = await Promise.all([
      Artist.countDocuments(),
      Artist.countDocuments({ active: true }),
      Release.countDocuments(),
      Release.countDocuments({ published: true }),
      Artist.countDocuments({ featured: true }),
      Release.countDocuments({ featured: true }),
      Release.find({ published: true })
        .populate('artist', 'name slug')
        .sort('-releaseDate')
        .limit(5),
      Artist.find({ active: true })
        .sort('-totalPlays -totalReleases')
        .limit(5)
        .select('name slug totalPlays totalReleases profileImage')
    ]);

    // Calculate total plays across all releases
    const totalPlaysResult = await Release.aggregate([
      { $match: { published: true } },
      { $group: { _id: null, totalPlays: { $sum: '$totalPlays' } } }
    ]);
    const totalPlays = totalPlaysResult[0]?.totalPlays || 0;

    // Get release statistics by genre
    const genreStats = await Release.aggregate([
      { $match: { published: true } },
      { $unwind: '$genre' },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get monthly release statistics
    const monthlyStats = await Release.aggregate([
      { 
        $match: { 
          published: true,
          releaseDate: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) 
          }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$releaseDate' },
            month: { $month: '$releaseDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalArtists,
          activeArtists,
          totalReleases,
          publishedReleases,
          featuredArtists,
          featuredReleases,
          totalPlays
        },
        recentReleases,
        topArtists,
        genreStats,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// GET /api/admin/artists - Get all artists (including inactive)
router.get('/artists', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status = 'all',
      sort = '-createdAt' 
    } = req.query;

    const query = {};
    
    if (status === 'active') query.active = true;
    if (status === 'inactive') query.active = false;
    if (search) query.$text = { $search: search };

    const artists = await Artist.find(query)
      .populate({
        path: 'releases',
        select: 'title releaseDate published',
        options: { sort: { releaseDate: -1 }, limit: 3 }
      })
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Artist.countDocuments(query);

    res.json({
      success: true,
      data: artists,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin artists:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch artists'
    });
  }
});

// GET /api/admin/releases - Get all releases (including unpublished)
router.get('/releases', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status = 'all',
      artist,
      sort = '-createdAt' 
    } = req.query;

    const query = {};
    
    if (status === 'published') query.published = true;
    if (status === 'unpublished') query.published = false;
    if (artist) query.artist = artist;
    if (search) query.$text = { $search: search };

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
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin releases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch releases'
    });
  }
});

// POST /api/admin/releases/:id/publish - Publish/unpublish release
router.post('/releases/:id/publish', adminAuth, async (req, res) => {
  try {
    const release = await Release.findById(req.params.id);
    
    if (!release) {
      return res.status(404).json({
        success: false,
        error: 'Release not found'
      });
    }

    release.published = !release.published;
    await release.save();

    res.json({
      success: true,
      data: release,
      message: `Release ${release.published ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    console.error('Error toggling release status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle release status'
    });
  }
});

// GET /api/admin/analytics - Get analytics data
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = new Date();
    switch (period) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      case '1y':
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    // Top tracks by plays
    const topTracks = await Release.aggregate([
      { $match: { published: true } },
      { $unwind: '$tracks' },
      { $sort: { 'tracks.plays': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'artists',
          localField: 'artist',
          foreignField: '_id',
          as: 'artistInfo'
        }
      },
      {
        $project: {
          trackTitle: '$tracks.title',
          trackPlays: '$tracks.plays',
          releaseTitle: '$title',
          artistName: { $arrayElemAt: ['$artistInfo.name', 0] }
        }
      }
    ]);

    // Genre distribution
    const genreDistribution = await Release.aggregate([
      { $match: { published: true } },
      { $unwind: '$genre' },
      { $group: { _id: '$genre', count: { $sum: 1 }, plays: { $sum: '$totalPlays' } } },
      { $sort: { count: -1 } }
    ]);

    // Release type distribution
    const releaseTypeDistribution = await Release.aggregate([
      { $match: { published: true } },
      { $group: { _id: '$releaseType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        topTracks,
        genreDistribution,
        releaseTypeDistribution,
        period
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// GET /api/admin/settings - Get admin settings
router.get('/settings', adminAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: 'Excess Music',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        emailEnabled: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        mongoDbConnected: true, // You could check actual MongoDB connection status
        uploadsEnabled: true
      },
      limits: {
        maxFileSize: '50MB',
        maxFilesPerUpload: 10,
        contactFormRateLimit: '3 per 15 minutes'
      }
    }
  });
});

module.exports = router;
