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
  const [photos, setPhotos] = React.useState<Photo[]>(() => {
    const stored = getStoredPhotos();
    // Add demo photos on first load if no photos exist
    if (stored.length === 0) {
      return [{
        id: 'demo-1',
        url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop',
        uploaderName: 'Family Member',
        timestamp: Date.now(),
        mpid: "5f7b3007-3792-42a5-a603-62a21dfb0d8c"
      }, {
        id: 'demo-2',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
        uploaderName: 'Friend',
        timestamp: Date.now(),
        mpid: "319853e1-4d28-4ebc-97a0-0e16a5b1c0e4"
      }, {
        id: 'demo-3',
        url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&auto=format&fit=crop',
        uploaderName: 'Relative',
        timestamp: Date.now(),
        mpid: "66cb2aaf-f49f-46f6-a935-1fa458ace77d"
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
  return <SortableContainer dndKitId="83a0d873-ecc9-4e1e-8e5f-93c23161de3f" containerType="regular" prevTag="div" className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" data-magicpath-id="0" data-magicpath-path="MemorialWebsite.tsx">
      <SortableContainer dndKitId="702145cc-7918-40d7-ba6e-87ee7b4f0238" containerType="regular" prevTag="div" className="w-full" data-magicpath-id="1" data-magicpath-path="MemorialWebsite.tsx">
        <SortableContainer dndKitId="4dd2fce9-5bbe-47e6-9467-4fd920bdbf4b" containerType="regular" prevTag="motion.div" initial={{
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
          <SortableContainer dndKitId="77345ebc-fcc1-4890-8dcd-fe9009231375" containerType="regular" prevTag="div" className="absolute inset-0 flex items-center justify-center" data-magicpath-id="5" data-magicpath-path="MemorialWebsite.tsx">
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

        <SortableContainer dndKitId="b82428bb-fe5d-44ca-9538-2ee8f914ae07" containerType="regular" prevTag="div" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-magicpath-id="7" data-magicpath-path="MemorialWebsite.tsx">
          <SortableContainer dndKitId="d0acf922-81e1-488f-8511-94138c3dd9cc" containerType="regular" prevTag="div" className="flex flex-col sm:flex-row gap-4 mb-8 justify-center" data-magicpath-id="8" data-magicpath-path="MemorialWebsite.tsx">
            {!config.disableUpload && <SortableContainer dndKitId="b63cb5de-5755-4926-8b5d-fbc9f7b24b1a" containerType="regular" prevTag="motion.button" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg" data-magicpath-id="9" data-magicpath-path="MemorialWebsite.tsx">
                <Upload className="w-5 h-5" data-magicpath-id="10" data-magicpath-path="MemorialWebsite.tsx" />
                Upload Photos
              </SortableContainer>}
            {!config.disableSlideshow && photos.length > 0 && <SortableContainer dndKitId="514ddf53-6adc-4b2f-ae56-7ab5c51ab814" containerType="regular" prevTag="motion.button" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => setShowSlideshowSettings(true)} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg" data-magicpath-id="11" data-magicpath-path="MemorialWebsite.tsx">
                <Play className="w-5 h-5" data-magicpath-id="12" data-magicpath-path="MemorialWebsite.tsx" />
                Start Slideshow
              </SortableContainer>}
            {!config.disableSlideshow && photos.length === 0 && <SortableContainer dndKitId="b4d8873b-8aa1-43ef-8ed9-8e208786ce38" containerType="regular" prevTag="motion.div" whileHover={{
            scale: 1.05
          }} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg opacity-50 cursor-not-allowed shadow-lg" data-magicpath-id="13" data-magicpath-path="MemorialWebsite.tsx">
                <Play className="w-5 h-5" data-magicpath-id="14" data-magicpath-path="MemorialWebsite.tsx" />
                Start Slideshow
              </SortableContainer>}
          </SortableContainer>

          {photos.length === 0 ? <SortableContainer dndKitId="2123adfb-5f1e-41c4-8da6-a40abb881dbd" containerType="regular" prevTag="motion.div" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="text-center py-20 text-gray-500" data-magicpath-id="15" data-magicpath-path="MemorialWebsite.tsx">
              <p className="text-lg" data-magicpath-id="16" data-magicpath-path="MemorialWebsite.tsx">No photos yet. Be the first to share a memory.</p>
            </SortableContainer> : <SortableContainer dndKitId="b3659e02-9470-4654-8bac-328514fa5987" containerType="collection" prevTag="div" className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4" data-magicpath-id="17" data-magicpath-path="MemorialWebsite.tsx">
              {photos.map((photo, index) => <motion.div data-magicpath-motion-tag="motion.div" key={photo.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.05
          }} className="break-inside-avoid" data-magicpath-uuid={(photo as any)["mpid"] ?? "unsafe"} data-magicpath-id="18" data-magicpath-path="MemorialWebsite.tsx">
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow" data-magicpath-uuid={(photo as any)["mpid"] ?? "unsafe"} data-magicpath-id="19" data-magicpath-path="MemorialWebsite.tsx">
                    <img src={photo.url} alt={`Memory ${index + 1}`} loading="lazy" className="w-full h-auto object-cover" data-magicpath-uuid={(photo as any)["mpid"] ?? "unsafe"} data-magicpath-field="url:unknown" data-magicpath-id="20" data-magicpath-path="MemorialWebsite.tsx" />
                    {photo.uploaderName && <div className="p-3 text-sm text-gray-600" data-magicpath-uuid={(photo as any)["mpid"] ?? "unsafe"} data-magicpath-field="uploaderName:unknown" data-magicpath-id="21" data-magicpath-path="MemorialWebsite.tsx">
                        Shared by {photo.uploaderName}
                      </div>}
                  </div>
                </motion.div>)}
            </SortableContainer>}
        </SortableContainer>

        <SortableContainer dndKitId="1c327cb5-1080-4622-a1b2-99c19e779c6e" containerType="regular" prevTag="footer" className="bg-gray-800 text-white py-6 mt-20" data-magicpath-id="22" data-magicpath-path="MemorialWebsite.tsx">
          <SortableContainer dndKitId="a8aee81d-aa2c-41a2-82a9-090bec637db2" containerType="regular" prevTag="div" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center" data-magicpath-id="23" data-magicpath-path="MemorialWebsite.tsx">
            <p className="text-sm" data-magicpath-id="24" data-magicpath-path="MemorialWebsite.tsx">© {new Date().getFullYear()} Memorial Website</p>
            <SortableContainer dndKitId="1d00cbeb-ae24-45ec-88df-45e1e1b60a00" containerType="regular" prevTag="button" onClick={() => setShowConfigModal(true)} className="text-gray-400 hover:text-white transition-colors" aria-label="Settings" data-magicpath-id="25" data-magicpath-path="MemorialWebsite.tsx">
              <Settings className="w-6 h-6" data-magicpath-id="26" data-magicpath-path="MemorialWebsite.tsx" />
            </SortableContainer>
          </SortableContainer>
        </SortableContainer>
      </SortableContainer>

      <AnimatePresence data-magicpath-id="27" data-magicpath-path="MemorialWebsite.tsx">
        {showUploadModal && <SortableContainer dndKitId="26b3dbe2-beb6-4cd9-8b3c-0c8f1ee32f5b" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)} data-magicpath-id="28" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="2ad0bcb6-8c61-4ef6-9f2a-d0863c153ffa" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" data-magicpath-id="29" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="d6acb15f-7f98-48b4-beb8-9d31760cea92" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="30" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="57bc0ac5-ca0a-4337-82f0-c4f34f53f042" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="31" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="32" data-magicpath-path="MemorialWebsite.tsx">Upload Photos</h2>
                  <SortableContainer dndKitId="cdeaa003-33ed-44e3-a0a4-6df6e1b871db" containerType="regular" prevTag="button" onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600" data-magicpath-id="33" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="34" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                <SortableContainer dndKitId="89578063-b573-4ad0-a52e-21fdb7944420" containerType="regular" prevTag="div" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} data-magicpath-id="35" data-magicpath-path="MemorialWebsite.tsx">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" data-magicpath-id="36" data-magicpath-path="MemorialWebsite.tsx" />
                  <p className="text-gray-600 mb-2" data-magicpath-id="37" data-magicpath-path="MemorialWebsite.tsx">Drag and drop images here</p>
                  <p className="text-sm text-gray-500 mb-4" data-magicpath-id="38" data-magicpath-path="MemorialWebsite.tsx">or</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="39" data-magicpath-path="MemorialWebsite.tsx">
                    Browse Files
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" data-magicpath-id="40" data-magicpath-path="MemorialWebsite.tsx" />
                </SortableContainer>

                {uploadFiles.length > 0 && <SortableContainer dndKitId="0b49813d-8081-4662-ac87-1a9346fc706c" containerType="regular" prevTag="div" className="mb-4" data-magicpath-id="41" data-magicpath-path="MemorialWebsite.tsx">
                    <p className="text-sm text-gray-600 mb-2" data-magicpath-id="42" data-magicpath-path="MemorialWebsite.tsx">
                      {uploadFiles.length} file(s) selected
                    </p>
                    <SortableContainer dndKitId="68284114-f544-4bf5-ade1-e2e77568ddb0" containerType="collection" prevTag="div" className="space-y-2" data-magicpath-id="43" data-magicpath-path="MemorialWebsite.tsx">
                      {uploadFiles.map((file, i) => <div key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="44" data-magicpath-path="MemorialWebsite.tsx">
                          <span className="truncate" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-field="name:unknown" data-magicpath-id="45" data-magicpath-path="MemorialWebsite.tsx">{file.name}</span>
                          <button onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="46" data-magicpath-path="MemorialWebsite.tsx">
                            <X className="w-4 h-4" data-magicpath-uuid={(file as any)["mpid"] ?? "unsafe"} data-magicpath-id="47" data-magicpath-path="MemorialWebsite.tsx" />
                          </button>
                        </div>)}
                    </SortableContainer>
                  </SortableContainer>}

                <SortableContainer dndKitId="ac38ce04-9e1b-4a7b-811f-7a0517bd59c3" containerType="regular" prevTag="div" className="space-y-4 mb-4" data-magicpath-id="48" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="05afa068-a23a-44fc-9691-96592179336b" containerType="regular" prevTag="div" data-magicpath-id="49" data-magicpath-path="MemorialWebsite.tsx">
                    <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="50" data-magicpath-path="MemorialWebsite.tsx">
                      Your Name {config.uploaderNameMandatory && <span className="text-red-500" data-magicpath-id="51" data-magicpath-path="MemorialWebsite.tsx">*</span>}
                    </label>
                    <input type="text" value={uploaderName} onChange={e => setUploaderName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your name" data-magicpath-id="52" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>

                  {config.requireUploadPassword && <SortableContainer dndKitId="9a8054c7-fec3-463a-ae8b-13697c4e55f1" containerType="regular" prevTag="div" data-magicpath-id="53" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="54" data-magicpath-path="MemorialWebsite.tsx">
                        Upload Password *
                      </label>
                      <input type="password" value={uploadPassword} onChange={e => setUploadPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter upload password" data-magicpath-id="55" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>}
                </SortableContainer>

                {uploadError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-magicpath-id="56" data-magicpath-path="MemorialWebsite.tsx">
                    {uploadError}
                  </div>}

                <button onClick={handleUploadSubmit} disabled={uploading} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors" data-magicpath-id="57" data-magicpath-path="MemorialWebsite.tsx">
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </button>
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>

      <AnimatePresence data-magicpath-id="58" data-magicpath-path="MemorialWebsite.tsx">
        {showSlideshowSettings && <SortableContainer dndKitId="908c0a04-d7b4-4fad-b1f2-a9ea1c5c4ee1" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowSlideshowSettings(false)} data-magicpath-id="59" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="910c70bb-32dc-4b44-a27c-baf823b0cdba" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-md w-full" data-magicpath-id="60" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="553d59f0-7f02-4fa0-8f99-48d7d33d239c" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="61" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="8b9b929d-04be-4ad6-9def-1cdee9884d2e" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="62" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="63" data-magicpath-path="MemorialWebsite.tsx">Slideshow Settings</h2>
                  <SortableContainer dndKitId="a8678fb6-9522-4992-beae-8e561246a76a" containerType="regular" prevTag="button" onClick={() => setShowSlideshowSettings(false)} className="text-gray-400 hover:text-gray-600" data-magicpath-id="64" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="65" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                <SortableContainer dndKitId="d3000f9e-a832-4d1c-8f56-27e110d00ce6" containerType="regular" prevTag="div" className="space-y-6" data-magicpath-id="66" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="065bf4fd-f5c0-4e32-b3e6-f8e7a7ea122a" containerType="regular" prevTag="div" data-magicpath-id="67" data-magicpath-path="MemorialWebsite.tsx">
                    <label className="block text-sm font-medium text-gray-700 mb-2" data-magicpath-id="68" data-magicpath-path="MemorialWebsite.tsx">
                      Speed: {slideshowSpeed}s per photo
                    </label>
                    <input type="range" min="2" max="15" value={slideshowSpeed} onChange={e => setSlideshowSpeed(Number(e.target.value))} className="w-full" data-magicpath-id="69" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>

                  <SortableContainer dndKitId="fa36c520-afc9-4128-9058-5482b5bbf091" containerType="regular" prevTag="div" data-magicpath-id="70" data-magicpath-path="MemorialWebsite.tsx">
                    <label className="block text-sm font-medium text-gray-700 mb-2" data-magicpath-id="71" data-magicpath-path="MemorialWebsite.tsx">
                      Transition Effect
                    </label>
                    <select value={transitionType} onChange={e => setTransitionType(e.target.value as TransitionType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="72" data-magicpath-path="MemorialWebsite.tsx">
                      <option value="fade" data-magicpath-id="73" data-magicpath-path="MemorialWebsite.tsx">Fade</option>
                      <option value="slide-left" data-magicpath-id="74" data-magicpath-path="MemorialWebsite.tsx">Slide Left</option>
                      <option value="slide-right" data-magicpath-id="75" data-magicpath-path="MemorialWebsite.tsx">Slide Right</option>
                      <option value="zoom-in" data-magicpath-id="76" data-magicpath-path="MemorialWebsite.tsx">Zoom In</option>
                      <option value="zoom-out" data-magicpath-id="77" data-magicpath-path="MemorialWebsite.tsx">Zoom Out</option>
                      <option value="flip" data-magicpath-id="78" data-magicpath-path="MemorialWebsite.tsx">Flip</option>
                      <option value="crossfade" data-magicpath-id="79" data-magicpath-path="MemorialWebsite.tsx">Crossfade</option>
                      <option value="ken-burns" data-magicpath-id="80" data-magicpath-path="MemorialWebsite.tsx">Ken Burns</option>
                      <option value="random" data-magicpath-id="81" data-magicpath-path="MemorialWebsite.tsx">Random</option>
                    </select>
                  </SortableContainer>

                  <SortableContainer dndKitId="6ced6b29-4570-4554-a6e5-68a525114f2c" containerType="regular" prevTag="button" onClick={startSlideshow} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2" data-magicpath-id="82" data-magicpath-path="MemorialWebsite.tsx">
                    <Play className="w-5 h-5" data-magicpath-id="83" data-magicpath-path="MemorialWebsite.tsx" />
                    Start Slideshow
                  </SortableContainer>
                </SortableContainer>
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>

      <AnimatePresence data-magicpath-id="84" data-magicpath-path="MemorialWebsite.tsx">
        {showFullscreenSlideshow && <SortableContainer dndKitId="cc4434a9-4d5c-451e-8862-b22ed90da81f" containerType="regular" prevTag="motion.div" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-black z-50" data-magicpath-id="85" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="e1aafb8f-6922-4619-9c1b-862b4baabbe4" containerType="regular" prevTag="div" className="w-full h-full relative" data-magicpath-id="86" data-magicpath-path="MemorialWebsite.tsx">
              <AnimatePresence mode="wait" data-magicpath-id="87" data-magicpath-path="MemorialWebsite.tsx">
                <motion.img data-magicpath-motion-tag="motion.img" key={currentSlideIndex} src={photos[currentSlideIndex].url} alt={`Slide ${currentSlideIndex + 1}`} {...getTransitionVariants(transitionType)} transition={{
              duration: 0.8
            }} className="absolute inset-0 w-full h-full object-contain" data-magicpath-id="88" data-magicpath-path="MemorialWebsite.tsx" />
              </AnimatePresence>

              <SortableContainer dndKitId="e4a35d5a-b462-44fa-a6d5-df7c4ce4324f" containerType="regular" prevTag="div" className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6" data-magicpath-id="89" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="03e32acc-b2fa-4203-bf6c-3b636270cadf" containerType="regular" prevTag="div" className="flex items-center justify-between max-w-4xl mx-auto" data-magicpath-id="90" data-magicpath-path="MemorialWebsite.tsx">
                  <SortableContainer dndKitId="7e888744-6d4e-41df-a041-8cfe1057252e" containerType="regular" prevTag="div" className="flex items-center gap-4" data-magicpath-id="91" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="b847bfa8-b300-4e02-9dba-bfddc076a483" containerType="regular" prevTag="button" onClick={togglePlayPause} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="92" data-magicpath-path="MemorialWebsite.tsx">
                      {isPlaying ? <Pause className="w-8 h-8" data-magicpath-id="93" data-magicpath-path="MemorialWebsite.tsx" /> : <Play className="w-8 h-8" data-magicpath-id="94" data-magicpath-path="MemorialWebsite.tsx" />}
                    </SortableContainer>
                    <SortableContainer dndKitId="79139939-6d9a-4fba-acb5-a481ec1d429f" containerType="regular" prevTag="button" onClick={prevSlide} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="95" data-magicpath-path="MemorialWebsite.tsx">
                      <ChevronLeft className="w-8 h-8" data-magicpath-id="96" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>
                    <span className="text-white font-medium" data-magicpath-id="97" data-magicpath-path="MemorialWebsite.tsx">
                      {currentSlideIndex + 1} / {photos.length}
                    </span>
                    <SortableContainer dndKitId="3bbb86a1-8da2-48cd-833c-b05f4e1edf73" containerType="regular" prevTag="button" onClick={nextSlide} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="98" data-magicpath-path="MemorialWebsite.tsx">
                      <ChevronRight className="w-8 h-8" data-magicpath-id="99" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>
                  </SortableContainer>
                  <SortableContainer dndKitId="91abff80-e9f3-4d4c-8803-d21ee1e52215" containerType="regular" prevTag="button" onClick={exitFullscreen} className="text-white hover:text-gray-300 transition-colors" data-magicpath-id="100" data-magicpath-path="MemorialWebsite.tsx">
                    <Minimize2 className="w-8 h-8" data-magicpath-id="101" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>

      <AnimatePresence data-magicpath-id="102" data-magicpath-path="MemorialWebsite.tsx">
        {showConfigModal && <SortableContainer dndKitId="ecc2d5c9-e575-49c4-bb23-8c8ae54e5b43" containerType="regular" prevTag="motion.div" initial={{
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
      }} data-magicpath-id="103" data-magicpath-path="MemorialWebsite.tsx">
            <SortableContainer dndKitId="c8759701-7ec6-488f-8332-502f64ed6f57" containerType="regular" prevTag="motion.div" initial={{
          scale: 0.9,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.9,
          opacity: 0
        }} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-magicpath-id="104" data-magicpath-path="MemorialWebsite.tsx">
              <SortableContainer dndKitId="87d089d4-2d96-48e2-ac46-350218ab4ad3" containerType="regular" prevTag="div" className="p-6" data-magicpath-id="105" data-magicpath-path="MemorialWebsite.tsx">
                <SortableContainer dndKitId="6f315c30-d9f5-43b6-869d-b60a83416341" containerType="regular" prevTag="div" className="flex justify-between items-center mb-6" data-magicpath-id="106" data-magicpath-path="MemorialWebsite.tsx">
                  <h2 className="text-2xl font-semibold text-gray-900" data-magicpath-id="107" data-magicpath-path="MemorialWebsite.tsx">Configuration</h2>
                  <SortableContainer dndKitId="0382d971-0791-4bca-b832-29e4a0fdc295" containerType="regular" prevTag="button" onClick={() => {
                setShowConfigModal(false);
                setConfigPassword('');
                setConfigError('');
                setIsConfigUnlocked(false);
              }} className="text-gray-400 hover:text-gray-600" data-magicpath-id="108" data-magicpath-path="MemorialWebsite.tsx">
                    <X className="w-6 h-6" data-magicpath-id="109" data-magicpath-path="MemorialWebsite.tsx" />
                  </SortableContainer>
                </SortableContainer>

                {!isConfigUnlocked ? <SortableContainer dndKitId="f4a2a013-9d73-429d-b81c-681cdf8418e2" containerType="regular" prevTag="div" className="space-y-4" data-magicpath-id="110" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="267d170d-addd-4f9d-9093-906242cd529f" containerType="regular" prevTag="div" data-magicpath-id="111" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="112" data-magicpath-path="MemorialWebsite.tsx">
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
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter password" autoFocus data-magicpath-id="113" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    {configError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-magicpath-id="114" data-magicpath-path="MemorialWebsite.tsx">
                        {configError}
                      </div>}

                    <button onClick={() => {
                if (configPassword === config.configPassword) {
                  setIsConfigUnlocked(true);
                  setConfigError('');
                } else {
                  setConfigError('Incorrect password');
                }
              }} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="115" data-magicpath-path="MemorialWebsite.tsx">
                      Unlock
                    </button>
                  </SortableContainer> : <SortableContainer dndKitId="c6547e3a-42fc-46d9-bf71-b06d3c42801f" containerType="regular" prevTag="div" className="space-y-6" data-magicpath-id="116" data-magicpath-path="MemorialWebsite.tsx">
                    <SortableContainer dndKitId="384795c0-60c3-4987-82d3-8670162a30f9" containerType="regular" prevTag="div" data-magicpath-id="117" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="118" data-magicpath-path="MemorialWebsite.tsx">
                        Heading Text
                      </label>
                      <input type="text" value={editingConfig.heading} onChange={e => setEditingConfig({
                  ...editingConfig,
                  heading: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="119" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    <SortableContainer dndKitId="c982e5c3-bdcf-41cc-ad43-f232b39cad0d" containerType="regular" prevTag="div" data-magicpath-id="120" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-2" data-magicpath-id="121" data-magicpath-path="MemorialWebsite.tsx">
                        Feature Picture
                      </label>
                      <SortableContainer dndKitId="7011de22-b943-43f1-8995-3060929e80db" containerType="regular" prevTag="div" className="mb-3 space-y-3" data-magicpath-id="122" data-magicpath-path="MemorialWebsite.tsx">
                        <SortableContainer dndKitId="156455b8-aab5-4b8e-a23a-9ebc630fd75a" containerType="regular" prevTag="div" data-magicpath-id="123" data-magicpath-path="MemorialWebsite.tsx">
                          <label className="block text-xs text-gray-600 mb-1" data-magicpath-id="124" data-magicpath-path="MemorialWebsite.tsx">Enter URL or Upload Image</label>
                          <input type="url" value={editingConfig.featurePictureUrl} onChange={e => setEditingConfig({
                      ...editingConfig,
                      featurePictureUrl: e.target.value
                    })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://example.com/image.jpg" data-magicpath-id="125" data-magicpath-path="MemorialWebsite.tsx" />
                        </SortableContainer>
                        <SortableContainer dndKitId="b28e531e-1876-4587-a15a-7c7a17494faf" containerType="regular" prevTag="div" className="flex gap-2" data-magicpath-id="126" data-magicpath-path="MemorialWebsite.tsx">
                          <button onClick={() => featureImageInputRef.current?.click()} className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium" data-magicpath-id="127" data-magicpath-path="MemorialWebsite.tsx">
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
                    }} className="hidden" data-magicpath-id="128" data-magicpath-path="MemorialWebsite.tsx" />
                        </SortableContainer>
                      </SortableContainer>
                      {editingConfig.featurePictureUrl && <SortableContainer dndKitId="9ef9f86b-8ac8-40ac-bdc7-bbfe4881995c" containerType="regular" prevTag="div" className="rounded-lg overflow-hidden border border-gray-300 h-32" data-magicpath-id="129" data-magicpath-path="MemorialWebsite.tsx">
                          <img src={editingConfig.featurePictureUrl} alt="Feature preview" className="w-full h-full object-cover" data-magicpath-id="130" data-magicpath-path="MemorialWebsite.tsx" />
                        </SortableContainer>}
                    </SortableContainer>

                    <SortableContainer dndKitId="c7d85aa1-c182-4f07-9417-54a5cf0c2396" containerType="regular" prevTag="div" data-magicpath-id="131" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="block text-sm font-medium text-gray-700 mb-1" data-magicpath-id="132" data-magicpath-path="MemorialWebsite.tsx">
                        New Configuration Password
                      </label>
                      <input type="password" value={editingConfig.configPassword} onChange={e => setEditingConfig({
                  ...editingConfig,
                  configPassword: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" data-magicpath-id="133" data-magicpath-path="MemorialWebsite.tsx" />
                    </SortableContainer>

                    <SortableContainer dndKitId="be140766-5f51-494f-978c-79e164ec03a5" containerType="regular" prevTag="div" className="space-y-3" data-magicpath-id="134" data-magicpath-path="MemorialWebsite.tsx">
                      <label className="flex items-center gap-2" data-magicpath-id="135" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.requireUploadPassword} onChange={e => setEditingConfig({
                    ...editingConfig,
                    requireUploadPassword: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="136" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="137" data-magicpath-path="MemorialWebsite.tsx">Require password for uploads</span>
                      </label>

                      {editingConfig.requireUploadPassword && <input type="password" value={editingConfig.uploadPassword} onChange={e => setEditingConfig({
                  ...editingConfig,
                  uploadPassword: e.target.value
                })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Upload password" data-magicpath-id="138" data-magicpath-path="MemorialWebsite.tsx" />}

                      <label className="flex items-center gap-2" data-magicpath-id="139" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.disableSlideshow} onChange={e => setEditingConfig({
                    ...editingConfig,
                    disableSlideshow: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="140" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="141" data-magicpath-path="MemorialWebsite.tsx">Disable slideshow button</span>
                      </label>

                      <label className="flex items-center gap-2" data-magicpath-id="142" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.disableUpload} onChange={e => setEditingConfig({
                    ...editingConfig,
                    disableUpload: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="143" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="144" data-magicpath-path="MemorialWebsite.tsx">Disable upload button</span>
                      </label>

                      <label className="flex items-center gap-2" data-magicpath-id="145" data-magicpath-path="MemorialWebsite.tsx">
                        <input type="checkbox" checked={editingConfig.uploaderNameMandatory} onChange={e => setEditingConfig({
                    ...editingConfig,
                    uploaderNameMandatory: e.target.checked
                  })} className="w-4 h-4 text-blue-600 rounded" data-magicpath-id="146" data-magicpath-path="MemorialWebsite.tsx" />
                        <span className="text-sm text-gray-700" data-magicpath-id="147" data-magicpath-path="MemorialWebsite.tsx">Uploader name mandatory</span>
                      </label>
                    </SortableContainer>

                    <button onClick={handleConfigSubmit} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-magicpath-id="148" data-magicpath-path="MemorialWebsite.tsx">
                      Save Configuration
                    </button>
                  </SortableContainer>}
              </SortableContainer>
            </SortableContainer>
          </SortableContainer>}
      </AnimatePresence>
    </SortableContainer>;
};