import { SortableContainer } from "@/dnd-kit/SortableContainer";
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
  const [photos, setPhotos] = React.useState<Photo[]>(getStoredPhotos);
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
  return <SortableContainer dndKitId="734f0294-de1d-4c15-8efe-6595c05ab994" containerType="regular" prevTag="div" className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" data-magicpath-id="0" data-magicpath-path="MemorialWebsite.tsx">
      <SortableContainer dndKitId="8724c89d-9987-46a9-b2c0-df55ed655f95" containerType="regular" prevTag="div" className="w-full" data-magicpath-id="1" data-magicpath-path="MemorialWebsite.tsx">
        <SortableContainer dndKitId="1a7a59fe-bd07-40ba-aa41-12a8bd2fb2a6" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} className="relative h-[60vh] min-h-[400px] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden" data-magicpath-id="2" data-magicpath-path="MemorialWebsite.tsx">
          <div className="absolute inset-0 bg-black/40" data-magicpath-id="3" data-magicpath-path="MemorialWebsite.tsx" />
          <img src={config.featurePictureUrl} alt="Memorial feature" className="w-full h-full object-cover" data-magicpath-id="4" data-magicpath-path="MemorialWebsite.tsx" />
          <SortableContainer dndKitId="db006a99-fa2a-4aa8-a7c7-bc000e9e41c1" containerType="regular" prevTag="div" className="absolute inset-0 flex items-center justify-center" data-magicpath-id="5" data-magicpath-path="MemorialWebsite.tsx">
            <motion.h1 data-magicpath-motion-tag="motion.h1" initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.3,
            duration: 0.8
          }} className="text-4xl md:text-5xl lg:text-6xl font-serif text-white text-center px-6 drop-shadow-2xl" data-magicpath-id="6" data-magicpath-path="MemorialWebsite.tsx">
              {config.heading}
            </motion.h1>
          </SortableContainer>
        </SortableContainer>

        <SortableContainer dndKitId="b3267477-587b-4308-8689-1edd5ba31822" containerType="regular" prevTag="div" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-magicpath-id="7" data-magicpath-path="MemorialWebsite.tsx">
          <SortableContainer dndKitId="fdd5b24c-b8cd-40cc-99b0-148ce85696ec" containerType="regular" prevTag="div" className="flex flex-col sm:flex-row gap-4 mb-8 justify-center" data-magicpath-id="8" data-magicpath-path="MemorialWebsite.tsx">
            {!config.disableUpload && <SortableContainer dndKitId="cb9fb726-4a86-4611-9b67-7ff1729d1770" containerType="regular" prevTag="motion.button" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg" data-magicpath-id="9" data-magicpath-path="MemorialWebsite.tsx">
                <Upload className="w-5 h-5" data-magicpath-id="10" data-magicpath-path="MemorialWebsite.tsx" />
                Upload Photos
              </SortableContainer>}
            {!config.disableSlideshow && photos.length > 0 && <SortableContainer dndKitId="f7863b14-b17c-4a44-8276-c4bee6f0879e" containerType="regular" prevTag="motion.button" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setShowSlideshowSettings(true)} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg" data-magicpath-id="11" data-magicpath-path="MemorialWebsite.tsx">
                <Play className="w-5 h-5" data-magicpath-id="12" data-magicpath-path="MemorialWebsite.tsx" />
                Start Slideshow
              </SortableContainer>}
          </SortableContainer>

          {photos.length === 0 ? <SortableContainer dndKitId="9bb5c81d-f3e2-4af0-8320-12248184c91d" containerType="regular" prevTag="motion.div" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="text-center py-20 text-gray-500" data-magicpath-id="13" data-magicpath-path="MemorialWebsite.tsx">
              <p className="text-lg" data-magicpath-id="14" data-magicpath-path="MemorialWebsite.tsx">No photos yet. Be the first to share a memory.</p>
            </SortableContainer> : <SortableContainer dndKitId="01bc00ea-0f2b-4d35-9519-de92e3fe0b8d" containerType="collection" prevTag="div" className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4" data-magicpath-id="15" data-magicpath-path="MemorialWebsite.tsx">
              {photos.map((photo, index) => <motion.div data-magicpath-motion-tag="motion.div" key={photo.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.05
          }} className="break-inside-avoid" data-magicpath-uuid={(photo as any)["mpid"] ?? "unsafe"} data-magicpath-id="16" data-magicpath-path="MemorialWebsite.tsx">
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow" data-magicpath-uuid={(photo as any)["mpid"] ?? "unsafe"} data-magicpath-id="17" data-magicpath-path="MemorialWebsite.tsx">
                    <img src={photo.url} alt={`Memory ${index + 1}`} loading="lazy" className="w-full h-auto object-cover" data-magicpath-uuid={(photo as any)["mpid"] ?? "unsafe"} data-magicpath-field="url:unknown" data-magicpath-id="18" data-magicpath-path="MemorialWebsite.tsx" />
                    {photo.uploaderName && <div className="p-3 text-sm text-gray-600" data-magicpath-uuid={(photo as any)["mpid"] ?? "unsafe"} data-magicpath-field="uploaderName:unknown" data-magicpath-id="19" data-magicpath-path="MemorialWebsite.tsx">
                        Shared by {photo.uploaderName}
                      </div>}
                  </div>
                </motion.div>)}
            </SortableContainer>}
        </SortableContainer>

        <SortableContainer dndKitId="67c6834b-6f87-444f-935a-9f04367ac865" containerType="regular" prevTag="footer" className="bg-gray-800 text-white py-6 mt-20" data-magicpath-id="20" data-magicpath-path="MemorialWebsite.tsx">
          <SortableContainer dndKitId="93e013f4-2919-4dc5-b0cf-d3a6681e7662" containerType="regular" prevTag="div" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center" data-magicpath-id="21" data-magicpath-path="MemorialWebsite.tsx">
            <p className="text-sm" data-magicpath-id="22" data-magicpath-path="MemorialWebsite.tsx">© {new Date().getFullYear()} Memorial Website</p>
            <SortableContainer dndKitId="1c9fc743-87be-4039-a783-91feb479f16b" containerType="regular" prevTag="button" onClick={() => setShowConfigModal(true)} className="text-gray-400 hover:text-white transition-colors" aria-label="Settings" data-magicpath-id="23" data-magicpath-path="MemorialWebsite.tsx">
              <Settings className="w-6 h-6" data-magicpath-id="24" data-magicpath-path="MemorialWebsite.tsx" />
            </SortableContainer>
          </SortableContainer>
        </SortableContainer>
      </SortableContainer>

      <AnimatePresence data-magicpath-id="25" data-magicpath-path="MemorialWebsite.tsx">
        {showUploadModal && <SortableContainer dndKitId="4065f130-bade-4e32-978e-4976e898b441" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)} data-magicpath-id="26" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="21844260-ec79-4e97-a201-b951cb7b1740" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" data-magicpath-id="27" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="64e95918-b7de-4538-8beb-a8d0a02169c3" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="28" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="312443c1-a449-47b5-a17d-70b906a34e1a" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="29" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="30" data-magicpath-path="MemorialWebsite.tsx">Upload Photos</h2>
                  <SortableContainer dndKitId="54777477-8c9f-464e-8684-0cdb26a1f4bc" containerType="regular" prevTag="button" onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600" data-magicpath-id="31" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="32" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                <SortableContainer dndKitId="c1e88498-b4e6-4886-b424-22d434787095" containerType="regular" prevTag="div" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} data-magicpath-id="33" data-magicpath-path="MemorialWebsite.tsx">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" data-magicpath-id="34" data-magicpath-path="MemorialWebsite.tsx" />
                  <p className="text-gray-600 mb-2" data-magicpath-id="35" data-magicpath-path="MemorialWebsite.tsx">Drag and drop images here</p>
                  <p className="text-sm text-gray-500 mb-4" data-magicpath-id="36" data-magicpath-path="MemorialWebsite.tsx">or</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="37" data-magicpath-path="MemorialWebsite.tsx">
                    Browse Files
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" data-magicpath-id="38" data-magicpath-path="MemorialWebsite.tsx" />
                </SortableContainer>

                {uploadFiles.length > 0 && <SortableContainer dndKitId="23c18af1-3bfb-4f52-8a48-7e66b5b662c4" containerType="regular" prevTag="div" className="mb-4" data-magicpath-id="39" data-magicpath-path="MemorialWebsite.tsx">
                    <p className="text-sm text-gray-600 mb-2" data-magicpath-id="40" data-magicpath-path="MemorialWebsite.tsx">
                      {uploadFiles.length} file(s) selected
                    </p>
                    <SortableContainer dndKitId="65f7641f-9bc2-4141-990b-94715788a963" containerType="collection" prevTag="div" className="space-y-2" data-magicpath-id="41" data-magicpath-path="MemorialWebsite.tsx">
                      {uploadFiles.map((file, i) => <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="42" data-magicpath-path="MemorialWebsite.tsx">
                          <span className="truncate" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-field="name:unknown" data-magicpath-id="43" data-magicpath-path="MemorialWebsite.tsx">{file.name}</span>
                          <button onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="44" data-magicpath-path="MemorialWebsite.tsx">
                            <X className="w-4 h-4" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="45" data-magicpath-path="MemorialWebsite.tsx" />
                          </button>
                        </div>)}
                    </SortableContainer>
                  </SortableContainer>}

                <SortableContainer dndKitId="61bca359-d393-4ef5-af91-1b2a7c49d0de" containerType="regular" prevTag="div" className="space-y-4 mb-4" data-magicpath-id="46" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="44a8059a-d044-4bde-8d4f-54882c758217" containerType="regular" prevTag="div" data-magicpath-id="47" data-magicpath-path="MemorialWebsite.tsx">
                    <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="48" data-magicpath-path="MemorialWebsite.tsx">
                      Your Name {config.uploaderNameMandatory && <span className="text-red-500" data-magicpath-id="49" data-magicpath-path="MemorialWebsite.tsx">*</span>}
                    </label>
                    <input type="text" value={uploaderName} onChange={e => setUploaderName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your name" data-magicpath-id="50" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>

                  {config.requireUploadPassword && <SortableContainer dndKitId="28878e2e-45da-4f45-8660-e0d1c9dfcf04" containerType="regular" prevTag="div" data-magicpath-id="51" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="52" data-magicpath-path="MemorialWebsite.tsx">
                        Upload Password *
                      </label>
                      <input type="password" value={uploadPassword} onChange={e => setUploadPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter upload password" data-magicpath-id="53" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>}
                </SortableContainer>

                {uploadError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-magicpath-id="54" data-magicpath-path="MemorialWebsite.tsx">
                    {uploadError}
                  </div>}

                <button onClick={handleUploadSubmit} disabled={uploading} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" data-magicpath-id="55" data-magicpath-path="MemorialWebsite.tsx">
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </button>
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>

      <AnimatePresence data-magicpath-id="56" data-magicpath-path="MemorialWebsite.tsx">
        {showSlideshowSettings && <SortableContainer dndKitId="2a0d6427-507b-422d-a7a5-8d5e9692e61d" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSlideshowSettings(false)} data-magicpath-id="57" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="13ca0027-02f9-482b-aeec-8aedb8d2618c" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-md w-full" data-magicpath-id="58" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="b2e8d157-4888-4b4e-86f8-d95d9fe53cf6" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="59" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="c60ccbf9-2ec8-4b49-96c8-ce1099700971" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="60" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="61" data-magicpath-path="MemorialWebsite.tsx">Slideshow Settings</h2>
                  <SortableContainer dndKitId="df371ea9-5d61-4a54-9034-25c495864d2c" containerType="regular" prevTag="button" onClick={() => setShowSlideshowSettings(false)} className="text-gray-400 hover:text-gray-600" data-magicpath-id="62" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="63" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                <SortableContainer dndKitId="712b80ab-a91f-4db6-bbcb-719db813ed0a" containerType="regular" prevTag="div" className="space-y-6" data-magicpath-id="64" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="d8a188ca-e267-4a36-853e-67ffd689678a" containerType="regular" prevTag="div" data-magicpath-id="65" data-magicpath-path="MemorialWebsite.tsx">
                    <label className="block text-sm font-medium text-gray-700 mb-2" data-magicpath-id="66" data-magicpath-path="MemorialWebsite.tsx">
                      Speed: {slideshowSpeed}s per photo
                    </label>
                    <input type="range" min="2" max="15" value={slideshowSpeed} onChange={e => setSlideshowSpeed(Number(e.target.value))} className="w-full" data-magicpath-id="67" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>

                  <SortableContainer dndKitId="466261e9-1526-47e2-841b-1a1f10f187bf" containerType="regular" prevTag="div" data-magicpath-id="68" data-magicpath-path="MemorialWebsite.tsx">
                    <label className="block text-sm font-medium text-gray-700 mb-2" data-magicpath-id="69" data-magicpath-path="MemorialWebsite.tsx">
                      Transition Effect
                    </label>
                    <select value={transitionType} onChange={e => setTransitionType(e.target.value as TransitionType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="70" data-magicpath-path="MemorialWebsite.tsx">
                      <option value="fade" data-magicpath-id="71" data-magicpath-path="MemorialWebsite.tsx">Fade</option>
                      <option value="slide-left" data-magicpath-id="72" data-magicpath-path="MemorialWebsite.tsx">Slide Left</option>
                      <option value="slide-right" data-magicpath-id="73" data-magicpath-path="MemorialWebsite.tsx">Slide Right</option>
                      <option value="zoom-in" data-magicpath-id="74" data-magicpath-path="MemorialWebsite.tsx">Zoom In</option>
                      <option value="zoom-out" data-magicpath-id="75" data-magicpath-path="MemorialWebsite.tsx">Zoom Out</option>
                      <option value="flip" data-magicpath-id="76" data-magicpath-path="MemorialWebsite.tsx">Flip</option>
                      <option value="crossfade" data-magicpath-id="77" data-magicpath-path="MemorialWebsite.tsx">Crossfade</option>
                      <option value="ken-burns" data-magicpath-id="78" data-magicpath-path="MemorialWebsite.tsx">Ken Burns</option>
                      <option value="random" data-magicpath-id="79" data-magicpath-path="MemorialWebsite.tsx">Random</option>
                    </select>
                  </SortableContainer>

                  <SortableContainer dndKitId="e1b92d01-7922-4314-b3af-b84c551caf85" containerType="regular" prevTag="button" onClick={startSlideshow} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2" data-magicpath-id="80" data-magicpath-path="MemorialWebsite.tsx">
                    <Play className="w-5 h-5" data-magicpath-id="81" data-magicpath-path="MemorialWebsite.tsx" />
                    Start Slideshow
                  </SortableContainer>
                </SortableContainer>
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>

      <AnimatePresence data-magicpath-id="82" data-magicpath-path="MemorialWebsite.tsx">
        {showFullscreenSlideshow && <SortableContainer dndKitId="a9838a93-14b8-4275-bcd9-36039b8a0903" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black z-50" data-magicpath-id="83" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="4817bff0-85b2-456a-915b-8d9cc789bec6" containerType="regular" prevTag="div" className="w-full h-full relative" data-magicpath-id="84" data-magicpath-path="MemorialWebsite.tsx">
              <AnimatePresence mode="wait" data-magicpath-id="85" data-magicpath-path="MemorialWebsite.tsx">
                <motion.img data-magicpath-motion-tag="motion.img" key={currentSlideIndex} src={photos[currentSlideIndex].url} alt={`Slide ${currentSlideIndex + 1}`} {...getTransitionVariants(transitionType)} transition={{
              duration: 0.8
            }} className="absolute inset-0 w-full h-full object-contain" data-magicpath-id="86" data-magicpath-path="MemorialWebsite.tsx" />
              </AnimatePresence>

              <SortableContainer dndKitId="409a5889-6201-40a0-9488-755df3a0d359" containerType="regular" prevTag="div" className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6" data-magicpath-id="87" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="75749c47-5635-41b0-a00d-a528ab99977c" containerType="regular" prevTag="div" className="flex items-center justify-between max-w-4xl mx-auto" data-magicpath-id="88" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="e6e0cf05-1657-4b1b-b19f-b5f4a9af1ed9" containerType="regular" prevTag="div" className="flex items-center gap-4" data-magicpath-id="89" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="2d50e98f-a517-46ca-a42b-be614d6d79f0" containerType="regular" prevTag="button" onClick={togglePlayPause} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="90" data-magicpath-path="MemorialWebsite.tsx">
                      {isPlaying ? <Pause className="w-8 h-8" data-magicpath-id="91" data-magicpath-path="MemorialWebsite.tsx" /> : <Play className="w-8 h-8" data-magicpath-id="92" data-magicpath-path="MemorialWebsite.tsx" />}
                    </SortableContainer>
                    <SortableContainer dndKitId="ee7dc80b-fd6c-4eea-baac-a2c51e3843f3" containerType="regular" prevTag="button" onClick={prevSlide} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="93" data-magicpath-path="MemorialWebsite.tsx">
                      <ChevronLeft className="w-8 h-8" data-magicpath-id="94" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>
                    <span className="text-white font-medium" data-magicpath-id="95" data-magicpath-path="MemorialWebsite.tsx">
                      {currentSlideIndex + 1} / {photos.length}
                    </span>
                    <SortableContainer dndKitId="206eca27-690a-4443-9c6d-390a58386caf" containerType="regular" prevTag="button" onClick={nextSlide} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="96" data-magicpath-path="MemorialWebsite.tsx">
                      <ChevronRight className="w-8 h-8" data-magicpath-id="97" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>
                  </SortableContainer>
                  <SortableContainer dndKitId="c226d5fa-7b38-4fdf-93ef-9ee4244a18de" containerType="regular" prevTag="button" onClick={exitFullscreen} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="98" data-magicpath-path="MemorialWebsite.tsx">
                    <Minimize2 className="w-8 h-8" data-magicpath-id="99" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>

      <AnimatePresence data-magicpath-id="100" data-magicpath-path="MemorialWebsite.tsx">
        {showConfigModal && <SortableContainer dndKitId="4e243fdd-7024-497a-925f-d7c518feaa7f" containerType="regular" prevTag="motion.div" initial={{
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
      }} data-magicpath-id="101" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="148112d1-36e1-46db-9ec2-8c50a74123a3" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-magicpath-id="102" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="14885fb5-9ddd-46d5-9f17-e6fad7fb550c" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="103" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="6c28d752-b94d-45fc-8dc9-f5075685878a" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="104" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="105" data-magicpath-path="MemorialWebsite.tsx">Configuration</h2>
                  <SortableContainer dndKitId="962e8a01-95b1-43d6-990a-0ce7d49eed9a" containerType="regular" prevTag="button" onClick={() => {
                setShowConfigModal(false);
                setConfigPassword('');
                setConfigError('');
                setIsConfigUnlocked(false);
              }} className="text-gray-400 hover:text-gray-600" data-magicpath-id="106" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="107" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                {!isConfigUnlocked ? <SortableContainer dndKitId="b80640c5-2b74-468c-ba97-fd5218cf4045" containerType="regular" prevTag="div" className="space-y-4" data-magicpath-id="108" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="0ce6d7b5-d224-49b2-b856-9964b911faf8" containerType="regular" prevTag="div" data-magicpath-id="109" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="110" data-magicpath-path="MemorialWebsite.tsx">
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
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter password" autoFocus data-magicpath-id="111" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    {configError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-magicpath-id="112" data-magicpath-path="MemorialWebsite.tsx">
                        {configError}
                      </div>}

                    <button onClick={() => {
                if (configPassword === config.configPassword) {
                  setIsConfigUnlocked(true);
                  setConfigError('');
                } else {
                  setConfigError('Incorrect password');
                }
              }} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="113" data-magicpath-path="MemorialWebsite.tsx">
                      Unlock
                    </button>
                  </SortableContainer> : <SortableContainer dndKitId="4360aba4-f91f-444b-a57e-6916547d6fdd" containerType="regular" prevTag="div" className="space-y-6" data-magicpath-id="114" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="a7b1f8a6-c54c-47d5-b750-22dceabe036b" containerType="regular" prevTag="div" data-magicpath-id="115" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="116" data-magicpath-path="MemorialWebsite.tsx">
                        Heading Text
                      </label>
                      <input type="text" value={editingConfig.heading} onChange={e => setEditingConfig({
                  ...editingConfig,
                  heading: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="117" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    <SortableContainer dndKitId="7d371e84-fa9a-40dc-bfe6-8634340282f5" containerType="regular" prevTag="div" data-magicpath-id="118" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="119" data-magicpath-path="MemorialWebsite.tsx">
                        Feature Picture URL
                      </label>
                      <input type="url" value={editingConfig.featurePictureUrl} onChange={e => setEditingConfig({
                  ...editingConfig,
                  featurePictureUrl: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="120" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    <SortableContainer dndKitId="2a52b5f8-0343-440d-b8eb-610bd4e78733" containerType="regular" prevTag="div" data-magicpath-id="121" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="122" data-magicpath-path="MemorialWebsite.tsx">
                        New Configuration Password
                      </label>
                      <input type="password" value={editingConfig.configPassword} onChange={e => setEditingConfig({
                  ...editingConfig,
                  configPassword: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="123" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    <SortableContainer dndKitId="8c7fb48a-deb6-46ae-a81a-6bb49703e8a0" containerType="regular" prevTag="div" className="space-y-3" data-magicpath-id="124" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="flex items-center gap-2" data-magicpath-id="125" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.requireUploadPassword} onChange={e => setEditingConfig({
                    ...editingConfig,
                    requireUploadPassword: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="126" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="127" data-magicpath-path="MemorialWebsite.tsx">Require password for uploads</span>
                      </label>

                      {editingConfig.requireUploadPassword && <input type="password" value={editingConfig.uploadPassword} onChange={e => setEditingConfig({
                  ...editingConfig,
                  uploadPassword: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Upload password" data-magicpath-id="128" data-magicpath-path="MemorialWebsite.tsx" />}

                      <label className="flex items-center gap-2" data-magicpath-id="129" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.disableSlideshow} onChange={e => setEditingConfig({
                    ...editingConfig,
                    disableSlideshow: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="130" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="131" data-magicpath-path="MemorialWebsite.tsx">Disable slideshow button</span>
                      </label>

                      <label className="flex items-center gap-2" data-magicpath-id="132" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.disableUpload} onChange={e => setEditingConfig({
                    ...editingConfig,
                    disableUpload: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="133" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="134" data-magicpath-path="MemorialWebsite.tsx">Disable upload button</span>
                      </label>

                      <label className="flex items-center gap-2" data-magicpath-id="135" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.uploaderNameMandatory} onChange={e => setEditingConfig({
                    ...editingConfig,
                    uploaderNameMandatory: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="136" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="137" data-magicpath-path="MemorialWebsite.tsx">Uploader name mandatory</span>
                      </label>
                    </SortableContainer>

                    <button onClick={handleConfigSubmit} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="138" data-magicpath-path="MemorialWebsite.tsx">
                      Save Configuration
                    </button>
                  </SortableContainer>}
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>
    </SortableContainer>;
};