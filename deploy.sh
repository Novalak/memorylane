#!/bin/bash

# MemoryLane Deployment Script
# This script sets up MemoryLane with customizable settings

set -e

echo "🖼️  MemoryLane Deployment Script"
echo "================================="

# Default values
ADMIN_PASSWORD="admin123"
UPLOAD_PASSWORD=""
PORT="4173"
MAX_FILE_SIZE="52428800"
MAX_FILES="50"

# Function to prompt for input with default
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    read -p "$prompt [$default]: " input
    eval "$var_name=\${input:-$default}"
}

echo ""
echo "🔧 Configuration Setup"
echo "----------------------"

prompt_with_default "Admin Password" "$ADMIN_PASSWORD" ADMIN_PASSWORD
prompt_with_default "Upload Password (leave empty to disable)" "$UPLOAD_PASSWORD" UPLOAD_PASSWORD
prompt_with_default "Port" "$PORT" PORT
prompt_with_default "Max File Size (bytes)" "$MAX_FILE_SIZE" MAX_FILE_SIZE
prompt_with_default "Max Files per Upload" "$MAX_FILES" MAX_FILES

echo ""
echo "📁 Creating directories..."
mkdir -p images exports

echo ""
echo "🐳 Creating docker-compose.yml..."

cat > docker-compose.yml << EOF
services:
  memorylane:
    image: ghcr.io/novalak/memorylane:latest
    hostname: memorylane
    container_name: memorylane
    restart: unless-stopped
    ports:
      - "$PORT:4173"
    volumes:
      - ./images:/app/images
      - ./exports:/app/exports
    environment:
      - NODE_ENV=production
      - PORT=4173
      - ADMIN_PASSWORD=$ADMIN_PASSWORD
      - UPLOAD_PASSWORD=$UPLOAD_PASSWORD
      - MAX_FILE_SIZE=$MAX_FILE_SIZE
      - MAX_FILES_PER_UPLOAD=$MAX_FILES
      - THUMBNAIL_SIZE=300
      - IMAGE_QUALITY=90
      - THUMBNAIL_QUALITY=80
      - LOG_LEVEL=info
      - CORS_ORIGIN=*
      - CORS_CREDENTIALS=false
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:4173/api/images', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📋 Summary:"
echo "  - Admin Password: $ADMIN_PASSWORD"
echo "  - Upload Password: ${UPLOAD_PASSWORD:-'Disabled'}"
echo "  - Port: $PORT"
echo "  - Max File Size: $MAX_FILE_SIZE bytes"
echo "  - Max Files: $MAX_FILES"
echo ""
echo "🚀 To start MemoryLane:"
echo "  docker-compose up -d"
echo ""
echo "🌐 Access at: http://localhost:$PORT"
echo "⚙️  Admin access: Click settings icon, password: $ADMIN_PASSWORD"
