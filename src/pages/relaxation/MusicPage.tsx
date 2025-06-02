import { useState, useRef, useEffect } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, Upload, X, Music } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllMusicTracks, getDefaultTracks, uploadUserMusicTrack, deleteUserMusicTrack } from '../../services/musicService';

interface Track {
  id: string;
  title: string;
  category?: string;
  artist?: string;
  duration?: string;
  source: string;
  isBuiltIn: boolean;
  userId?: string;
}

const MusicPage = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize audio element with better error handling
  useEffect(() => {
    const initializeAudio = () => {
      // Clean up existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.load();
      }
      
      const audio = new Audio();
      audio.preload = 'none'; // Don't preload to avoid errors
      audio.volume = volume;
      audio.crossOrigin = 'anonymous';
      
      // Mobile-specific attributes
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      audioRef.current = audio;
      setAudioInitialized(true);
      console.log("Audio element initialized successfully");
    };
    
    initializeAudio();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setAudioInitialized(false);
    };
  }, [volume]);

  // Load tracks on component mount
  useEffect(() => {
    const fetchTracks = async () => {
      setLoadingTracks(true);
      try {
        console.log('Loading music tracks...');
        
        const defaultTracks = getDefaultTracks();
        const formattedTracks: Track[] = defaultTracks.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          category: 'Relaxation',
          source: track.filePath,
          isBuiltIn: true,
          duration: track.duration || '3:45'
        }));
        
        console.log("Loaded tracks:", formattedTracks);
        setTracks(formattedTracks);
      } catch (error) {
        console.error('Error loading music tracks:', error);
        toast({
          title: "Error",
          description: "Could not load music tracks.",
          variant: "destructive",
        });
      } finally {
        setLoadingTracks(false);
      }
    };
    
    fetchTracks();
  }, [toast]);

  // Set up audio event listeners after initialization
  useEffect(() => {
    if (!audioInitialized || !audioRef.current) return;
    
    const audio = audioRef.current;

    const updateProgress = () => {
      if (!audio || !audio.duration || isNaN(audio.duration)) return;
      
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      setProgress(progressPercent);
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (!audio || isNaN(audio.duration)) return;
      setDuration(audio.duration);
      setIsLoading(false);
      console.log("Audio metadata loaded, duration:", audio.duration);
    };

    const handleCanPlay = () => {
      setError(null);
      setIsLoading(false);
      console.log("Audio can play");
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
      console.log("Audio loading started");
    };

    const handleAudioError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const errorCode = target.error?.code;
      let errorMessage = "Audio playback error";
      
      switch (errorCode) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = "Audio loading was aborted";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = "Network error while loading audio";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = "Audio format not supported";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = "Audio source not supported";
          break;
      }
      
      console.error('Audio error:', errorMessage, errorCode);
      setIsPlaying(false);
      setIsLoading(false);
      setError(errorMessage);
      
      toast({
        title: "Playback Error",
        description: `${errorMessage}. Trying next track...`,
        variant: "destructive",
      });
      
      // Auto-skip to next track after error
      setTimeout(() => {
        if (tracks.length > 1) {
          nextTrack();
        }
      }, 2000);
    };

    const handleAudioEnded = () => {
      console.log("Audio ended, playing next track");
      nextTrack();
    };

    // Remove existing listeners
    audio.removeEventListener('timeupdate', updateProgress);
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.removeEventListener('canplay', handleCanPlay);
    audio.removeEventListener('loadstart', handleLoadStart);
    audio.removeEventListener('error', handleAudioError);
    audio.removeEventListener('ended', handleAudioEnded);

    // Add new listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('ended', handleAudioEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleAudioError);
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, [audioInitialized, toast, tracks.length]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const formatTime = (time: number): string => {
    if (isNaN(time) || time < 0) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  const playTrack = async (index: number) => {
    if (!audioInitialized || !audioRef.current || !tracks[index]) {
      console.error("Cannot play track: audio not initialized or track not found");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const track = tracks[index];
      console.log(`Loading track: ${track.title} - ${track.source}`);
      
      // Stop current playback
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      
      // Update current track
      setCurrentTrackIndex(index);
      
      // Set new source and load
      audioRef.current.src = track.source;
      audioRef.current.load();
      
      // Try to play after a short delay
      const playPromise = new Promise<void>((resolve, reject) => {
        const attemptPlay = async () => {
          try {
            if (!audioRef.current) {
              reject(new Error("Audio element not available"));
              return;
            }
            
            await audioRef.current.play();
            setIsPlaying(true);
            setIsLoading(false);
            console.log(`Successfully playing: ${track.title}`);
            resolve();
          } catch (error) {
            console.error('Play attempt failed:', error);
            setIsPlaying(false);
            setIsLoading(false);
            
            if (error instanceof Error) {
              if (error.name === "NotAllowedError") {
                setError("Click play again to enable audio");
                toast({
                  title: "Audio Permission",
                  description: "Click the play button again to enable audio",
                });
              } else {
                setError(`Playback failed: ${error.message}`);
              }
            }
            reject(error);
          }
        };
        
        // Small delay to ensure audio is ready
        setTimeout(attemptPlay, 100);
      });
      
      await playPromise;
      
    } catch (error) {
      console.error("Error in playTrack:", error);
      setIsLoading(false);
      setError("Failed to play track");
      
      // Try next track if this one fails
      setTimeout(() => {
        if (tracks.length > 1) {
          nextTrack();
        }
      }, 1500);
    }
  };

  const togglePlayPause = async () => {
    if (!audioInitialized || !audioRef.current) {
      console.error("Audio not initialized");
      return;
    }
    
    // If no track selected, play first track
    if (currentTrackIndex === -1 && tracks.length > 0) {
      await playTrack(0);
      return;
    }
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        console.log("Audio paused");
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        setError(null);
        console.log("Audio resumed");
      }
    } catch (error) {
      console.error('Toggle play/pause error:', error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        setError("Click again to enable audio");
        toast({
          title: "Audio Permission",
          description: "Click again to enable audio playback",
        });
      }
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    const newIndex = currentTrackIndex >= tracks.length - 1 ? 0 : currentTrackIndex + 1;
    playTrack(newIndex);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const newIndex = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
    playTrack(newIndex);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || isNaN(duration)) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = duration * pos;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleUpload = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to upload your own tracks.",
        variant: "destructive",
      });
      return;
    }
    
    setShowUploadForm(true);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if file is audio
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an audio file (MP3, WAV, OGG, M4A, AAC).",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Check file size (15MB limit)
      if (file.size > 15 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 15MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Set default title from filename if not set
      if (!uploadTitle) {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setUploadTitle(fileName);
      }
      
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  };
  
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to upload tracks.",
        variant: "destructive",
      });
      return;
    }
    
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
      toast({
        title: "No File Selected",
        description: "Please select an audio file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!uploadTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your track.",
        variant: "destructive",
      });
      return;
    }
    
    const file = fileInputRef.current.files[0];
    
    setIsUploading(true);
    try {
      console.log('Starting upload for:', uploadTitle);
      
      await uploadUserMusicTrack(user.id, uploadTitle.trim(), file);
      
      toast({
        title: "Upload Successful",
        description: "Your track has been uploaded successfully.",
      });
      
      // Refresh tracks list
      const musicTracks = await getAllMusicTracks();
      const formattedTracks: Track[] = musicTracks.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        category: track.isBuiltIn ? 'Built-in' : 'My Uploads',
        source: track.filePath,
        isBuiltIn: track.isBuiltIn,
        userId: track.userId,
        duration: track.duration || '3:45'
      }));
      
      setTracks(formattedTracks);
      setShowUploadForm(false);
      setUploadTitle('');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('Upload completed successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteTrack = async (trackId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to delete tracks.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await deleteUserMusicTrack(trackId, user.id);
      
      toast({
        title: "Track Deleted",
        description: "Your track has been deleted successfully.",
      });
      
      // Remove from local state
      setTracks(prev => prev.filter(track => track.id !== trackId));
      
      // If current track was deleted, stop playback
      if (currentTrackIndex >= 0 && tracks[currentTrackIndex]?.id === trackId) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setIsPlaying(false);
        setCurrentTrackIndex(-1);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  return (
    <MobileLayout title="Relaxation Music">
      <div className="p-4 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-mindboost-dark mb-1">Relaxation Music</h1>
          <p className="text-gray-500">
            Listen to calming sounds to reduce stress and improve focus
          </p>
        </div>
        
        {/* Current track player */}
        <div className="bg-mindboost-primary text-white rounded-xl p-4 mb-6 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold">
                {currentTrackIndex >= 0 && tracks[currentTrackIndex]
                  ? tracks[currentTrackIndex].title 
                  : 'Select a track'}
              </h3>
              <p className="text-sm opacity-80">
                {currentTrackIndex >= 0 && tracks[currentTrackIndex]
                  ? tracks[currentTrackIndex].artist || 'Relaxation music'
                  : 'Choose from available tracks'}
              </p>
              {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
              {isLoading && <p className="text-xs text-blue-300 mt-1">Loading audio...</p>}
            </div>
            <div className="flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20"
                aria-label="Volume control"
              />
            </div>
          </div>
          
          {/* Time display */}
          <div className="flex justify-between text-xs mb-1 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Progress bar */}
          <div 
            className="w-full bg-white bg-opacity-20 h-2 rounded-full mb-4 cursor-pointer"
            onClick={handleProgressClick}
            aria-label="Track progress"
          >
            <div 
              className="bg-white h-full rounded-full relative transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            >
              {progress > 0 && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-3 h-3 shadow-md"></div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center items-center space-x-8">
            <button 
              onClick={prevTrack} 
              className="focus:outline-none hover:opacity-80 transition-opacity disabled:opacity-50"
              disabled={tracks.length === 0 || isLoading}
              aria-label="Previous track"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={togglePlayPause}
              className="bg-white text-mindboost-primary rounded-full w-12 h-12 flex items-center justify-center focus:outline-none hover:bg-opacity-90 transition-colors shadow-md disabled:opacity-50"
              disabled={tracks.length === 0}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-mindboost-primary border-t-transparent rounded-full animate-spin"></div>
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>
            <button 
              onClick={nextTrack} 
              className="focus:outline-none hover:opacity-80 transition-opacity disabled:opacity-50"
              disabled={tracks.length === 0 || isLoading}
              aria-label="Next track"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
          
          {/* Sound wave animation when playing */}
          {isPlaying && !isLoading && (
            <div className="flex justify-center items-end h-6 gap-[2px] mt-3">
              {[...Array(16)].map((_, i) => {
                const height = Math.random() * 16 + 4;
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 4 }}
                    animate={{ 
                      height: [4, height, 4],
                      transition: { 
                        repeat: Infinity, 
                        duration: 1 + Math.random() * 0.5,
                        repeatType: 'reverse'
                      }
                    }}
                    className="bg-white w-1 rounded-full"
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {/* Upload form */}
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-4 mb-6"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Upload New Track</h3>
              <button 
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadTitle('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-gray-500 focus:outline-none"
                aria-label="Close upload form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitUpload}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Track Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter track title"
                  required
                  maxLength={100}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audio File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: MP3, WAV, OGG, M4A, AAC (Max 15MB)
                </p>
              </div>
              
              <button
                type="submit"
                className="w-full bg-mindboost-primary text-white py-2 rounded-md hover:bg-mindboost-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading || !uploadTitle.trim()}
              >
                {isUploading ? 'Uploading...' : 'Upload Track'}
              </button>
            </form>
          </motion.div>
        )}
        
        {/* Track list section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-mindboost-dark flex items-center">
              <Music className="w-5 h-5 mr-2 text-mindboost-primary" />
              Available Tracks
            </h2>
            <button 
              onClick={handleUpload}
              className="flex items-center text-sm text-mindboost-primary hover:text-mindboost-primary/80 transition-colors"
              aria-label="Upload new track"
            >
              <Upload className="w-4 h-4 mr-1" /> Upload
            </button>
          </div>
          
          {/* Track loading state */}
          {loadingTracks ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindboost-primary mx-auto mb-2"></div>
              <p className="text-gray-500">Loading tracks...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                  <Music className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No tracks available. Try uploading one!</p>
                </div>
              ) : (
                tracks.map((track, index) => (
                  <motion.div
                    key={track.id}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-lg flex justify-between items-center cursor-pointer shadow-sm transition-colors ${
                      currentTrackIndex === index
                        ? 'bg-mindboost-light text-mindboost-dark'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => playTrack(index)}
                  >
                    <div className="flex items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        currentTrackIndex === index
                          ? 'bg-mindboost-primary text-white'
                          : 'bg-gray-100'
                      }`}>
                        {currentTrackIndex === index && isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : currentTrackIndex === index && isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{track.title}</p>
                        <p className="text-xs text-gray-500">
                          {track.artist || 'Relaxation Music'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-3">{track.duration}</span>
                      
                      {/* Delete button for user uploads */}
                      {!track.isBuiltIn && track.userId === user?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrack(track.id);
                          }}
                          className="text-red-500 p-1 hover:bg-red-50 rounded-full transition-colors"
                          aria-label="Delete track"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Tips section */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2">Relaxation Music Benefits</h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li>• Reduces stress and anxiety levels</li>
            <li>• Enhances focus and concentration</li>
            <li>• Promotes better sleep quality</li>
            <li>• Lowers blood pressure and heart rate</li>
            <li>• Improves mood and emotional well-being</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MusicPage;
