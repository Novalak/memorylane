const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const archiver = require('archiver');

// File to store image metadata
const METADATA_FILE = '/app/images/metadata.json';

// Load image metadata
function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading metadata:', error);
  }
  return {};
}

// Save image metadata
function saveMetadata(metadata) {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error saving metadata:', error);
  }
}

const app = express();
const PORT = 4173;

// Increase timeout for large file uploads
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 1 // Process one file at a time
  },
  fileFilter: function (req, file, cb) {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'image/avif', 'image/tiff', 'image/bmp', 'image/ico',
      'image/heic', 'image/heif'
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', 
                             '.avif', '.tiff', '.tif', '.bmp', '.ico',
                             '.heic', '.heif'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (file.mimetype.startsWith('image/') || 
        allowedMimes.includes(file.mimetype) || 
        allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Function to convert HEIC to JPEG with retry logic
async function convertHeicToJpeg(inputPath, outputPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sharp(inputPath)
        .rotate() // Auto-rotate based on EXIF orientation
        .jpeg({ quality: 100 })
        .toFile(outputPath);
      return true;
    } catch (error) {
      console.error(`HEIC conversion attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        console.error('HEIC conversion failed after all retries');
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
}

// Function to generate thumbnail with retry logic
async function generateThumbnail(inputPath, thumbnailPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sharp(inputPath)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      return true;
    } catch (error) {
      console.error(`Thumbnail generation attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        console.error('Thumbnail generation failed after all retries');
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
}

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint for file upload
app.post('/api/upload', upload.single('images'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploaderName = req.body.uploaderName || 'Anonymous';
    const metadata = loadMetadata();
    
    const file = req.file;
    const originalPath = file.path;
    const ext = path.extname(file.filename).toLowerCase();
    
    let finalFilename = file.filename;
    let finalPath = originalPath;
    
    // If it's a HEIC file, convert it to JPEG
    if (ext === '.heic' || ext === '.heif') {
      const jpegFilename = file.filename.replace(/\.(heic|heif)$/i, '.jpg');
      const jpegPath = path.join('/app/images', jpegFilename);
      
      const converted = await convertHeicToJpeg(originalPath, jpegPath);
      if (converted) {
        // Delete the original HEIC file
        fs.unlinkSync(originalPath);
        finalFilename = jpegFilename;
        finalPath = jpegPath;
      }
    }
    
    // Generate thumbnail
    const thumbnailFilename = `thumb_${finalFilename}`;
    const thumbnailPath = path.join('/app/images', thumbnailFilename);
    const thumbnailGenerated = await generateThumbnail(finalPath, thumbnailPath);
    
    if (!thumbnailGenerated) {
      console.warn(`Failed to generate thumbnail for ${finalFilename}`);
    }
    
    // Save metadata
    metadata[finalFilename] = {
      uploaderName: uploaderName,
      uploadDate: new Date().toISOString(),
      originalName: file.originalname
    };
    
    // Save metadata
    saveMetadata(metadata);

    const uploadedFile = {
      filename: finalFilename,
      originalName: file.originalname,
      size: fs.statSync(finalPath).size,
      url: `/images/${finalFilename}`,
      thumbnailUrl: thumbnailGenerated ? `/images/thumb_${finalFilename}` : `/images/${finalFilename}`,
      uploaderName: uploaderName
    };

    res.json({ 
      success: true, 
      file: uploadedFile,
      message: `File ${file.originalname} uploaded successfully`
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up any uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// API endpoint to rotate an image
app.post('/api/images/:filename/rotate', async (req, res) => {
  try {
    const filename = req.params.filename;
    const { degrees } = req.body;
    const imagePath = path.join('/app/images', filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Check if it's actually an image file
    const ext = path.extname(filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.ico', '.heic', '.heif'].includes(ext)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    // Validate rotation degrees
    if (!degrees || ![90, 180, 270].includes(parseInt(degrees))) {
      return res.status(400).json({ error: 'Invalid rotation degrees. Must be 90, 180, or 270' });
    }
    
    // Create a temporary file for the rotated image
    const tempPath = imagePath + '.temp';
    
    try {
      // Rotate the image using Sharp
      await sharp(imagePath)
        .rotate(parseInt(degrees))
        .toFile(tempPath);
      
      // Replace the original file with the rotated version
      fs.renameSync(tempPath, imagePath);
      
      // Regenerate thumbnail
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join('/app/images', thumbnailFilename);
      await generateThumbnail(imagePath, thumbnailPath);
      
      res.json({ 
        success: true, 
        message: `Image ${filename} rotated ${degrees} degrees successfully` 
      });
    } catch (sharpError) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw sharpError;
    }
    
  } catch (error) {
    console.error('Rotation error:', error);
    res.status(500).json({ error: 'Failed to rotate image' });
  }
});

// Serve uploaded images
app.use('/images/', express.static('/app/images'));

// API endpoint to get uploaded images
app.get('/api/images', (req, res) => {
  try {
    const imagesDir = '/app/images';
    const files = fs.readdirSync(imagesDir);
    const metadata = loadMetadata();
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.ico', '.heic', '.heif'].includes(ext);
      const isThumbnail = file.startsWith('thumb_');
      return isImage && !isThumbnail; // Only return original images, not thumbnails
    });

    const images = imageFiles.map(file => {
      const filePath = path.join(imagesDir, file);
      const stats = fs.statSync(filePath);
      const fileMetadata = metadata[file] || {};
      
      return {
        filename: file,
        url: `/images/${file}`,
        thumbnailUrl: `/images/thumb_${file}`,
        uploadDate: fileMetadata.uploadDate || stats.birthtime.toISOString(),
        uploaderName: fileMetadata.uploaderName || 'Anonymous'
      };
    });

    res.json({ images });
  } catch (error) {
    console.error('Error reading images:', error);
    res.status(500).json({ error: 'Failed to read images' });
  }
});

// API endpoint to delete an image
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join('/app/images', filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Check if it's actually an image file
    const ext = path.extname(filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.ico', '.heic', '.heif'].includes(ext)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    // Delete the file
    fs.unlinkSync(imagePath);
    
    // Remove metadata and thumbnail
    const metadata = loadMetadata();
    if (metadata[filename]) {
      // Delete thumbnail if it exists
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join('/app/images', thumbnailFilename);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
      
      delete metadata[filename];
      saveMetadata(metadata);
    }
    
    res.json({ 
      success: true, 
      message: `Image ${filename} deleted successfully` 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// API endpoint to create export zip
app.post('/api/export/create', (req, res) => {
  try {
    const imagesDir = '/app/images';
    const exportDir = '/app/exports';
    const exportFilename = `memorylane-images-${Date.now()}.zip`;
    const exportPath = path.join(exportDir, exportFilename);
    
    // Create exports directory if it doesn't exist
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Check if there's already an export
    const existingExports = fs.readdirSync(exportDir).filter(file => file.endsWith('.zip'));
    if (existingExports.length > 0) {
      return res.status(400).json({ 
        error: 'Export already exists. Please delete the current export before creating a new one.',
        existingExport: existingExports[0]
      });
    }
    
    // Get all image files (excluding thumbnails and metadata)
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.ico'].includes(ext) && 
             !file.startsWith('thumb_') && 
             file !== 'metadata.json';
    });
    
    if (imageFiles.length === 0) {
      return res.status(400).json({ error: 'No images to export' });
    }
    
    // Create zip file
    const output = fs.createWriteStream(exportPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`Export created: ${archive.pointer()} total bytes`);
      res.json({ 
        success: true, 
        filename: exportFilename,
        downloadUrl: `/api/export/download/${exportFilename}`,
        fileCount: imageFiles.length
      });
    });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Failed to create export' });
    });
    
    archive.pipe(output);
    
    // Add each image file to the zip
    imageFiles.forEach(file => {
      const filePath = path.join(imagesDir, file);
      archive.file(filePath, { name: file });
    });
    
    archive.finalize();
    
  } catch (error) {
    console.error('Export creation error:', error);
    res.status(500).json({ error: 'Failed to create export' });
  }
});

// API endpoint to download export zip
app.get('/api/export/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const exportDir = '/app/exports';
    const filePath = path.join(exportDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Export file not found' });
    }
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download export' });
      }
    });
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download export' });
  }
});

// API endpoint to delete export zip
app.delete('/api/export/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const exportDir = '/app/exports';
    const filePath = path.join(exportDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Export file not found' });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({ 
      success: true, 
      message: `Export ${filename} deleted successfully` 
    });
    
  } catch (error) {
    console.error('Export deletion error:', error);
    res.status(500).json({ error: 'Failed to delete export' });
  }
});

// API endpoint to check export status
app.get('/api/export/status', (req, res) => {
  try {
    const exportDir = '/app/exports';
    
    if (!fs.existsSync(exportDir)) {
      return res.json({ hasExport: false });
    }
    
    const exports = fs.readdirSync(exportDir).filter(file => file.endsWith('.zip'));
    
    if (exports.length === 0) {
      return res.json({ hasExport: false });
    }
    
    const exportFile = exports[0];
    const filePath = path.join(exportDir, exportFile);
    const stats = fs.statSync(filePath);
    
    res.json({
      hasExport: true,
      filename: exportFile,
      downloadUrl: `/api/export/download/${exportFile}`,
      createdAt: stats.birthtime,
      size: stats.size
    });
    
  } catch (error) {
    console.error('Export status error:', error);
    res.status(500).json({ error: 'Failed to check export status' });
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
