# Excess Music - Full Stack Music Label Website

A modern music label website with 3D effects, backend API, and admin panel.

## Features

### Frontend
- **3D Interactive Homepage** - Three.js powered background with particle effects
- **Dynamic Artist Pages** - Search, filter, and browse artists
- **Responsive Design** - Works on all devices
- **Modern UI** - Glass morphism effects and smooth animations

### Backend API
- **RESTful API** - Complete CRUD operations for artists and releases
- **File Upload System** - Handle audio files and artwork
- **Contact Form** - Email integration with auto-replies
- **Admin Authentication** - JWT-based admin system
- **Database Integration** - MongoDB with Mongoose ODM
- **Rate Limiting** - Protect against spam and abuse

### Admin Panel
- **Dashboard** - Overview of artists, releases, and statistics
- **Content Management** - Add/edit artists and releases
- **File Management** - Upload and manage media files
- **System Health** - Monitor API and database status

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Copy `env.example` to `.env` and configure:
```bash
cp env.example .env
```

Edit `.env` with your settings:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/excess_music

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Email (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 4. Access the Application
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html
- **API**: http://localhost:3000/api

## API Documentation

### Artists Endpoints
```
GET    /api/artists              # Get all artists (with pagination/filters)
GET    /api/artists/featured     # Get featured artists
GET    /api/artists/:slug        # Get single artist by slug
POST   /api/artists              # Create new artist (admin only)
PUT    /api/artists/:id          # Update artist (admin only)
DELETE /api/artists/:id          # Delete artist (admin only)
```

### Releases Endpoints
```
GET    /api/releases             # Get all releases (with pagination/filters)
GET    /api/releases/featured    # Get featured releases
GET    /api/releases/latest      # Get latest releases
GET    /api/releases/:slug       # Get single release by slug
POST   /api/releases             # Create new release (admin only)
PUT    /api/releases/:id         # Update release (admin only)
DELETE /api/releases/:id         # Delete release (admin only)
POST   /api/releases/:id/play    # Increment play count
```

### Contact Endpoints
```
POST   /api/contact              # Send contact form
GET    /api/contact/info         # Get contact information
```

### Upload Endpoints
```
POST   /api/upload/audio         # Upload audio files (admin only)
POST   /api/upload/artwork       # Upload artwork (admin only)
POST   /api/upload/multiple      # Upload multiple files (admin only)
DELETE /api/upload/:filename     # Delete uploaded file (admin only)
```

### Admin Endpoints
```
POST   /api/admin/login          # Admin login
GET    /api/admin/dashboard      # Dashboard statistics
GET    /api/admin/artists        # Get all artists (including inactive)
GET    /api/admin/releases       # Get all releases (including unpublished)
GET    /api/admin/analytics      # Get analytics data
```

## Data Models

### Artist
```javascript
{
  name: String,           // Artist name
  slug: String,           // URL-friendly name
  bio: String,            // Artist biography
  profileImage: String,   // Profile image URL
  genre: [String],        // Music genres
  socialLinks: {          // Social media links
    instagram: String,
    twitter: String,
    soundcloud: String,
    spotify: String,
    website: String
  },
  featured: Boolean,      // Featured status
  active: Boolean,        // Active status
  totalReleases: Number,  // Total release count
  totalPlays: Number      // Total play count
}
```

### Release
```javascript
{
  title: String,          // Release title
  slug: String,           // URL-friendly title
  artist: ObjectId,       // Reference to Artist
  releaseType: String,    // single, ep, album, compilation, remix
  genre: [String],        // Music genres
  description: String,    // Release description
  artwork: String,        // Artwork image URL
  tracks: [{              // Track listing
    title: String,
    duration: String,     // mm:ss format
    audioFile: String,    // Audio file URL
    trackNumber: Number,
    plays: Number
  }],
  releaseDate: Date,      // Release date
  catalogNumber: String,  // Unique catalog number
  streamingLinks: {       // Streaming platform links
    spotify: String,
    appleMusic: String,
    soundcloud: String,
    bandcamp: String
  },
  featured: Boolean,      // Featured status
  published: Boolean,     // Published status
  totalPlays: Number      // Total play count
}
```

## Development

### Project Structure
```
├── server/              # Backend code
│   ├── index.js        # Main server file
│   ├── config/         # Configuration files
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── middleware/     # Custom middleware
├── js/                 # Frontend JavaScript
│   ├── api.js         # API client
│   ├── artists.js     # Artists page logic
│   └── homepage.js    # Homepage logic
├── uploads/           # File uploads directory
├── *.html            # Frontend pages
├── styles.css        # Main stylesheet
└── script.js         # Three.js effects
```

### Adding New Features

1. **New API Endpoint**: Add route in `server/routes/`
2. **New Data Model**: Create model in `server/models/`
3. **Frontend Feature**: Add JavaScript in `js/` directory
4. **Admin Feature**: Extend `admin.html` and API

### Database Setup

#### Using MongoDB locally:
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Connect to database
mongosh excess_music
```

#### Using MongoDB Atlas (cloud):
1. Create account at mongodb.com
2. Create cluster and get connection string
3. Update `MONGODB_URI` in `.env`

### Email Configuration

#### Gmail Setup:
1. Enable 2-factor authentication
2. Generate app password
3. Use app password in `EMAIL_PASS`

#### Custom SMTP:
```env
EMAIL_SERVICE=smtp
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## Deployment

### Environment Variables
Set these in your production environment:
- `NODE_ENV=production`
- `MONGODB_URI=your-production-db-url`
- `JWT_SECRET=secure-random-string`
- `ADMIN_USERNAME=your-admin-username`
- `ADMIN_PASSWORD=secure-admin-password`

### File Uploads
Ensure the `uploads/` directory has proper permissions:
```bash
mkdir -p uploads/{audio,images,artwork}
chmod 755 uploads/
```

### Security Considerations
- Change default admin credentials
- Use strong JWT secret
- Enable HTTPS in production
- Configure CORS for your domain
- Set up proper file upload limits
- Use environment variables for sensitive data

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Check MongoDB is running
- Verify connection string in `.env`
- Ensure database permissions

**File Upload Errors**
- Check `uploads/` directory permissions
- Verify file size limits
- Ensure proper MIME types

**Admin Login Issues**
- Verify credentials in `.env`
- Check JWT_SECRET is set
- Clear browser localStorage

### Support
For issues and questions, check the console logs and API responses for detailed error messages.

## License
MIT License - feel free to use this for your own music label projects!
