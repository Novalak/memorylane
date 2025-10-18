# MemoryLane Deployment Guide

This guide covers various deployment options for MemoryLane, from simple Docker deployments to production Kubernetes clusters.

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/Novalak/memorylane.git
cd memorylane

# Start the application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f memorylane

# Stop the application
docker-compose down
```

### Custom Configuration

Create a `.env` file to customize settings:

```bash
# Copy the example environment file
cp env.example .env

# Edit the configuration
nano .env
```

### Production Docker Compose

For production deployments, use the optimized configuration:

```yaml
version: '3.8'

services:
  memorylane:
    image: ghcr.io/novalak/memorylane:latest
    ports:
      - "80:4173"
    environment:
      - NODE_ENV=production
      - ADMIN_PASSWORD=your_secure_password
    volumes:
      - memorylane_images:/app/images
      - memorylane_exports:/app/exports
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4173/api/images"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  memorylane_images:
  memorylane_exports:
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.19+)
- kubectl configured
- Persistent volume provisioner

### Deploy to Kubernetes

```bash
# Apply the Kubernetes manifests
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl get pods -l app=memorylane

# Get service information
kubectl get service memorylane-service

# View logs
kubectl logs -l app=memorylane -f
```

### Scaling

```bash
# Scale to 3 replicas
kubectl scale deployment memorylane --replicas=3

# Check scaling status
kubectl get pods -l app=memorylane
```

## 🌐 Reverse Proxy Setup

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:4173/
    ProxyPassReverse / http://localhost:4173/
    
    # Increase timeout for large uploads
    ProxyTimeout 300
    
    # Increase client body size for large files
    LimitRequestBody 52428800
</VirtualHost>
```

## 🔒 SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Docker with SSL

```yaml
version: '3.8'

services:
  memorylane:
    image: ghcr.io/novalak/memorylane:latest
    environment:
      - NODE_ENV=production
    volumes:
      - memorylane_images:/app/images
      - memorylane_exports:/app/exports
    networks:
      - memorylane_network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - memorylane
    networks:
      - memorylane_network

volumes:
  memorylane_images:
  memorylane_exports:

networks:
  memorylane_network:
    driver: bridge
```

## 📊 Monitoring and Logging

### Health Checks

The application includes built-in health checks:

```bash
# Check container health
docker ps

# Check Kubernetes health
kubectl get pods -l app=memorylane

# Manual health check
curl -f http://localhost:4173/api/images
```

### Logging Configuration

```yaml
# Docker Compose with logging
version: '3.8'

services:
  memorylane:
    image: ghcr.io/novalak/memorylane:latest
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Prometheus Monitoring

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

## 🔧 Backup and Restore

### Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/memorylane"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup images
docker run --rm -v memorylane_images:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/images_$DATE.tar.gz -C /data .

# Backup exports
docker run --rm -v memorylane_exports:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/exports_$DATE.tar.gz -C /data .

echo "Backup completed: $BACKUP_DIR"
```

### Restore Script

```bash
#!/bin/bash
# restore.sh

BACKUP_DIR="/backup/memorylane"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
fi

# Restore images
docker run --rm -v memorylane_images:/data -v $BACKUP_DIR:/backup alpine tar xzf /backup/$BACKUP_FILE -C /data

echo "Restore completed"
```

## 🚀 Production Checklist

### Security
- [ ] Change default admin password
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Enable log monitoring

### Performance
- [ ] Configure resource limits
- [ ] Set up load balancing
- [ ] Enable CDN for static assets
- [ ] Configure caching
- [ ] Monitor resource usage

### Reliability
- [ ] Set up health checks
- [ ] Configure auto-restart policies
- [ ] Set up monitoring alerts
- [ ] Test backup/restore procedures
- [ ] Plan for disaster recovery

## 🆘 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker logs memorylane

# Check resource usage
docker stats memorylane
```

**Upload failures:**
```bash
# Check file permissions
docker exec memorylane ls -la /app/images

# Check disk space
docker exec memorylane df -h
```

**Performance issues:**
```bash
# Check memory usage
docker stats memorylane

# Check CPU usage
docker exec memorylane top
```

### Support

For additional support:
- Check the GitHub Issues page
- Review the application logs
- Contact the development team
