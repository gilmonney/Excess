const jwt = require('jsonwebtoken');

// Simple authentication middleware (for demonstration)
// In production, you'd want a more robust user management system

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // For development, allow access without token if no JWT_SECRET is set
      if (!process.env.JWT_SECRET) {
        console.log('⚠️  Admin access granted (development mode - no JWT_SECRET set)');
        req.user = { id: 'dev-admin', role: 'admin' };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        error: 'Access denied. Admin token required.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid admin token.'
    });
  }
};

// Generate admin token (for development/setup)
const generateAdminToken = () => {
  const payload = {
    id: 'admin',
    role: 'admin',
    email: 'admin@excessmusic.com'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
};

module.exports = { auth, adminAuth, generateAdminToken };
