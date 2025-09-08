const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');

// Ensure upload directories exist
const uploadDirs = ['uploads/audio', 'uploads/images', 'uploads/artwork'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '../../', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'audio' || file.mimetype.startsWith('audio/')) {
      uploadPath += 'audio/';
    } else if (file.fieldname === 'artwork' || file.fieldname === 'profileImage') {
      uploadPath += 'artwork/';
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/flac', 'audio/aac'],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    artwork: ['image/jpeg', 'image/png', 'image/webp']
  };

  let isValid = false;
  
  if (file.fieldname === 'audio') {
    isValid = allowedTypes.audio.includes(file.mimetype);
  } else if (file.fieldname === 'artwork' || file.fieldname === 'profileImage') {
    isValid = allowedTypes.artwork.includes(file.mimetype);
  } else if (file.mimetype.startsWith('image/')) {
    isValid = allowedTypes.image.includes(file.mimetype);
  } else if (file.mimetype.startsWith('audio/')) {
    isValid = allowedTypes.audio.includes(file.mimetype);
  }

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10 // max 10 files per request
  }
});

// POST /api/upload/audio - Upload audio files
router.post('/audio', adminAuth, upload.array('audio', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No audio files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      url: `/uploads/audio/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      data: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} audio file(s)`
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload audio files'
    });
  }
});

// POST /api/upload/artwork - Upload artwork/images
router.post('/artwork', adminAuth, upload.single('artwork'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No artwork file uploaded'
      });
    }

    const uploadedFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      url: `/uploads/artwork/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    res.json({
      success: true,
      data: uploadedFile,
      message: 'Artwork uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading artwork:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload artwork'
    });
  }
});

// POST /api/upload/profile - Upload profile image
router.post('/profile', adminAuth, upload.single('profileImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No profile image uploaded'
      });
    }

    const uploadedFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      url: `/uploads/artwork/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    res.json({
      success: true,
      data: uploadedFile,
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile image'
    });
  }
});

// POST /api/upload/multiple - Upload multiple files
router.post('/multiple', adminAuth, upload.fields([
  { name: 'audio', maxCount: 10 },
  { name: 'artwork', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 }
]), (req, res) => {
  try {
    const result = {
      audio: [],
      artwork: null,
      profileImage: null
    };

    if (req.files.audio) {
      result.audio = req.files.audio.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/audio/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      }));
    }

    if (req.files.artwork && req.files.artwork[0]) {
      const file = req.files.artwork[0];
      result.artwork = {
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/artwork/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      };
    }

    if (req.files.profileImage && req.files.profileImage[0]) {
      const file = req.files.profileImage[0];
      result.profileImage = {
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/artwork/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      };
    }

    res.json({
      success: true,
      data: result,
      message: 'Files uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    });
  }
});

// DELETE /api/upload/:filename - Delete uploaded file
router.delete('/:filename', adminAuth, (req, res) => {
  try {
    const filename = req.params.filename;
    const possiblePaths = [
      path.join(__dirname, '../../uploads/audio/', filename),
      path.join(__dirname, '../../uploads/images/', filename),
      path.join(__dirname, '../../uploads/artwork/', filename)
    ];

    let deleted = false;
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted = true;
        break;
      }
    }

    if (deleted) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// GET /api/upload/files - List uploaded files
router.get('/files', adminAuth, (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const files = {
      audio: [],
      images: [],
      artwork: []
    };

    const directories = {
      audio: path.join(__dirname, '../../uploads/audio/'),
      images: path.join(__dirname, '../../uploads/images/'),
      artwork: path.join(__dirname, '../../uploads/artwork/')
    };

    Object.keys(directories).forEach(dirType => {
      if (type === 'all' || type === dirType) {
        const dirPath = directories[dirType];
        if (fs.existsSync(dirPath)) {
          const dirFiles = fs.readdirSync(dirPath);
          files[dirType] = dirFiles.map(filename => {
            const filePath = path.join(dirPath, filename);
            const stats = fs.statSync(filePath);
            return {
              filename,
              url: `/uploads/${dirType}/${filename}`,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime
            };
          });
        }
      }
    });

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 10 files per request.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

module.exports = router;
