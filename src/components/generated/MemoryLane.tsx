import React from 'react';
import { Upload, Play, Settings, X, ChevronLeft, ChevronRight, Pause, Maximize2, Minimize2, Trash2, RotateCw, RotateCcw } from 'lucide-react';

// Force import of rotation icons to prevent tree-shaking
const rotationIcons = { RotateCw, RotateCcw };
import { motion, AnimatePresence } from 'framer-motion';
type Photo = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  uploaderName?: string;
  timestamp: number;
};
type Config = {
  heading: string;
  featurePictureUrl: string;
  featurePicturePosition: { x: number; y: number };
  configPassword: string;
  requireUploadPassword: boolean;
  uploadPassword: string;
  disableSlideshow: boolean;
  disableUpload: boolean;
  uploaderNameMandatory: boolean;
  copyrightText: string;
  displayUploaderInGallery: boolean;
  photoSharedByText: string;
  windowTitle: string;
};
type TransitionType = 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'flip' | 'crossfade' | 'ken-burns' | 'random';
const DEFAULT_CONFIG: Config = {
  heading: 'Happy Anniversary Kristy & Neil',
  featurePictureUrl: '',
  featurePicturePosition: { x: 50, y: 30 },
  configPassword: 'admin123',
  requireUploadPassword: true,
  uploadPassword: '',
  disableSlideshow: false,
  disableUpload: false,
  uploaderNameMandatory: false,
  copyrightText: '© 2025 Memory Lane',
  displayUploaderInGallery: true,
  photoSharedByText: 'Photo Shared by',
  windowTitle: 'Memory Lane'
};
const getStoredConfig = async (): Promise<Config> => {
  try {
    // First try to load from server
    const response = await fetch('/api/config');
    if (response.ok) {
      const serverConfig = await response.json();
      if (serverConfig && Object.keys(serverConfig).length > 0) {
        return {
          ...DEFAULT_CONFIG,
          ...serverConfig
        };
      }
    }
  } catch (error) {
    console.log('Server config not available, falling back to localStorage');
  }
  
  // Fallback to localStorage
  try {
    const stored = localStorage.getItem('memorylane-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_CONFIG,
        ...parsed
      };
    }
  } catch {
    // If there's an error parsing, return defaults
  }
  return DEFAULT_CONFIG;
};
const getStoredPhotos = (): Photo[] => {
  try {
    const stored = localStorage.getItem('memorylane-photos');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// API functions
interface ApiImage {
  filename: string;
  url: string;
  thumbnailUrl?: string;
  uploaderName?: string;
  uploadDate: string;
}

const fetchPhotos = async (): Promise<Photo[]> => {
  try {
    const response = await fetch('/api/images');
    const data = await response.json();
    return data.images.map((img: ApiImage, index: number) => ({
      id: img.filename,
      url: img.url,
      thumbnailUrl: img.thumbnailUrl || img.url,
      uploaderName: img.uploaderName || 'Anonymous',
      timestamp: new Date(img.uploadDate).getTime()
    }));
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return [];
  }
};

const deletePhoto = async (filename: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/images/${filename}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete photo:', error);
    return false;
  }
};

const rotatePhoto = async (filename: string, degrees: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/images/${filename}/rotate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ degrees })
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to rotate photo:', error);
    return false;
  }
};

// @component: MemoryLane
export const MemoryLane = () => {
  const [config, setConfig] = React.useState<Config>(DEFAULT_CONFIG);
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [showConfigModal, setShowConfigModal] = React.useState(false);
  const [showSlideshowSettings, setShowSlideshowSettings] = React.useState(false);
  const [showFullscreenSlideshow, setShowFullscreenSlideshow] = React.useState(false);
  const [showEnlargedPhoto, setShowEnlargedPhoto] = React.useState(false);
  const [enlargedPhotoIndex, setEnlargedPhotoIndex] = React.useState(0);
  const [randomOrder, setRandomOrder] = React.useState<number[]>([]);
  const [slideshowMode, setSlideshowMode] = React.useState<'sequential' | 'random'>('sequential');
  const [displayUploaderInSlideshow, setDisplayUploaderInSlideshow] = React.useState(true);
  const [photoSubmittedByText, setPhotoSubmittedByText] = React.useState('Photo Shared by');
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([]);
  const [uploaderName, setUploaderName] = React.useState('');
  const [uploadPassword, setUploadPassword] = React.useState('');
  const [configPassword, setConfigPassword] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadStatus, setUploadStatus] = React.useState('');
  const [uploadedFiles, setUploadedFiles] = React.useState<number>(0);
  const [totalFiles, setTotalFiles] = React.useState<number>(0);
  const [uploadCancelled, setUploadCancelled] = React.useState(false);
  const [configSaved, setConfigSaved] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showSlideshowControls, setShowSlideshowControls] = React.useState(true);
  const [exportStatus, setExportStatus] = React.useState<{hasExport: boolean, filename?: string, downloadUrl?: string, createdAt?: string, size?: number}>({hasExport: false});
  const [isCreatingExport, setIsCreatingExport] = React.useState(false);
  const [isDeletingExport, setIsDeletingExport] = React.useState(false);
  const [selectedPhotos, setSelectedPhotos] = React.useState<Set<string>>(new Set());
  const [useAllPhotos, setUseAllPhotos] = React.useState(true);
  const [uploadError, setUploadError] = React.useState('');
  const [configError, setConfigError] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = React.useState(5);
  const [transitionType, setTransitionType] = React.useState<TransitionType>('fade');
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [photosPerPageMode, setPhotosPerPageMode] = React.useState<'single' | 'multiple'>('single');
  const [editingConfig, setEditingConfig] = React.useState<Config>(DEFAULT_CONFIG);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const featureImageInputRef = React.useRef<HTMLInputElement>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isConfigUnlocked, setIsConfigUnlocked] = React.useState(false);
  
  // Create a single file input element that persists across renders
  const fileInputElement = React.useMemo(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.heic,.heif,.webp,.avif,.tiff,.tif,.bmp,.ico';
    input.style.display = 'none';
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files).filter(file => {
          const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
                             'image/avif', 'image/tiff', 'image/bmp', 'image/ico', 'image/heic', 'image/heif'];
          const fileName = file.name.toLowerCase();
          const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.ico', '.heic', '.heif'];
          
          const isValidType = file.type.startsWith('image/') || 
                 validTypes.includes(file.type) || 
                 validExtensions.some(ext => fileName.endsWith(ext));
          
          const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
          
          if (!isValidType) {
            console.warn(`Skipping ${file.name}: Invalid file type`);
          } else if (!isValidSize) {
            console.warn(`Skipping ${file.name}: File too large (${Math.round(file.size / 1024 / 1024)}MB)`);
          }
          
          return isValidType && isValidSize;
        });
        setUploadFiles(prev => [...prev, ...files]);
        // Clear the input so the same file can be selected again
        target.value = '';
      }
    });
    return input;
  }, []);

  // Load photos from API on component mount
  React.useEffect(() => {
    const loadPhotos = async () => {
      const apiPhotos = await fetchPhotos();
      if (apiPhotos.length > 0) {
        setPhotos(apiPhotos);
      } else {
        // No photos available - show empty state
        setPhotos([]);
      }
    };
    loadPhotos();
  }, []);

  // Load configuration from server on mount
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig = await getStoredConfig();
        setConfig(loadedConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfig();
  }, []);

  // Initialize localStorage version tracking (only on true first load)
  React.useEffect(() => {
    const APP_VERSION = '2.0.0';
    const storedVersion = localStorage.getItem('memorylane-version');
    const isFirstLoad = !localStorage.getItem('memorylane-initialized');
    
    if (isFirstLoad) {
      // Only clear on true first load, not on version changes
      localStorage.removeItem('memorylane-config');
      localStorage.removeItem('memorylane-photos');
      localStorage.removeItem('memorylane-feature-picture');
      localStorage.setItem('memorylane-initialized', 'true');
      localStorage.setItem('memorylane-version', APP_VERSION);
    } else if (storedVersion !== APP_VERSION) {
      // Just update version, don't clear existing data
      localStorage.setItem('memorylane-version', APP_VERSION);
    }
  }, []);

  // Handle ESC key to exit slideshow
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showFullscreenSlideshow) {
          setShowFullscreenSlideshow(false);
          setIsPlaying(false);
        } else if (showEnlargedPhoto) {
          setShowEnlargedPhoto(false);
        }
      }
    };

    if (showFullscreenSlideshow || showEnlargedPhoto) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showFullscreenSlideshow, showEnlargedPhoto]);

  // Handle photo deletion
  const handleDeletePhoto = async (photoId: string) => {
    if (!isConfigUnlocked) return;
    
    // Handle demo photos (remove from UI only)
    if (photoId.startsWith('demo-')) {
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      return;
    }
    
    // Handle real photos (make API call)
    const success = await deletePhoto(photoId);
    if (success) {
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    }
  };

  // Handle photo rotation
  const handleRotatePhoto = async (photoId: string, degrees: number) => {
    if (!isConfigUnlocked) return;
    
    // Handle demo photos (no rotation for demo)
    if (photoId.startsWith('demo-')) {
      return;
    }
    
    // Handle real photos (make API call)
    const success = await rotatePhoto(photoId, degrees);
    if (success) {
      // Reload photos to get updated versions
      const newPhotos = await fetchPhotos();
      
      // Add cache-busting timestamp to rotated photo URLs to force browser refresh
      const updatedPhotos = newPhotos.map(photo => {
        if (photo.id === photoId) {
          const timestamp = Date.now();
          return {
            ...photo,
            url: `${photo.url}?t=${timestamp}`,
            thumbnailUrl: photo.thumbnailUrl ? `${photo.thumbnailUrl}?t=${timestamp}` : undefined
          };
        }
        return photo;
      });
      
      setPhotos(updatedPhotos);
    }
  };
  React.useEffect(() => {
    // Save to localStorage for immediate access
    localStorage.setItem('memorylane-config', JSON.stringify(config));
    
    // Also save to server for persistence across sessions
    const saveToServer = async () => {
      try {
        // Only save non-default values to avoid overwriting with defaults
        const changedValues: Partial<Config> = {};
        Object.keys(config).forEach(key => {
          const configKey = key as keyof Config;
          if (config[configKey] !== DEFAULT_CONFIG[configKey]) {
            (changedValues as Partial<Config>)[configKey] = config[configKey] as never;
          }
        });
        
        // Only save if there are actual changes
        if (Object.keys(changedValues).length > 0) {
          await fetch('/api/config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(changedValues)
          });
        }
      } catch (error) {
        console.error('Failed to save config to server:', error);
      }
    };
    saveToServer();
  }, [config]);

  // Update document title when config changes
  React.useEffect(() => {
    document.title = config.windowTitle;
  }, [config.windowTitle]);

  // Check export status when admin is unlocked
  React.useEffect(() => {
    if (isConfigUnlocked) {
      checkExportStatus();
    }
  }, [isConfigUnlocked]);

  React.useEffect(() => {
    if (showFullscreenSlideshow && isPlaying && photos.length > 0) {
      intervalRef.current = setInterval(() => {
        const totalPages = getTotalPages();
        setCurrentSlideIndex(prev => (prev + 1) % totalPages);
      }, slideshowSpeed * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showFullscreenSlideshow, isPlaying, photos.length, slideshowSpeed, photosPerPageMode]);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
                         'image/avif', 'image/tiff', 'image/bmp', 'image/ico', 'image/heic', 'image/heif'];
      const fileName = file.name.toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.ico', '.heic', '.heif'];
      
      const isValidType = file.type.startsWith('image/') || 
             validTypes.includes(file.type) || 
             validExtensions.some(ext => fileName.endsWith(ext));
      
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        console.warn(`Skipping ${file.name}: Invalid file type`);
      } else if (!isValidSize) {
        console.warn(`Skipping ${file.name}: File too large (${Math.round(file.size / 1024 / 1024)}MB)`);
      }
      
      return isValidType && isValidSize;
    });
    if (files.length > 0) {
      setUploadFiles(prev => [...prev, ...files]);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
                           'image/avif', 'image/tiff', 'image/bmp', 'image/ico', 'image/heic', 'image/heif'];
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.tif', '.bmp', '.ico', '.heic', '.heif'];
        
        return file.type.startsWith('image/') || 
               validTypes.includes(file.type) || 
               validExtensions.some(ext => fileName.endsWith(ext));
      });
      setUploadFiles(prev => [...prev, ...files]);
    }
  };
  const handleUploadSubmit = async () => {
    setUploadError('');
    if (uploadFiles.length === 0) {
      setUploadError('Please select at least one image');
      return;
    }
    if (uploadFiles.length > 50) {
      setUploadError('Too many files selected. Please select 50 or fewer images at once.');
      return;
    }
    if (config.uploaderNameMandatory && !uploaderName.trim()) {
      setUploadError('Uploader name is required');
      return;
    }
    if (config.requireUploadPassword && uploadPassword !== config.uploadPassword) {
      setUploadError('Incorrect upload password');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setUploadedFiles(0);
    setTotalFiles(uploadFiles.length);
    setUploadStatus('Preparing upload...');
    setUploadCancelled(false);
    
    try {
      // Upload files one by one to track progress
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < uploadFiles.length; i++) {
        // Check if upload was cancelled
        if (uploadCancelled) {
          setUploadStatus('Upload cancelled');
          break;
        }
        
        const file = uploadFiles[i];
        setUploadStatus(`Uploading ${file.name} (${i + 1}/${uploadFiles.length})...`);
        
        try {
          const formData = new FormData();
          formData.append('images', file);
          formData.append('uploaderName', uploaderName || 'Anonymous');
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to upload ${file.name}`);
          }
          
          successCount++;
          setUploadedFiles(successCount);
          setUploadProgress((successCount / uploadFiles.length) * 100);
          
          // Small delay between uploads to prevent overwhelming the server
          if (i < uploadFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          errorCount++;
          // Continue with next file instead of stopping
        }
      }
      
      setUploadStatus('Finalizing...');
      
      // Reload photos from API
      const newPhotos = await fetchPhotos();
      setPhotos(newPhotos);
      
      // Clear upload state
      setUploadFiles([]);
      setUploaderName('');
      setUploadPassword('');
      setShowUploadModal(false);
      
      if (errorCount > 0) {
        setUploadError(`${successCount} files uploaded successfully, ${errorCount} failed. Please try uploading the failed files again.`);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
      setUploadedFiles(0);
      setTotalFiles(0);
      setUploadCancelled(false);
    }
  };

  const cancelUpload = () => {
    setUploadCancelled(true);
    setUploadStatus('Cancelling upload...');
  };
  const handleConfigSubmit = () => {
    setConfigError('');
    const newConfig = {...editingConfig};
    setConfig(newConfig);
    setEditingConfig(newConfig);
    setShowConfigModal(false);
    setConfigPassword('');
    setIsConfigUnlocked(false);
    setEditingConfig(DEFAULT_CONFIG);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000); // Hide after 3 seconds
  };

  // Export functions
  const checkExportStatus = async () => {
    try {
      const response = await fetch('/api/export/status');
      const data = await response.json();
      setExportStatus(data);
    } catch (error) {
      console.error('Error checking export status:', error);
    }
  };

  const createExport = async () => {
    setIsCreatingExport(true);
    try {
      const response = await fetch('/api/export/create', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setExportStatus({
          hasExport: true,
          filename: data.filename,
          downloadUrl: data.downloadUrl
        });
      } else {
        alert(data.error || 'Failed to create export');
      }
    } catch (error) {
      console.error('Error creating export:', error);
      alert('Failed to create export');
    } finally {
      setIsCreatingExport(false);
    }
  };

  const deleteExport = async () => {
    if (!exportStatus.filename) return;
    
    setIsDeletingExport(true);
    try {
      const response = await fetch(`/api/export/${exportStatus.filename}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setExportStatus({ hasExport: false });
      } else {
        alert(data.error || 'Failed to delete export');
      }
    } catch (error) {
      console.error('Error deleting export:', error);
      alert('Failed to delete export');
    } finally {
      setIsDeletingExport(false);
    }
  };

  const copyDownloadLink = async () => {
    if (!exportStatus.downloadUrl) return;
    
    const fullUrl = `${window.location.origin}${exportStatus.downloadUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      alert('Download link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Download link copied to clipboard!');
    }
  };

  const startSlideshow = () => {
    if (photos.length === 0) return;
    if (slideshowMode === 'random') {
      generateRandomOrder();
    }
    setCurrentSlideIndex(0);
    setIsPlaying(true);
    setShowSlideshowSettings(false);
    setShowFullscreenSlideshow(true);
  };

  // Photo selection functions
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(photos.map(photo => photo.id)));
  };

  const clearPhotoSelection = () => {
    setSelectedPhotos(new Set());
  };

  const getSelectedPhotos = () => {
    if (useAllPhotos) {
      return photos; // Use all photos
    }
    return photos.filter(photo => selectedPhotos.has(photo.id));
  };
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  const nextSlide = () => {
    const totalPages = getTotalPages();
    setCurrentSlideIndex(prev => (prev + 1) % totalPages);
  };
  const prevSlide = () => {
    const totalPages = getTotalPages();
    setCurrentSlideIndex(prev => (prev - 1 + totalPages) % totalPages);
  };
  const exitFullscreen = () => {
    setShowFullscreenSlideshow(false);
    setIsPlaying(false);
  };

  const openEnlargedPhoto = (index: number) => {
    setEnlargedPhotoIndex(index);
    setShowEnlargedPhoto(true);
  };

  const closeEnlargedPhoto = () => {
    setShowEnlargedPhoto(false);
  };

  const prevEnlargedPhoto = () => {
    setEnlargedPhotoIndex(prev => prev > 0 ? prev - 1 : photos.length - 1);
  };

  const nextEnlargedPhoto = () => {
    setEnlargedPhotoIndex(prev => prev < photos.length - 1 ? prev + 1 : 0);
  };

  // Image positioning functions
  const handleImageDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleImageDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setEditingConfig({
      ...editingConfig,
      featurePicturePosition: { 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
      }
    });
  };

  const handleImageDragEnd = () => {
    setIsDragging(false);
  };

  // Fullscreen functions
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize editingConfig with current config when modal opens
  React.useEffect(() => {
    if (showConfigModal) {
      setEditingConfig({...config});
    }
  }, [showConfigModal, config]);

  // Prevent body scroll when slideshow is open
  React.useEffect(() => {
    if (showFullscreenSlideshow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFullscreenSlideshow]);

  // Auto-hide slideshow controls
  React.useEffect(() => {
    if (!showFullscreenSlideshow) return;

    let hideTimeout: NodeJS.Timeout;

    const showControls = () => {
      setShowSlideshowControls(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        setShowSlideshowControls(false);
      }, 3000); // Hide after 3 seconds of inactivity
    };

    const handleActivity = () => {
      showControls();
    };

    // Show controls initially and set up auto-hide
    showControls();

    // Add event listeners
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);

    return () => {
      clearTimeout(hideTimeout);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
    };
  }, [showFullscreenSlideshow]);

  // Generate random order for slideshow
  const generateRandomOrder = () => {
    const slideshowPhotos = getSelectedPhotos();
    const order = Array.from({ length: slideshowPhotos.length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    setRandomOrder(order);
  };

  // Intelligently determine optimal photos per page (1-5) and generate layout
  const generateOptimalLayout = (photos: Photo[]): { layout: Array<{x: number, y: number, width: number, height: number, rotation: number, zIndex: number}>, photosPerPage: number } => {
    const totalPhotos = photos.length;
    
    // Define optimal configurations for 1-5 photos (landscape-friendly)
    const optimalConfigs = [
      { count: 1, cols: 1, rows: 1 },
      { count: 2, cols: 2, rows: 1 }, // Landscape: side by side
      { count: 3, cols: 3, rows: 1 }, // Landscape: three across
      { count: 4, cols: 2, rows: 2 }, // Square: 2x2 grid
      { count: 5, cols: 3, rows: 2 }  // Mixed: 3 top, 2 bottom
    ];
    
    // Find the best configuration that fits the available photos
    let bestConfig = optimalConfigs[0]; // Default to 1 photo
    for (const config of optimalConfigs) {
      if (config.count <= totalPhotos) {
        bestConfig = config;
      } else {
        break;
      }
    }
    
    const { cols, rows } = bestConfig;
    const photosPerPage = Math.min(bestConfig.count, totalPhotos);
    
    // Generate layout with ultra-minimal spacing
    const spacing = 0.1; // Ultra-minimal spacing for maximum photo size
    const availableWidth = 100 - (cols - 1) * spacing;
    const availableHeight = 100 - (rows - 1) * spacing;
    
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    const layout: Array<{x: number, y: number, width: number, height: number, rotation: number, zIndex: number}> = [];
    
    for (let i = 0; i < photosPerPage; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = col * (cellWidth + spacing);
      const y = row * (cellHeight + spacing);
      
      layout.push({
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        rotation: 0,
        zIndex: i + 1
      });
    }
    
    return { layout, photosPerPage };
  };

  // Get photos for current page based on mode
  const getCurrentPageData = () => {
    const slideshowPhotos = getSelectedPhotos();
    const totalPhotos = slideshowPhotos.length;
    
    if (totalPhotos === 0) return { photos: [], photosPerPage: 0 };
    
    if (photosPerPageMode === 'single') {
      // Single photo mode - traditional slideshow
      const photo = slideshowPhotos[currentSlideIndex] || slideshowPhotos[0];
      return { 
        photos: [photo], 
        layout: [{ x: 0, y: 0, width: 100, height: 100, rotation: 0, zIndex: 1 }], 
        photosPerPage: 1 
      };
    } else {
      // Multiple photo mode - intelligent layout (1-5 photos)
      const remainingPhotos = totalPhotos - (currentSlideIndex * 5); // Max 5 per page
      const photosForThisPage = Math.min(remainingPhotos, 5);
      
      const startIndex = currentSlideIndex * 5;
      const endIndex = Math.min(startIndex + photosForThisPage, totalPhotos);
      const pagePhotos = slideshowPhotos.slice(startIndex, endIndex);
      
      // Generate optimal layout for these photos
      const { layout, photosPerPage } = generateOptimalLayout(pagePhotos);
      
      return { photos: pagePhotos, layout, photosPerPage };
    }
  };

  // Get total number of pages
  const getTotalPages = () => {
    const slideshowPhotos = getSelectedPhotos();
    const totalPhotos = slideshowPhotos.length;
    
    if (totalPhotos === 0) return 0;
    
    if (photosPerPageMode === 'single') {
      return totalPhotos; // One photo per page
    } else {
      return Math.ceil(totalPhotos / 5); // Max 5 photos per page
    }
  };

  // Get current slide index based on mode and selected photos
  const getCurrentSlideIndex = () => {
    return currentSlideIndex;
  };

  const getCurrentSlidePhoto = () => {
    const slideshowPhotos = getSelectedPhotos();
    if (slideshowMode === 'random') {
      // For random mode, use the random order index to get the photo from selected photos
      const randomIndex = randomOrder[currentSlideIndex] || 0;
      return slideshowPhotos[randomIndex] || slideshowPhotos[0];
    }
    // For sequential mode, use the current index within selected photos
    return slideshowPhotos[currentSlideIndex] || slideshowPhotos[0];
  };
  const getTransitionVariants = (type: TransitionType) => {
    const actualType = type === 'random' ? ['fade', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out', 'flip', 'crossfade', 'ken-burns'][Math.floor(Math.random() * 8)] as TransitionType : type;
    const variants: Record<string, { initial: Record<string, unknown>; animate: Record<string, unknown>; exit: Record<string, unknown> }> = {
      'fade': {
        initial: {
          opacity: 0
        },
        animate: {
          opacity: 1
        },
        exit: {
          opacity: 0
        }
      },
      'slide-left': {
        initial: {
          x: '100%',
          opacity: 0
        },
        animate: {
          x: 0,
          opacity: 1
        },
        exit: {
          x: '-100%',
          opacity: 0
        }
      },
      'slide-right': {
        initial: {
          x: '-100%',
          opacity: 0
        },
        animate: {
          x: 0,
          opacity: 1
        },
        exit: {
          x: '100%',
          opacity: 0
        }
      },
      'zoom-in': {
        initial: {
          scale: 0.5,
          opacity: 0
        },
        animate: {
          scale: 1,
          opacity: 1
        },
        exit: {
          scale: 1.5,
          opacity: 0
        }
      },
      'zoom-out': {
        initial: {
          scale: 1.5,
          opacity: 0
        },
        animate: {
          scale: 1,
          opacity: 1
        },
        exit: {
          scale: 0.5,
          opacity: 0
        }
      },
      'flip': {
        initial: {
          rotateY: 90,
          opacity: 0
        },
        animate: {
          rotateY: 0,
          opacity: 1
        },
        exit: {
          rotateY: -90,
          opacity: 0
        }
      },
      'crossfade': {
        initial: {
          opacity: 0,
          scale: 0.95
        },
        animate: {
          opacity: 1,
          scale: 1
        },
        exit: {
          opacity: 0,
          scale: 1.05
        }
      },
      'ken-burns': {
        initial: {
          scale: 1,
          opacity: 0
        },
        animate: {
          scale: 1.1,
          opacity: 1
        },
        exit: {
          scale: 1.2,
          opacity: 0
        }
      }
    };
    return variants[actualType] || variants.fade;
  };

  // @return
  return <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full">
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} className="relative h-[60vh] min-h-[400px] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 bg-black/40" />
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${config.featurePictureUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: `${config.featurePicturePosition.x}% ${config.featurePicturePosition.y}%`,
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'scroll'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.h1 initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.3,
            duration: 0.8
          }} className="text-4xl md:text-5xl lg:text-6xl font-serif text-white text-center px-6 drop-shadow-2xl">
              {config.heading}
            </motion.h1>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
            {!config.disableUpload && <motion.button whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                <Upload className="w-5 h-5" />
                Upload Photos
              </motion.button>}
            {!config.disableSlideshow && photos.length > 0 && <motion.button whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setShowSlideshowSettings(true)} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg">
                <Play className="w-5 h-5" />
                Start Slideshow
              </motion.button>}
            {!config.disableSlideshow && photos.length === 0 && <motion.div whileHover={{
            scale: 1.05
          }} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg opacity-50 cursor-not-allowed shadow-lg">
                <Play className="w-5 h-5" />
                Start Slideshow
              </motion.div>}
          </div>

          {photos.length === 0 ? <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="text-center py-20 text-gray-500">
              <p className="text-lg">No photos yet. Be the first to share a memory.</p>
            </motion.div> : <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {photos.map((photo, index) => <motion.div key={photo.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.05
          }} className="break-inside-avoid">
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow relative group cursor-pointer" onClick={() => openEnlargedPhoto(index)}>
                    <img src={photo.thumbnailUrl || photo.url} alt={`Memory ${index + 1}`} loading="lazy" className="w-full h-auto object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePhoto(photo.id, 90);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
                        title="Rotate clockwise"
                        style={{ display: isConfigUnlocked ? 'block' : 'none' }}
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePhoto(photo.id, 270);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
                        title="Rotate counter-clockwise"
                        style={{ display: isConfigUnlocked ? 'block' : 'none' }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg"
                        title="Delete photo"
                        style={{ display: isConfigUnlocked ? 'block' : 'none' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {photo.uploaderName && config.displayUploaderInGallery && <div className="p-3 text-sm text-gray-600">
                        {config.photoSharedByText} {photo.uploaderName}
                      </div>}
                  </div>
                </motion.div>)}
            </div>}
        </div>

        <footer className="bg-gray-800 text-white py-6 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <p className="text-sm">{config.copyrightText}</p>
            <button onClick={() => {
              setShowConfigModal(true);
            }} className="text-gray-400 hover:text-white transition-colors" aria-label="Settings">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {showUploadModal && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)}>
            <motion.div initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Upload Photos</h2>
                  <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Drag and drop images here</p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <button 
                    onClick={() => fileInputElement.click()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Browse Files
                  </button>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>• Maximum 50 files per upload</p>
                    <p>• Maximum 50MB per file</p>
                    <p>• Supported formats: JPG, PNG, GIF, WebP, AVIF, TIFF, BMP, ICO, HEIC, HEIF</p>
                  </div>
                </div>

                {uploadFiles.length > 0 && <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {uploadFiles.length} file(s) selected
                    </p>
                    <div className="space-y-2">
                      {uploadFiles.map((file, i) => <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <div className="flex-1 min-w-0">
                            <span className="truncate block">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              {Math.round(file.size / 1024 / 1024 * 100) / 100} MB
                            </span>
                          </div>
                          <button onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 ml-2">
                            <X className="w-4 h-4" />
                          </button>
                        </div>)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Total size: {Math.round(uploadFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024 * 100) / 100} MB
                    </div>
                  </div>}

                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name {config.uploaderNameMandatory && <span className="text-red-500">*</span>}
                    </label>
                    <input type="text" value={uploaderName} onChange={e => setUploaderName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your name" />
                  </div>

                  {config.requireUploadPassword && <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Password *
                      </label>
                      <input type="password" value={uploadPassword} onChange={e => setUploadPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter upload password" />
                    </div>}
                </div>

                {uploadError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {uploadError}
                  </div>}

                {uploading && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        {uploadStatus || 'Uploading...'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-600">
                          {uploadedFiles}/{totalFiles} files
                        </span>
                        {!uploadCancelled && (
                          <button
                            onClick={cancelUpload}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ease-out ${
                          uploadCancelled ? 'bg-gray-400' : 'bg-blue-600'
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-blue-600 text-center">
                      {uploadCancelled ? 'Upload cancelled' : `${Math.round(uploadProgress)}% complete`}
                    </div>
                  </div>
                )}

                <button onClick={handleUploadSubmit} disabled={uploading} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </button>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showSlideshowSettings && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSlideshowSettings(false)}>
            <motion.div initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Slideshow Settings</h2>
                  <button onClick={() => setShowSlideshowSettings(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speed: {slideshowSpeed}s per photo
                    </label>
                    <input type="range" min="2" max="15" value={slideshowSpeed} onChange={e => setSlideshowSpeed(Number(e.target.value))} className="w-full" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transition Effect
                    </label>
                    <select value={transitionType} onChange={e => setTransitionType(e.target.value as TransitionType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="fade">Fade</option>
                      <option value="slide-left">Slide Left</option>
                      <option value="slide-right">Slide Right</option>
                      <option value="zoom-in">Zoom In</option>
                      <option value="zoom-out">Zoom Out</option>
                      <option value="flip">Flip</option>
                      <option value="crossfade">Crossfade</option>
                      <option value="ken-burns">Ken Burns</option>
                      <option value="random">Random</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Mode
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="photosPerPageMode" 
                          value="single" 
                          checked={photosPerPageMode === 'single'} 
                          onChange={e => setPhotosPerPageMode('single')} 
                          className="w-4 h-4 text-blue-600" 
                        />
                        <span className="text-sm text-gray-700">1 photo per page (default)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="photosPerPageMode" 
                          value="multiple" 
                          checked={photosPerPageMode === 'multiple'} 
                          onChange={e => setPhotosPerPageMode('multiple')} 
                          className="w-4 h-4 text-blue-600" 
                        />
                        <span className="text-sm text-gray-700">Multiple photos per page (1-5, auto-optimized)</span>
                      </label>
                    </div>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slideshow Mode
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="slideshowMode" 
                          value="sequential" 
                          checked={slideshowMode === 'sequential'} 
                          onChange={e => setSlideshowMode(e.target.value as 'sequential' | 'random')} 
                          className="w-4 h-4 text-blue-600" 
                        />
                        <span className="text-sm text-gray-700">Sequential (in order)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="slideshowMode" 
                          value="random" 
                          checked={slideshowMode === 'random'} 
                          onChange={e => setSlideshowMode(e.target.value as 'sequential' | 'random')} 
                          className="w-4 h-4 text-blue-600" 
                        />
                        <span className="text-sm text-gray-700">Random order</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={displayUploaderInSlideshow} 
                        onChange={e => setDisplayUploaderInSlideshow(e.target.checked)} 
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span className="text-sm text-gray-700">Display uploader name in slideshow</span>
                    </label>

                    {displayUploaderInSlideshow && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          "Photo Shared by" Text
                        </label>
                        <input 
                          type="text" 
                          value={photoSubmittedByText} 
                          onChange={e => setPhotoSubmittedByText(e.target.value)} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                          placeholder="Photo Shared by" 
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">Photo Selection</h3>
                    </div>
                    
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={useAllPhotos}
                          onChange={(e) => setUseAllPhotos(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Slideshow will use all photos</span>
                      </label>
                    </div>

                    {!useAllPhotos && (
                      <>
                        <div className="flex gap-2 mb-3">
                          <button 
                            onClick={selectAllPhotos}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Select All
                          </button>
                          <button 
                            onClick={clearPhotoSelection}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Clear
                          </button>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          {selectedPhotos.size} of {photos.length} photos selected
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                          <div className="grid grid-cols-4 gap-2">
                            {photos.map((photo) => (
                              <div 
                                key={photo.id}
                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                                  selectedPhotos.has(photo.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => togglePhotoSelection(photo.id)}
                              >
                                <img 
                                  src={photo.thumbnailUrl || photo.url} 
                                  alt="Thumbnail" 
                                  className="w-full h-16 object-cover"
                                />
                                {selectedPhotos.has(photo.id) && (
                                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <button onClick={startSlideshow} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Start Slideshow
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showFullscreenSlideshow && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black z-50 overflow-hidden">
            <div className="w-full h-full relative">
              <AnimatePresence mode="wait">
                <motion.div key={currentSlideIndex} {...getTransitionVariants(transitionType)} transition={{
                  duration: 0.8
                }} className="absolute inset-0 w-full h-full">
                  {(() => {
                    const { photos, layout, photosPerPage } = getCurrentPageData();
                    
                    if (photosPerPage === 0 || !layout) return null;
                    
                    return photos.map((photo, index) => {
                      const position = layout[index];
                      if (!position) return null;
                      
                      return (
                        <div
                          key={`${currentSlideIndex}-${index}`}
                          className="absolute"
                          style={{
                            left: `${position.x}%`,
                            top: `${position.y}%`,
                            width: `${position.width}%`,
                            height: `${position.height}%`
                          }}
                        >
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      );
                    });
                  })()}
                </motion.div>
              </AnimatePresence>

              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6"
                initial={{ opacity: 1 }}
                animate={{ opacity: showSlideshowControls ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                  <div className="flex items-center gap-4">
                    <button onClick={togglePlayPause} className="text-white hover:text-gray-300 transition-colors">
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </button>
                    <button onClick={prevSlide} className="text-white hover:text-gray-300 transition-colors">
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <span className="text-white font-medium">
                      Page {currentSlideIndex + 1} / {getTotalPages()}
                    </span>
                    <button onClick={nextSlide} className="text-white hover:text-gray-300 transition-colors">
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                      {isFullscreen ? <Minimize2 className="w-8 h-8" /> : <Maximize2 className="w-8 h-8" />}
                    </button>
                    <button onClick={exitFullscreen} className="text-white hover:text-gray-300 transition-colors">
                      <Minimize2 className="w-8 h-8" />
                    </button>
                  </div>
                </div>
                
                {/* Page info display */}
                {(() => {
                  const { photosPerPage } = getCurrentPageData();
                  return photosPerPage > 0 && (
                    <div className="mt-4 text-center">
                      <p className="text-white/80 text-sm">
                        {photosPerPage} photo{photosPerPage !== 1 ? 's' : ''} on this page
                      </p>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* Enlarged Photo Modal */}
      <AnimatePresence>
        {showEnlargedPhoto && photos[enlargedPhotoIndex] && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
            onClick={closeEnlargedPhoto}
          >
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              {/* Close button */}
              <button 
                onClick={closeEnlargedPhoto}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Navigation arrows */}
              {photos.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      prevEnlargedPhoto();
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
                  >
                    <ChevronLeft className="w-12 h-12" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      nextEnlargedPhoto();
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
                  >
                    <ChevronRight className="w-12 h-12" />
                  </button>
                </>
              )}

              {/* Photo */}
              <img 
                src={photos[enlargedPhotoIndex].url} 
                alt={`Enlarged photo ${enlargedPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Photo info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">
                      {enlargedPhotoIndex + 1} / {photos.length}
                    </p>
                    {photos[enlargedPhotoIndex].uploaderName && config.displayUploaderInGallery && (
                      <p className="text-sm text-gray-300">
                        {config.photoSharedByText} {photos[enlargedPhotoIndex].uploaderName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotatePhoto(photos[enlargedPhotoIndex].id, 90);
                      }}
                      className="text-white hover:text-gray-300 transition-colors"
                      title="Rotate clockwise"
                      style={{ display: isConfigUnlocked ? 'block' : 'none' }}
                    >
                      <RotateCw className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotatePhoto(photos[enlargedPhotoIndex].id, 270);
                      }}
                      className="text-white hover:text-gray-300 transition-colors"
                      title="Rotate counter-clockwise"
                      style={{ display: isConfigUnlocked ? 'block' : 'none' }}
                    >
                      <RotateCcw className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => {
                        closeEnlargedPhoto();
                        setShowFullscreenSlideshow(true);
                        setCurrentSlideIndex(enlargedPhotoIndex);
                      }}
                      className="text-white hover:text-gray-300 transition-colors"
                      title="Start slideshow from this photo"
                    >
                      <Play className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfigModal && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Configuration</h2>
                  <div className="flex items-center gap-2">
                    {isConfigUnlocked && (
                      <button 
                        onClick={() => {
                          setIsConfigUnlocked(false);
                          setConfigPassword('');
                          setConfigError('');
                          setEditingConfig(DEFAULT_CONFIG);
                        }}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Logout
                      </button>
                    )}
                    <button onClick={() => {
                setShowConfigModal(false);
                setConfigPassword('');
                setConfigError('');
                setEditingConfig(DEFAULT_CONFIG);
              }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {!isConfigUnlocked ? <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enter Configuration Password
                      </label>
                      <input type="password" value={configPassword} onChange={e => setConfigPassword(e.target.value)} onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (configPassword === config.configPassword) {
                      setIsConfigUnlocked(true);
                      setConfigError('');
                    } else {
                      setConfigError('Incorrect password');
                    }
                  }
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter password" autoFocus />
                    </div>

                    {configError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {configError}
                      </div>}

                    <button onClick={() => {
                if (configPassword === config.configPassword) {
                  setIsConfigUnlocked(true);
                  setConfigError('');
                } else {
                  setConfigError('Incorrect password');
                }
              }} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Unlock
                    </button>
                  </div> : <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heading Text
                      </label>
                      <input type="text" value={editingConfig.heading} onChange={e => setEditingConfig({
                  ...editingConfig,
                  heading: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feature Picture
                      </label>
                      <div className="mb-3 space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Enter URL or Upload Image</label>
                          <input type="url" value={editingConfig.featurePictureUrl} onChange={e => setEditingConfig({
                      ...editingConfig,
                      featurePictureUrl: e.target.value
                    })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://example.com/image.jpg" />
                        </div>
                        <div className="flex gap-2">
                          <label className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium cursor-pointer text-center">
                            Upload Image
                            <input 
                              ref={featureImageInputRef} 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={e => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onload = event => {
                                    if (typeof event.target?.result === 'string') {
                                      setEditingConfig({
                                        ...editingConfig,
                                        featurePictureUrl: event.target.result
                                      });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                        </div>
                      </div>
                      {editingConfig.featurePictureUrl && (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600">
                            Drag the image to adjust positioning
                          </div>
                          <div 
                            className="relative rounded-lg overflow-hidden border border-gray-300 h-48 cursor-move"
                            onMouseDown={handleImageDragStart}
                            onMouseMove={handleImageDrag}
                            onMouseUp={handleImageDragEnd}
                            onMouseLeave={handleImageDragEnd}
                          >
                            <div 
                              className="absolute inset-0 w-full h-full"
                              style={{
                                backgroundImage: `url(${editingConfig.featurePictureUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: `${editingConfig.featurePicturePosition.x}% ${editingConfig.featurePicturePosition.y}%`,
                                backgroundRepeat: 'no-repeat',
                                backgroundAttachment: 'scroll'
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                            <div 
                              className="absolute w-4 h-4 bg-white rounded-full border-2 border-blue-500 pointer-events-none"
                              style={{
                                left: `${editingConfig.featurePicturePosition.x}%`,
                                top: `${editingConfig.featurePicturePosition.y}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            Position: {Math.round(editingConfig.featurePicturePosition.x)}%, {Math.round(editingConfig.featurePicturePosition.y)}%
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Configuration Password
                      </label>
                      <input type="password" value={editingConfig.configPassword} onChange={e => setEditingConfig({
                  ...editingConfig,
                  configPassword: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editingConfig.requireUploadPassword} onChange={e => setEditingConfig({
                    ...editingConfig,
                    requireUploadPassword: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Require password for uploads</span>
                      </label>

                      {editingConfig.requireUploadPassword && <input type="password" value={editingConfig.uploadPassword} onChange={e => setEditingConfig({
                  ...editingConfig,
                  uploadPassword: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Upload password" />}

                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editingConfig.disableSlideshow} onChange={e => setEditingConfig({
                    ...editingConfig,
                    disableSlideshow: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Disable slideshow button</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editingConfig.disableUpload} onChange={e => setEditingConfig({
                    ...editingConfig,
                    disableUpload: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Disable upload button</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editingConfig.uploaderNameMandatory} onChange={e => setEditingConfig({
                    ...editingConfig,
                    uploaderNameMandatory: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Uploader name mandatory</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Footer Text
                      </label>
                      <input type="text" value={editingConfig.copyrightText} onChange={e => setEditingConfig({
                      ...editingConfig,
                      copyrightText: e.target.value
                    })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="MemoryLane - when memories live forever" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Browser Window Title
                      </label>
                      <input type="text" value={editingConfig.windowTitle} onChange={e => setEditingConfig({
                      ...editingConfig,
                      windowTitle: e.target.value
                    })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="MemoryLane" />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Uploader Name Display</h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={editingConfig.displayUploaderInGallery} onChange={e => setEditingConfig({
                            ...editingConfig,
                            displayUploaderInGallery: e.target.checked
                          })} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-sm text-gray-700">Display uploader name in gallery</span>
                        </label>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            "Photo Shared by" Text
                          </label>
                          <input type="text" value={editingConfig.photoSharedByText} onChange={e => setEditingConfig({
                            ...editingConfig,
                            photoSharedByText: e.target.value
                          })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Photo Shared by" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Export Images</h3>
                      <div className="space-y-4">
                        {exportStatus.hasExport ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-green-800">Export Ready</h4>
                                <p className="text-sm text-green-600 mt-1">
                                  {exportStatus.filename} • {exportStatus.size ? `${Math.round(exportStatus.size / 1024 / 1024 * 100) / 100} MB` : 'Unknown size'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={copyDownloadLink}
                                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Copy Link
                                </button>
                                <button
                                  onClick={deleteExport}
                                  disabled={isDeletingExport}
                                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  {isDeletingExport ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-800">No Export Available</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Create a zip file containing all uploaded images
                                </p>
                              </div>
                              <button
                                onClick={createExport}
                                disabled={isCreatingExport}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {isCreatingExport ? 'Creating...' : 'Create Export'}
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Only one export can exist at a time. Delete the current export to create a new one.
                        </p>
                      </div>
                    </div>

                    <button onClick={handleConfigSubmit} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Save Configuration
                    </button>
                  </div>}
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      {/* Configuration Saved Confirmation */}
      <AnimatePresence>
        {configSaved && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              Configuration saved successfully!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>;
};