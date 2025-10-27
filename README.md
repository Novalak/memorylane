# MemoryLane 🖼️

MemoryLane is a heartfelt photo-sharing website that brings loved ones together through timeless slideshows. Cherish every occasion — weddings, birthdays, anniversaries, and farewells — all in one beautiful space.

## ✨ Features

- 📸 **Photo Upload** - Drag & drop with progress tracking
- 🎬 **Professional Slideshow** - Full-screen with customizable transitions
- ⚙️ **Admin Panel** - Configure settings and manage photos
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔄 **HEIC Support** - Automatic conversion to JPEG
- 📊 **Progress Tracking** - Real-time upload progress with cancel option
- 🎨 **Multiple Formats** - JPG, PNG, GIF, WebP, AVIF, TIFF, BMP, ICO, HEIC, HEIF
- 📦 **Export Function** - Download all photos as ZIP file

## 🚀 Quick Start

```bash
git clone https://github.com/Novalak/memorylane.git
cd memorylane
docker-compose up -d
```

Access at: http://localhost:4173

## 🐳 Docker Compose

```yaml
services:
  memorylane:
    image: ghcr.io/novalak/memorylane:latest
    hostname: memorylane
    container_name: memorylane
    restart: unless-stopped
    ports:
      - "4173:4173"
    volumes:
      - ./images:/app/images
      - ./exports:/app/exports
    environment:
      - NODE_ENV=production
```

## 📋 Usage

1. **Upload Photos** - Drag & drop or browse files
2. **Start Slideshow** - Click slideshow button for full-screen viewing
3. **Admin Access** - Click settings icon, enter password `admin123`
4. **Configure** - Customize heading, footer, and other settings
5. **Export** - Download all photos as ZIP file

## 🛠️ Configuration

All settings can be customized through the admin panel:
- Feature image and positioning
- Slideshow speed and transitions
- Upload requirements
- Display options

## 📁 File Structure

```
memorylane/
├── images/          # Uploaded photos (created on first run)
├── exports/         # Generated ZIP files (created on first run)
├── docker-compose.yml
└── README.md
```

## 🔄 Updates

```bash
docker-compose pull
docker-compose up -d
```# Trigger build
# Trigger build
