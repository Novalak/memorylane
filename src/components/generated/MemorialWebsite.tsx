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
  return <SortableContainer dndKitId="198c572f-6a9c-4200-adda-aa6335a4a700" containerType="regular" prevTag="div" className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" data-magicpath-id="0" data-magicpath-path="MemorialWebsite.tsx">
      <SortableContainer dndKitId="01c05db5-6957-4a65-aebc-3a838924541f" containerType="regular" prevTag="div" className="w-full" data-magicpath-id="1" data-magicpath-path="MemorialWebsite.tsx">
        <SortableContainer dndKitId="66215f46-a01c-4a34-bd42-691a930d9f62" containerType="regular" prevTag="motion.div" initial={{
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
          <SortableContainer dndKitId="d99a1125-0dc3-453d-ac9f-a8540fdbfde3" containerType="regular" prevTag="div" className="absolute inset-0 flex items-center justify-center" data-magicpath-id="5" data-magicpath-path="MemorialWebsite.tsx">
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

        <SortableContainer dndKitId="c396b041-eeed-4995-b003-d5cadfed9b02" containerType="regular" prevTag="div" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-magicpath-id="7" data-magicpath-path="MemorialWebsite.tsx">
          <SortableContainer dndKitId="e916110b-206c-43fb-a6c4-752820ef2d0a" containerType="regular" prevTag="div" className="flex flex-col sm:flex-row gap-4 mb-8 justify-center" data-magicpath-id="8" data-magicpath-path="MemorialWebsite.tsx">
            {!config.disableUpload && <SortableContainer dndKitId="d15680c2-a280-4404-ad91-66bc42ad85cf" containerType="regular" prevTag="motion.button" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg" data-magicpath-id="9" data-magicpath-path="MemorialWebsite.tsx">
                <Upload className="w-5 h-5" data-magicpath-id="10" data-magicpath-path="MemorialWebsite.tsx" />
                Upload Photos
              </SortableContainer>}
            {!config.disableSlideshow && photos.length > 0 && <SortableContainer dndKitId="f243309c-4ee5-4e03-9352-068b84a23a57" containerType="regular" prevTag="motion.button" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setShowSlideshowSettings(true)} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg" data-magicpath-id="11" data-magicpath-path="MemorialWebsite.tsx">
                <Play className="w-5 h-5" data-magicpath-id="12" data-magicpath-path="MemorialWebsite.tsx" />
                Start Slideshow
              </SortableContainer>}
          </SortableContainer>

          {photos.length === 0 ? <SortableContainer dndKitId="4c19fa4f-d855-4b25-abab-082ff0d7246e" containerType="regular" prevTag="motion.div" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="text-center py-20 text-gray-500" data-magicpath-id="13" data-magicpath-path="MemorialWebsite.tsx">
              <p className="text-lg" data-magicpath-id="14" data-magicpath-path="MemorialWebsite.tsx">No photos yet. Be the first to share a memory.</p>
            </SortableContainer> : <SortableContainer dndKitId="7b6b34ce-1234-49f9-94ee-017396be43a0" containerType="collection" prevTag="div" className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4" data-magicpath-id="15" data-magicpath-path="MemorialWebsite.tsx">
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

        <SortableContainer dndKitId="80999305-2af0-4fb0-bc83-27c68bf674ea" containerType="regular" prevTag="footer" className="bg-gray-800 text-white py-6 mt-20" data-magicpath-id="20" data-magicpath-path="MemorialWebsite.tsx">
          <SortableContainer dndKitId="e84c1691-e77f-4053-bc16-470c5d209146" containerType="regular" prevTag="div" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center" data-magicpath-id="21" data-magicpath-path="MemorialWebsite.tsx">
            <p className="text-sm" data-magicpath-id="22" data-magicpath-path="MemorialWebsite.tsx">© {new Date().getFullYear()} Memorial Website</p>
            <SortableContainer dndKitId="7c6f91fa-91a0-4885-ac5b-ca8e784d7058" containerType="regular" prevTag="button" onClick={() => setShowConfigModal(true)} className="text-gray-400 hover:text-white transition-colors" aria-label="Settings" data-magicpath-id="23" data-magicpath-path="MemorialWebsite.tsx">
              <Settings className="w-6 h-6" data-magicpath-id="24" data-magicpath-path="MemorialWebsite.tsx" />
            </SortableContainer>
          </SortableContainer>
        </SortableContainer>
      </SortableContainer>

      <AnimatePresence data-magicpath-id="25" data-magicpath-path="MemorialWebsite.tsx">
        {showUploadModal && <SortableContainer dndKitId="021c59b2-70bc-4741-9f88-95c770a0f579" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)} data-magicpath-id="26" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="223eeb88-e85e-40a7-b35c-bf04056a023d" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" data-magicpath-id="27" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="6a5703e0-b50f-44d4-8998-2b6a075fde95" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="28" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="00992594-d87c-487f-8651-25f4e4860a17" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="29" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="30" data-magicpath-path="MemorialWebsite.tsx">Upload Photos</h2>
                  <SortableContainer dndKitId="73b32163-9a54-4228-aa59-245cb33b0183" containerType="regular" prevTag="button" onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600" data-magicpath-id="31" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="32" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                <SortableContainer dndKitId="29862dab-5dae-4911-99e6-84e91b7eee2d" containerType="regular" prevTag="div" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} data-magicpath-id="33" data-magicpath-path="MemorialWebsite.tsx">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" data-magicpath-id="34" data-magicpath-path="MemorialWebsite.tsx" />
                  <p className="text-gray-600 mb-2" data-magicpath-id="35" data-magicpath-path="MemorialWebsite.tsx">Drag and drop images here</p>
                  <p className="text-sm text-gray-500 mb-4" data-magicpath-id="36" data-magicpath-path="MemorialWebsite.tsx">or</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="37" data-magicpath-path="MemorialWebsite.tsx">
                    Browse Files
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" data-magicpath-id="38" data-magicpath-path="MemorialWebsite.tsx" />
                </SortableContainer>

                {uploadFiles.length > 0 && <SortableContainer dndKitId="718c26e5-ed74-4502-bf0b-282a32d7a85d" containerType="regular" prevTag="div" className="mb-4" data-magicpath-id="39" data-magicpath-path="MemorialWebsite.tsx">
                    <p className="text-sm text-gray-600 mb-2" data-magicpath-id="40" data-magicpath-path="MemorialWebsite.tsx">
                      {uploadFiles.length} file(s) selected
                    </p>
                    <SortableContainer dndKitId="8b916276-c189-4e40-b4e4-5bc1726e5a82" containerType="collection" prevTag="div" className="space-y-2" data-magicpath-id="41" data-magicpath-path="MemorialWebsite.tsx">
                      {uploadFiles.map((file, i) => <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="42" data-magicpath-path="MemorialWebsite.tsx">
                          <span className="truncate" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-field="name:unknown" data-magicpath-id="43" data-magicpath-path="MemorialWebsite.tsx">{file.name}</span>
                          <button onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="44" data-magicpath-path="MemorialWebsite.tsx">
                            <X className="w-4 h-4" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="45" data-magicpath-path="MemorialWebsite.tsx" />
                          </button>
                        </div>)}
                    </SortableContainer>
                  </SortableContainer>}

                <SortableContainer dndKitId="ccf0fae1-128c-4e94-acd9-7c2e1ad97ed3" containerType="regular" prevTag="div" className="space-y-4 mb-4" data-magicpath-id="46" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="2e0be23f-64b8-49fb-ab7c-54a72b91caa4" containerType="regular" prevTag="div" data-magicpath-id="47" data-magicpath-path="MemorialWebsite.tsx">
                    <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="48" data-magicpath-path="MemorialWebsite.tsx">
                      Your Name {config.uploaderNameMandatory && <span className="text-red-500" data-magicpath-id="49" data-magicpath-path="MemorialWebsite.tsx">*</span>}
                    </label>
                    <input type="text" value={uploaderName} onChange={e => setUploaderName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your name" data-magicpath-id="50" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>

                  {config.requireUploadPassword && <SortableContainer dndKitId="1b18cd83-229a-4c48-b6b3-8db53825d03e" containerType="regular" prevTag="div" data-magicpath-id="51" data-magicpath-path="MemorialWebsite.tsx">
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
        {showSlideshowSettings && <SortableContainer dndKitId="30d7bcc1-7f93-4a12-a943-e0528d714b16" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSlideshowSettings(false)} data-magicpath-id="57" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="26f372b1-8a52-4f37-9d67-00302ececbfc" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-md w-full" data-magicpath-id="58" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="ffe63fa1-669d-4bc0-acfe-6f9651861e92" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="59" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="e126be27-0126-49e5-a154-40035c788245" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="60" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="61" data-magicpath-path="MemorialWebsite.tsx">Slideshow Settings</h2>
                  <SortableContainer dndKitId="86ec81c2-6c1b-4ff9-9854-d1a2f47499f7" containerType="regular" prevTag="button" onClick={() => setShowSlideshowSettings(false)} className="text-gray-400 hover:text-gray-600" data-magicpath-id="62" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="63" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                <SortableContainer dndKitId="6af9ef96-251e-42e2-b5c4-167cb52b4a8d" containerType="regular" prevTag="div" className="space-y-6" data-magicpath-id="64" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="df15e51f-bac9-4cd6-9e38-755c78173a9f" containerType="regular" prevTag="div" data-magicpath-id="65" data-magicpath-path="MemorialWebsite.tsx">
                    <label className="block text-sm font-medium text-gray-700 mb-2" data-magicpath-id="66" data-magicpath-path="MemorialWebsite.tsx">
                      Speed: {slideshowSpeed}s per photo
                    </label>
                    <input type="range" min="2" max="15" value={slideshowSpeed} onChange={e => setSlideshowSpeed(Number(e.target.value))} className="w-full" data-magicpath-id="67" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>

                  <SortableContainer dndKitId="7d1b31d8-5e1d-4281-9d58-a19f26933052" containerType="regular" prevTag="div" data-magicpath-id="68" data-magicpath-path="MemorialWebsite.tsx">
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

                  <SortableContainer dndKitId="fa37c50b-1acc-4418-84b7-fd045a605f18" containerType="regular" prevTag="button" onClick={startSlideshow} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2" data-magicpath-id="80" data-magicpath-path="MemorialWebsite.tsx">
                    <Play className="w-5 h-5" data-magicpath-id="81" data-magicpath-path="MemorialWebsite.tsx" />
                    Start Slideshow
                  </SortableContainer>
                </SortableContainer>
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>

      <AnimatePresence data-magicpath-id="82" data-magicpath-path="MemorialWebsite.tsx">
        {showFullscreenSlideshow && <SortableContainer dndKitId="a19c18aa-5268-4e56-806f-32afb47481fc" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black z-50" data-magicpath-id="83" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="1b83ed56-f83c-4734-a631-ee820adac141" containerType="regular" prevTag="div" className="w-full h-full relative" data-magicpath-id="84" data-magicpath-path="MemorialWebsite.tsx">
              <AnimatePresence mode="wait" data-magicpath-id="85" data-magicpath-path="MemorialWebsite.tsx">
                <motion.img data-magicpath-motion-tag="motion.img" key={currentSlideIndex} src={photos[currentSlideIndex].url} alt={`Slide ${currentSlideIndex + 1}`} {...getTransitionVariants(transitionType)} transition={{
              duration: 0.8
            }} className="absolute inset-0 w-full h-full object-contain" data-magicpath-id="86" data-magicpath-path="MemorialWebsite.tsx" />
              </AnimatePresence>

              <SortableContainer dndKitId="877e95ec-ac7f-4cb4-aef9-2001f744e6ec" containerType="regular" prevTag="div" className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6" data-magicpath-id="87" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="d67e23d9-be3d-4c13-90bb-72aa91774ba9" containerType="regular" prevTag="div" className="flex items-center justify-between max-w-4xl mx-auto" data-magicpath-id="88" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="b0820c93-c444-40d0-bf5f-dccddfc1cc43" containerType="regular" prevTag="div" className="flex items-center gap-4" data-magicpath-id="89" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="6b9df3f8-4125-4647-ac26-06e028c2cb91" containerType="regular" prevTag="button" onClick={togglePlayPause} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="90" data-magicpath-path="MemorialWebsite.tsx">
                      {isPlaying ? <Pause className="w-8 h-8" data-magicpath-id="91" data-magicpath-path="MemorialWebsite.tsx" /> : <Play className="w-8 h-8" data-magicpath-id="92" data-magicpath-path="MemorialWebsite.tsx" />}
                    </SortableContainer>
                    <SortableContainer dndKitId="b352bd57-e84e-4192-a5ad-55d230504c40" containerType="regular" prevTag="button" onClick={prevSlide} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="93" data-magicpath-path="MemorialWebsite.tsx">
                      <ChevronLeft className="w-8 h-8" data-magicpath-id="94" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>
                    <span className="text-white font-medium" data-magicpath-id="95" data-magicpath-path="MemorialWebsite.tsx">
                      {currentSlideIndex + 1} / {photos.length}
                    </span>
                    <SortableContainer dndKitId="00fba808-5753-4e0a-97fc-f28418956027" containerType="regular" prevTag="button" onClick={nextSlide} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="96" data-magicpath-path="MemorialWebsite.tsx">
                      <ChevronRight className="w-8 h-8" data-magicpath-id="97" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>
                  </SortableContainer>
                  <SortableContainer dndKitId="d2084d10-2e88-4f81-a898-632386b6f6f2" containerType="regular" prevTag="button" onClick={exitFullscreen} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="98" data-magicpath-path="MemorialWebsite.tsx">
                    <Minimize2 className="w-8 h-8" data-magicpath-id="99" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>

      <AnimatePresence data-magicpath-id="100" data-magicpath-path="MemorialWebsite.tsx">
        {showConfigModal && <SortableContainer dndKitId="4a529ff5-e931-40b4-87f8-3b84eaed7cba" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => {
        setShowConfigModal(false);
        setConfigPassword('');
        setConfigError('');
      }} data-magicpath-id="101" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="c27bef4b-4ba5-4a2d-a98f-9e7de256eedb" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-magicpath-id="102" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="c570af3a-6a41-499a-9b2f-40e71ebdecfc" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="103" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="4380cbf3-ded6-466c-bbda-0a13a79c2017" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="104" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="105" data-magicpath-path="MemorialWebsite.tsx">Configuration</h2>
                  <SortableContainer dndKitId="90317760-0fa1-4270-bddd-6a44adcf78c0" containerType="regular" prevTag="button" onClick={() => {
                setShowConfigModal(false);
                setConfigPassword('');
                setConfigError('');
              }} className="text-gray-400 hover:text-gray-600" data-magicpath-id="106" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="107" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                {configPassword === '' ? <SortableContainer dndKitId="5ac02009-c5ad-46b2-9c3e-aa7fc561774a" containerType="regular" prevTag="div" className="space-y-4" data-magicpath-id="108" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="cfbe0b60-0503-4f65-aadb-aa4279c7ce52" containerType="regular" prevTag="div" data-magicpath-id="109" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="110" data-magicpath-path="MemorialWebsite.tsx">
                        Enter Configuration Password
                      </label>
                      <input type="password" value={configPassword} onChange={e => setConfigPassword(e.target.value)} onKeyDown={e => {
                  if (e.key === 'Enter' && configPassword === config.configPassword) {
                    setConfigError('');
                  }
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter password" autoFocus data-magicpath-id="111" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    {configError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-magicpath-id="112" data-magicpath-path="MemorialWebsite.tsx">
                        {configError}
                      </div>}

                    <button onClick={() => {
                if (configPassword !== config.configPassword) {
                  setConfigError('Incorrect password');
                } else {
                  setConfigError('');
                }
              }} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="113" data-magicpath-path="MemorialWebsite.tsx">
                      Unlock
                    </button>
                  </SortableContainer> : configPassword !== config.configPassword ? <div className="text-center text-red-600" data-magicpath-id="114" data-magicpath-path="MemorialWebsite.tsx">
                    Incorrect password
                  </div> : <SortableContainer dndKitId="832721ee-6dc1-4495-92a3-fb8328ddb364" containerType="regular" prevTag="div" className="space-y-6" data-magicpath-id="115" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="0b3612ee-a467-43ff-8680-6ecce925195b" containerType="regular" prevTag="div" data-magicpath-id="116" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="117" data-magicpath-path="MemorialWebsite.tsx">
                        Heading Text
                      </label>
                      <input type="text" value={editingConfig.heading} onChange={e => setEditingConfig({
                  ...editingConfig,
                  heading: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="118" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    <SortableContainer dndKitId="ec21fc5a-46c6-4aba-b151-6fa8104688c2" containerType="regular" prevTag="div" data-magicpath-id="119" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="120" data-magicpath-path="MemorialWebsite.tsx">
                        Feature Picture URL
                      </label>
                      <input type="url" value={editingConfig.featurePictureUrl} onChange={e => setEditingConfig({
                  ...editingConfig,
                  featurePictureUrl: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="121" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    <SortableContainer dndKitId="7a2ccb9c-4c2c-4c0b-bd8c-ce5ed1ed5c42" containerType="regular" prevTag="div" data-magicpath-id="122" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="123" data-magicpath-path="MemorialWebsite.tsx">
                        New Configuration Password
                      </label>
                      <input type="password" value={editingConfig.configPassword} onChange={e => setEditingConfig({
                  ...editingConfig,
                  configPassword: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="124" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    <SortableContainer dndKitId="530830db-4475-45d4-a436-959b4dcd1791" containerType="regular" prevTag="div" className="space-y-3" data-magicpath-id="125" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="flex items-center gap-2" data-magicpath-id="126" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.requireUploadPassword} onChange={e => setEditingConfig({
                    ...editingConfig,
                    requireUploadPassword: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="127" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="128" data-magicpath-path="MemorialWebsite.tsx">Require password for uploads</span>
                      </label>

                      {editingConfig.requireUploadPassword && <input type="password" value={editingConfig.uploadPassword} onChange={e => setEditingConfig({
                  ...editingConfig,
                  uploadPassword: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Upload password" data-magicpath-id="129" data-magicpath-path="MemorialWebsite.tsx" />}

                      <label className="flex items-center gap-2" data-magicpath-id="130" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.disableSlideshow} onChange={e => setEditingConfig({
                    ...editingConfig,
                    disableSlideshow: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="131" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="132" data-magicpath-path="MemorialWebsite.tsx">Disable slideshow button</span>
                      </label>

                      <label className="flex items-center gap-2" data-magicpath-id="133" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.disableUpload} onChange={e => setEditingConfig({
                    ...editingConfig,
                    disableUpload: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="134" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="135" data-magicpath-path="MemorialWebsite.tsx">Disable upload button</span>
                      </label>

                      <label className="flex items-center gap-2" data-magicpath-id="136" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.uploaderNameMandatory} onChange={e => setEditingConfig({
                    ...editingConfig,
                    uploaderNameMandatory: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="137" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="138" data-magicpath-path="MemorialWebsite.tsx">Uploader name mandatory</span>
                      </label>
                    </SortableContainer>

                    <button onClick={handleConfigSubmit} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="139" data-magicpath-path="MemorialWebsite.tsx">
                      Save Configuration
                    </button>
                  </SortableContainer>}
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>
    </SortableContainer>;
};