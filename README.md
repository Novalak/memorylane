# MemoryLane 🖼️

A beautiful, modern memorial website application for sharing and displaying photos with advanced slideshow functionality. Built with React, TypeScript, and Express.js, designed for easy deployment with Docker.

![MemoryLane Preview](https://img.shields.io/badge/Status-Production%20Ready-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)

## ✨ Features

### 📸 **Advanced Photo Management**
- **Drag & Drop Upload**: Intuitive file upload with progress tracking
- **Multiple Formats**: Supports JPG, PNG, GIF, WebP, AVIF, TIFF, BMP, ICO, HEIC, HEIF
- **HEIC Conversion**: Automatic conversion of HEIC/HEIF files to JPEG
- **Thumbnail Generation**: Optimized thumbnails for faster loading
- **File Validation**: Size limits (50MB per file, 50 files per batch)
- **Progress Tracking**: Real-time upload progress with cancel functionality

### 🎬 **Professional Slideshow**
- **Full-Screen Mode**: Immersive viewing experience
- **Customizable Transitions**: Fade, slide, zoom, flip, Ken Burns, and more
- **Photo Selection**: Choose specific photos or use all photos
- **Speed Control**: Adjustable timing (2-15 seconds per photo)
- **Random Order**: Sequential or random photo arrangement
- **Uploader Attribution**: Display photo contributor names

### ⚙️ **Admin Panel**
- **Configuration Management**: Customize headings, feature images, and settings
- **Photo Management**: Delete and rotate photos
- **Export Functionality**: Download all photos as ZIP files
- **Password Protection**: Secure admin access
- **Upload Controls**: Enable/disable uploads and slideshow

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on desktop and mobile
- **Beautiful Animations**: Smooth transitions and hover effects
- **Dark/Light Themes**: Automatic theme detection
- **Accessibility**: Keyboard navigation and screen reader support
- **Modern Components**: Built with Radix UI and Tailwind CSS

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/Novalak/memorylane.git
cd memorylane

# Start the application
docker-compose up -d

# Access the application
open http://localhost:4173
```

### Option 2: Docker Run

```bash
# Build and run the container
docker build -t memorylane .
docker run -d \
  --name memorylane \
  -p 4173:4173 \
  -v memorylane_images:/app/images \
  -v memorylane_exports:/app/exports \
  memorylane

# Access the application
open http://localhost:4173
```

### Option 3: Manual Installation

```bash
# Install dependencies
yarn install

# Build the application
yarn build

# Start the server
yarn start
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `4173` | Server port |

### Admin Settings

Access admin settings by clicking the settings icon and entering the default password: `admin123`

**Available Settings:**
- **Feature Picture**: Upload and position a main display image
- **Heading Text**: Customize the main heading
- **Copyright Text**: Set footer copyright text
- **Browser Window Title**: Customize browser tab title
- **Upload Password**: Require password for uploads
- **Uploader Name Display**: Control how uploader names are shown
- **Export Management**: Create and manage photo downloads

### Slideshow Configuration

**Photo Selection:**
- **Use All Photos**: Include all uploaded photos (default)
- **Custom Selection**: Choose specific photos from thumbnail grid

**Slideshow Options:**
- **Speed**: 2-15 seconds per photo
- **Transition Effects**: Fade, slide-left, slide-right, zoom-in, zoom-out, flip, crossfade, Ken Burns, random
- **Order**: Sequential or random photo order
- **Uploader Names**: Show/hide photo contributor names
- **Fullscreen**: Toggle fullscreen mode

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload single image with progress tracking |
| `GET` | `/api/images` | List all images with metadata |
| `DELETE` | `/api/images/:filename` | Delete specific image |
| `POST` | `/api/images/:filename/rotate` | Rotate image (90°, 180°, 270°) |
| `POST` | `/api/export/create` | Create ZIP export of all images |
| `GET` | `/api/export/download/:filename` | Download ZIP file |
| `DELETE` | `/api/export/:filename` | Delete export file |
| `GET` | `/api/export/status` | Check export status |

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Radix UI** for accessible components
- **React Hook Form** for form management

### Backend
- **Express.js** server
- **Multer** for file uploads
- **Sharp** for image processing
- **Archiver** for ZIP creation
- **CORS** enabled for cross-origin requests

### File Structure
```
memorylane/
├── src/
│   ├── components/generated/
│   │   └── MemoryLane.tsx         # Main application component
│   ├── App.tsx                    # App entry point
│   └── main.tsx                   # React root
├── server.cjs                     # Express server
├── docker-compose.yml             # Docker Compose configuration
├── Dockerfile                     # Multi-stage Docker build
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## 🐳 Docker Configuration

### Multi-Stage Build
- **Builder Stage**: Installs dependencies and builds the application
- **Production Stage**: Creates optimized runtime image with security best practices

### Security Features
- **Non-root User**: Runs as `memorylane` user (UID 1001)
- **Minimal Base Image**: Alpine Linux for smaller attack surface
- **Health Checks**: Built-in container health monitoring
- **Resource Limits**: Memory and CPU constraints

### Volumes
- `memorylane_images`: Persistent storage for uploaded photos
- `memorylane_exports`: Storage for generated ZIP files

## 📊 Performance Features

### Image Optimization
- **Automatic Thumbnails**: 300x300px optimized thumbnails
- **HEIC Conversion**: Automatic conversion to JPEG for compatibility
- **Lazy Loading**: Images load as needed
- **Progressive Enhancement**: Works without JavaScript

### Upload Optimization
- **Individual File Processing**: Prevents memory issues with large batches
- **Progress Tracking**: Real-time upload progress
- **Error Recovery**: Continues with remaining files if one fails
- **Retry Logic**: Automatic retry for failed operations
- **File Validation**: Pre-upload validation for size and type

## 🔒 Security

### File Upload Security
- **File Type Validation**: Strict MIME type checking
- **Size Limits**: 50MB per file, 50 files per batch
- **Path Sanitization**: Prevents directory traversal attacks
- **Automatic Cleanup**: Removes failed uploads

### Admin Security
- **Password Protection**: Configurable admin password
- **Upload Password**: Optional upload password requirement
- **Session Management**: Secure admin sessions

## 🌐 Browser Support

- **Chrome** 90+ (recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Docker (for containerized deployment)
- Modern web browser

### Development Scripts
```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
yarn format       # Format code with Prettier
yarn format:check # Check code formatting
```

### Development Setup
```bash
# Clone and install
git clone https://github.com/Novalak/memorylane.git
cd memorylane
yarn install

# Start development server
yarn dev

# Access at http://localhost:5173
```

## 📦 Deployment

### Production Deployment
```bash
# Using Docker Compose
docker-compose up -d

# Using Docker Swarm
docker stack deploy -c docker-compose.yml memorylane

# Using Kubernetes (example)
kubectl apply -f k8s/
```

### Environment-Specific Configuration
```bash
# Production
NODE_ENV=production docker-compose up -d

# Development
NODE_ENV=development docker-compose up -d
```

## 📈 Monitoring

### Health Checks
- **Container Health**: Built-in Docker health checks
- **API Endpoints**: Health check endpoint available
- **Resource Monitoring**: Memory and CPU usage tracking

### Logging
- **Structured Logging**: JSON-formatted logs
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Upload and processing times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For technical support, feature requests, or bug reports:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🎯 Roadmap

- [ ] User authentication system
- [ ] Photo albums and categories
- [ ] Advanced slideshow themes
- [ ] Mobile app companion
- [ ] Cloud storage integration
- [ ] Advanced admin analytics
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] CDN integration
- [ ] Backup and restore functionality

---

**MemoryLane** - Where memories live forever ✨