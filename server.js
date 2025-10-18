const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4173;

// Enable CORS
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/app/images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint for file upload
app.post('/api/upload', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/images/${file.filename}`
    }));

    res.json({ 
      success: true, 
      files: uploadedFiles,
      message: `${req.files.length} file(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Serve uploaded images
app.use('/images', express.static('/app/images'));

// API endpoint to get uploaded images
app.get('/api/images', (req, res) => {
  try {
    const imagesDir = '/app/images';
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    const images = imageFiles.map(file => ({
      filename: file,
      url: `/images/${file}`,
      uploadDate: fs.statSync(path.join(imagesDir, file)).mtime
    }));

    res.json({ images });
  } catch (error) {
    console.error('Error reading images:', error);
    res.status(500).json({ error: 'Failed to read images' });
  }
});

// Handle all other routes by serving the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MemoryLane server running on port ${PORT}`);
  console.log(`Images will be stored in /app/images`);
});
