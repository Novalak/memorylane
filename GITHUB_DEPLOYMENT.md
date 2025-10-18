# MemoryLane GitHub Deployment Guide

This guide shows you how to deploy MemoryLane from GitHub with customizable settings.

## 🚀 Quick Start

### Option 1: Interactive Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/Novalak/memorylane.git
cd memorylane

# Run the interactive setup script
./deploy.sh

# Start the application
docker-compose up -d
```

### Option 2: Manual Configuration
```bash
# Clone the repository
git clone https://github.com/Novalak/memorylane.git
cd memorylane

# Copy the production template
cp docker-compose.production.yml docker-compose.yml

# Edit the configuration
nano docker-compose.yml

# Start the application
docker-compose up -d
```

## ⚙️ Configuration Options

### Security Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PASSWORD` | `admin123` | Password for admin panel access |
| `UPLOAD_PASSWORD` | (empty) | Password required for uploads (leave empty to disable) |

### File Upload Limits
| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | `52428800` | Maximum file size in bytes (50MB) |
| `MAX_FILES_PER_UPLOAD` | `50` | Maximum number of files per upload |

### Image Processing
| Variable | Default | Description |
|----------|---------|-------------|
| `THUMBNAIL_SIZE` | `300` | Thumbnail size in pixels |
| `IMAGE_QUALITY` | `90` | JPEG quality for main images (1-100) |
| `THUMBNAIL_QUALITY` | `80` | JPEG quality for thumbnails (1-100) |

### Network Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4173` | External port mapping |
| `CORS_ORIGIN` | `*` | CORS origin (use specific domain in production) |
| `CORS_CREDENTIALS` | `false` | Allow credentials in CORS requests |

## 🔒 Production Security Checklist

### Before Going Live:
- [ ] Change `ADMIN_PASSWORD` from default
- [ ] Set `UPLOAD_PASSWORD` if you want upload protection
- [ ] Set `CORS_ORIGIN` to your specific domain
- [ ] Configure reverse proxy with SSL
- [ ] Set up regular backups
- [ ] Monitor logs and resource usage

### Example Production Configuration:
```yaml
services:
  memorylane:
    image: ghcr.io/novalak/memorylane:latest
    environment:
      - ADMIN_PASSWORD=YourSecurePassword123!
      - UPLOAD_PASSWORD=UploadPassword456!
      - CORS_ORIGIN=https://yourdomain.com
      - LOG_LEVEL=warn
```

## 📁 Directory Structure

After deployment, your directory will look like:
```
memorylane/
├── docker-compose.yml          # Your configuration
├── images/                     # Uploaded photos (persistent)
├── exports/                    # Generated ZIP files (persistent)
└── deploy.sh                   # Setup script
```

## 🔄 Updates

To update MemoryLane:
```bash
# Pull the latest image
docker-compose pull

# Restart with new image
docker-compose up -d
```

## 🛠️ Troubleshooting

### Check Container Status
```bash
docker ps
docker logs memorylane
```

### Reset Configuration
```bash
# Stop and remove container
docker-compose down

# Remove volumes (WARNING: This deletes all photos!)
docker volume rm memorylane_images memorylane_exports

# Restart with fresh configuration
docker-compose up -d
```

### Backup Photos
```bash
# Create backup
tar -czf memorylane-backup-$(date +%Y%m%d).tar.gz images/ exports/

# Restore backup
tar -xzf memorylane-backup-YYYYMMDD.tar.gz
```

## 🌐 Reverse Proxy Setup

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:4173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for large uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Increase client body size for large files
        client_max_body_size 50M;
    }
}
```

## 📊 Monitoring

### Health Check
The container includes built-in health checks. Check status with:
```bash
docker inspect memorylane | grep -A 10 Health
```

### Resource Usage
```bash
docker stats memorylane
```

## 🆘 Support

- **GitHub Issues**: https://github.com/Novalak/memorylane/issues
- **Documentation**: See README.md for detailed features
- **Configuration**: Edit docker-compose.yml and restart with `docker-compose up -d`
