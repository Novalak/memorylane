import React from 'react';
import { Upload, Play, Settings, X, ChevronLeft, ChevronRight, Pause, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
type Photo = {
  id: string;
  url: string;
  uploaderName?: string;
  timestamp: number;
};
type Config = {
  heading: string;
  featurePictureUrl: string;
  configPassword: string;
  requireUploadPassword: boolean;
  uploadPassword: string;
  disableSlideshow: boolean;
  disableUpload: boolean;
  uploaderNameMandatory: boolean;
};
type TransitionType = 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'flip' | 'crossfade' | 'ken-burns' | 'random';
const DEFAULT_CONFIG: Config = {
  heading: 'In the loving memory of Marcia Brown.',
  featurePictureUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop',
  configPassword: 'admin123',
  requireUploadPassword: false,
  uploadPassword: 'upload123',
  disableSlideshow: false,
  disableUpload: false,
  uploaderNameMandatory: false
};
const getStoredConfig = (): Config => {
  try {
    const stored = localStorage.getItem('memorial-config');
    return stored ? {
      ...DEFAULT_CONFIG,
      ...JSON.parse(stored)
    } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
};
const getStoredPhotos = (): Photo[] => {
  try {
    const stored = localStorage.getItem('memorial-photos');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// @component: MemorialWebsite
export const MemorialWebsite = () => {
  const [config, setConfig] = React.useState<Config>(getStoredConfig);
  const [photos, setPhotos] = React.useState<Photo[]>(() => {
    const stored = getStoredPhotos();
    // Add demo photos on first load if no photos exist
    if (stored.length === 0) {
      return [{
        id: 'demo-1',
        url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop',
        uploaderName: 'Family Member',
        timestamp: Date.now()
      }, {
        id: 'demo-2',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
        uploaderName: 'Friend',
        timestamp: Date.now()
      }, {
        id: 'demo-3',
        url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&auto=format&fit=crop',
        uploaderName: 'Relative',
        timestamp: Date.now()
      }];
    }
    return stored;
  });
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [showConfigModal, setShowConfigModal] = React.useState(false);
  const [showSlideshowSettings, setShowSlideshowSettings] = React.useState(false);
  const [showFullscreenSlideshow, setShowFullscreenSlideshow] = React.useState(false);
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([]);
  const [uploaderName, setUploaderName] = React.useState('');
  const [uploadPassword, setUploadPassword] = React.useState('');
  const [configPassword, setConfigPassword] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const [configError, setConfigError] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = React.useState(5);
  const [transitionType, setTransitionType] = React.useState<TransitionType>('fade');
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [editingConfig, setEditingConfig] = React.useState<Config>(config);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const featureImageInputRef = React.useRef<HTMLInputElement>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isConfigUnlocked, setIsConfigUnlocked] = React.useState(false);
  React.useEffect(() => {
    localStorage.setItem('memorial-config', JSON.stringify(config));
  }, [config]);
  React.useEffect(() => {
    localStorage.setItem('memorial-photos', JSON.stringify(photos));
  }, [photos]);
  React.useEffect(() => {
    if (showFullscreenSlideshow && isPlaying && photos.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % photos.length);
      }, slideshowSpeed * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showFullscreenSlideshow, isPlaying, photos.length, slideshowSpeed]);
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
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      setUploadFiles(prev => [...prev, ...files]);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      setUploadFiles(prev => [...prev, ...files]);
    }
  };
  const handleUploadSubmit = async () => {
    setUploadError('');
    if (uploadFiles.length === 0) {
      setUploadError('Please select at least one image');
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPhotos: Photo[] = uploadFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      uploaderName: uploaderName.trim() || undefined,
      timestamp: Date.now()
    }));
    setPhotos(prev => [...newPhotos, ...prev]);
    setUploadFiles([]);
    setUploaderName('');
    setUploadPassword('');
    setUploading(false);
    setShowUploadModal(false);
  };
  const handleConfigSubmit = () => {
    setConfigError('');
    if (configPassword !== config.configPassword) {
      setConfigError('Incorrect password');
      return;
    }
    setConfig(editingConfig);
    setShowConfigModal(false);
    setConfigPassword('');
  };
  const startSlideshow = () => {
    if (photos.length === 0) return;
    setCurrentSlideIndex(0);
    setIsPlaying(true);
    setShowSlideshowSettings(false);
    setShowFullscreenSlideshow(true);
  };
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  const nextSlide = () => {
    setCurrentSlideIndex(prev => (prev + 1) % photos.length);
  };
  const prevSlide = () => {
    setCurrentSlideIndex(prev => (prev - 1 + photos.length) % photos.length);
  };
  const exitFullscreen = () => {
    setShowFullscreenSlideshow(false);
    setIsPlaying(false);
  };
  const getTransitionVariants = (type: TransitionType) => {
    const actualType = type === 'random' ? ['fade', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out', 'flip', 'crossfade', 'ken-burns'][Math.floor(Math.random() * 8)] as TransitionType : type;
    const variants: Record<string, any> = {
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
          <img src={config.featurePictureUrl} alt="Memorial feature" className="w-full h-full object-cover" />
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
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <img src={photo.url} alt={`Memory ${index + 1}`} loading="lazy" className="w-full h-auto object-cover" />
                    {photo.uploaderName && <div className="p-3 text-sm text-gray-600">
                        Shared by {photo.uploaderName}
                      </div>}
                  </div>
                </motion.div>)}
            </div>}
        </div>

        <footer className="bg-gray-800 text-white py-6 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <p className="text-sm">© {new Date().getFullYear()} Memorial Website</p>
            <button onClick={() => setShowConfigModal(true)} className="text-gray-400 hover:text-white transition-colors" aria-label="Settings">
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
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Browse Files
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>

                {uploadFiles.length > 0 && <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {uploadFiles.length} file(s) selected
                    </p>
                    <div className="space-y-2">
                      {uploadFiles.map((file, i) => <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span className="truncate">{file.name}</span>
                          <button onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>)}
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
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-md w-full">
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
      }} className="fixed inset-0 bg-black z-50">
            <div className="w-full h-full relative">
              <AnimatePresence mode="wait">
                <motion.img key={currentSlideIndex} src={photos[currentSlideIndex].url} alt={`Slide ${currentSlideIndex + 1}`} {...getTransitionVariants(transitionType)} transition={{
              duration: 0.8
            }} className="absolute inset-0 w-full h-full object-contain" />
              </AnimatePresence>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                  <div className="flex items-center gap-4">
                    <button onClick={togglePlayPause} className="text-white hover:text-gray-300 transition-colors">
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </button>
                    <button onClick={prevSlide} className="text-white hover:text-gray-300 transition-colors">
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <span className="text-white font-medium">
                      {currentSlideIndex + 1} / {photos.length}
                    </span>
                    <button onClick={nextSlide} className="text-white hover:text-gray-300 transition-colors">
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </div>
                  <button onClick={exitFullscreen} className="text-white hover:text-gray-300 transition-colors">
                    <Minimize2 className="w-8 h-8" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showConfigModal && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => {
        setShowConfigModal(false);
        setConfigPassword('');
        setConfigError('');
        setIsConfigUnlocked(false);
      }}>
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
                  <button onClick={() => {
                setShowConfigModal(false);
                setConfigPassword('');
                setConfigError('');
                setIsConfigUnlocked(false);
              }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
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
                          <button onClick={() => featureImageInputRef.current?.click()} className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                            Upload Image
                          </button>
                          <input ref={featureImageInputRef} type="file" accept="image/*" onChange={e => {
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
                    }} className="hidden" />
                        </div>
                      </div>
                      {editingConfig.featurePictureUrl && <div className="rounded-lg overflow-hidden border border-gray-300 h-32">
                          <img src={editingConfig.featurePictureUrl} alt="Feature preview" className="w-full h-full object-cover" />
                        </div>}
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

                    <button onClick={handleConfigSubmit} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Save Configuration
                    </button>
                  </div>}
              </div>
            </motion.div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};