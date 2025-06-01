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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Create and configure audio element on component mount
  useEffect(() => {
    const initializeAudio = () => {
      // Clean up any existing audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Create a new audio element
      const audio = new Audio();
      
      // Set basic properties for better compatibility
      audio.preload = 'metadata';
      audio.volume = volume;
      audio.crossOrigin = 'anonymous';
      
      // Mobile compatibility attributes
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      // Set audio element reference
      audioRef.current = audio;
      setAudioInitialized(true);
      
      console.log("Audio element initialized");
    };
    
    initializeAudio();
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch tracks from Supabase with fallback to default tracks
  useEffect(() => {
    const fetchTracks = async () => {
      setLoadingTracks(true);
      try {
        console.log('Loading relaxation music tracks...');
        
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
        
        console.log("Using relaxation tracks:", formattedTracks);
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

  // Set up audio element event listeners after it's initialized
  useEffect(() => {
    if (!audioInitialized || !audioRef.current) return;
    
    const audio = audioRef.current;

    const updateProgress = () => {
      if (!audio) return;
      
      const audioDuration = audio.duration;
      const audioCurrentTime = audio.currentTime;
      
      if (audioDuration > 0 && !isNaN(audioDuration)) {
        setProgress((audioCurrentTime / audioDuration) * 100);
        setCurrentTime(audioCurrentTime);
      }
    };

    const handleAudioEnded = () => {
      handleTrackEnd();
    };
    
    const handleLoadedMetadata = () => {
      if (!audio) return;
      setDuration(audio.duration);
      console.log("Audio loaded, duration:", audio.duration);
    };

    const handleAudioError = (e: Event) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      setError('Audio format not supported. Trying next track...');
      
      toast({
        title: "Playback Error",
        description: "Audio format not supported. Trying next track.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        nextTrack();
      }, 2000);
    };

    const handleCanPlay = () => {
      console.log('Audio can play');
      setError(null);
    };

    // Clean up any existing listeners first
    audio.removeEventListener('timeupdate', updateProgress);
    audio.removeEventListener('ended', handleAudioEnded);
    audio.removeEventListener('error', handleAudioError);
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.removeEventListener('canplay', handleCanPlay);

    // Add new listeners
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);

    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', handleAudioEnded);
        audio.removeEventListener('error', handleAudioError);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, [audioInitialized, toast]);

  // Update audio volume when volume state changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  // Format time from seconds to MM:SS
  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  const handleTrackEnd = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      playTrack(currentTrackIndex + 1);
    } else {
      setCurrentTrackIndex(0);
      playTrack(0);
    }
  };

  const playTrack = async (index: number) => {
    try {
      if (!audioInitialized || !audioRef.current) {
        console.error("Audio element not available");
        return;
      }
      
      // Stop current track if playing
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      setCurrentTrackIndex(index);
      setError(null);
      setIsPlaying(false);
      
      const track = tracks[index];
      console.log(`Attempting to play: ${track.title}, Source: ${track.source}`);
      
      // Reset the audio element
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Set new source
      audioRef.current.src = track.source;
      
      // Load the audio
      audioRef.current.load();
      
      // Wait for the audio to be ready and then play
      const playAudio = async () => {
        try {
          if (!audioRef.current) return;
          
          // Add a small delay to ensure audio is ready
          await new Promise(resolve => setTimeout(resolve, 200));
          
          await audioRef.current.play();
          console.log(`Successfully playing: ${track.title}`);
          setIsPlaying(true);
          setError(null);
        } catch (error) {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          
          if (error instanceof Error) {
            if (error.name === "NotAllowedError") {
              setError("Click play again to enable audio");
              toast({
                title: "Audio Permission",
                description: "Click the play button again to enable audio playback",
              });
            } else if (error.name === "NotSupportedError") {
              setError("This audio format is not supported");
              toast({
                title: "Unsupported Format",
                description: "This audio format is not supported by your browser",
                variant: "destructive",
              });
              setTimeout(() => nextTrack(), 2000);
            } else {
              setError(`Playback error: ${error.message}`);
              setTimeout(() => nextTrack(), 2000);
            }
          }
        }
      };

      // Try to play immediately
      await playAudio();
      
    } catch (e) {
      console.error("Error in playTrack:", e);
      setError(`Track error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setTimeout(() => nextTrack(), 2000);
    }
  };

  const togglePlayPause = async () => {
    if (!audioInitialized || !audioRef.current) {
      console.error("Audio element not available");
      return;
    }
    
    if (currentTrackIndex === -1 && tracks.length > 0) {
      await playTrack(0);
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setError(null);
      } catch (error) {
        console.error('Error resuming audio:', error);
        
        if (error instanceof Error && error.name === "NotAllowedError") {
          setError("Click play again to enable audio");
          toast({
            title: "Audio Permission",
            description: "Click again to enable audio playback",
          });
        } else {
          setError(`Could not resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const newIndex = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
    playTrack(newIndex);
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    const newIndex = currentTrackIndex >= tracks.length - 1 ? 0 : currentTrackIndex + 1;
    playTrack(newIndex);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || isNaN(audioRef.current.duration)) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = audioRef.current.duration * pos;
    
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
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an audio file (MP3, WAV, OGG).",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Set default title from filename
      if (!uploadTitle) {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setUploadTitle(fileName);
      }
    }
  };
  
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
      toast({
        title: "No File Selected",
        description: "Please select an audio file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    const file = fileInputRef.current.files[0];
    
    setIsUploading(true);
    try {
      await uploadUserMusicTrack(user.id, uploadTitle, file);
      
      toast({
        title: "Upload Successful",
        description: "Your track has been uploaded successfully.",
      });
      
      // Refresh tracks
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
    } catch (error) {
      console.error('Error uploading track:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload your track. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteTrack = async (trackId: string) => {
    if (!user) return;
    
    try {
      await deleteUserMusicTrack(trackId, user.id);
      
      toast({
        title: "Track Deleted",
        description: "Your track has been deleted successfully.",
      });
      
      // Remove from local state
      setTracks(prev => prev.filter(track => track.id !== trackId));
      
      // If current track was deleted, stop playback
      if (currentTrackIndex >= 0 && tracks[currentTrackIndex].id === trackId) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        setCurrentTrackIndex(-1);
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete your track. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Render audio waveform animation
  const renderWaveform = () => {
    if (!isPlaying) return null;
    
    return (
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
    );
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
                {currentTrackIndex >= 0 
                  ? tracks[currentTrackIndex].title 
                  : 'Select a track'}
              </h3>
              <p className="text-sm opacity-80">
                {currentTrackIndex >= 0 
                  ? tracks[currentTrackIndex].artist || 'Relaxation music'
                  : 'Relaxation music'}
              </p>
              {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
            </div>
            <div className="flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setVolume(value);
                  if (audioRef.current) {
                    audioRef.current.volume = value;
                  }
                }}
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
            onClick={(e) => {
              if (!audioRef.current || isNaN(audioRef.current.duration)) return;
              
              const progressBar = e.currentTarget;
              const rect = progressBar.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              const newTime = audioRef.current.duration * pos;
              
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
            aria-label="Track progress"
          >
            <div 
              className="bg-white h-full rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-3 h-3 shadow-md"></div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center items-center space-x-8">
            <button 
              onClick={() => {
                if (tracks.length === 0) return;
                const newIndex = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
                playTrack(newIndex);
              }} 
              className="focus:outline-none hover:opacity-80 transition-opacity"
              aria-label="Previous track"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={async () => {
                if (!audioInitialized || !audioRef.current) {
                  console.error("Audio element not available");
                  return;
                }
                
                if (currentTrackIndex === -1 && tracks.length > 0) {
                  await playTrack(0);
                  return;
                }
                
                if (isPlaying) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                } else {
                  try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                    setError(null);
                  } catch (error) {
                    console.error('Error resuming audio:', error);
                    
                    if (error instanceof Error && error.name === "NotAllowedError") {
                      setError("Click play again to enable audio");
                      toast({
                        title: "Audio Permission",
                        description: "Click again to enable audio playback",
                      });
                    } else {
                      setError(`Could not resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }
                }
              }}
              className="bg-white text-mindboost-primary rounded-full w-12 h-12 flex items-center justify-center focus:outline-none hover:bg-opacity-90 transition-colors shadow-md"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <button 
              onClick={() => {
                if (tracks.length === 0) return;
                const newIndex = currentTrackIndex >= tracks.length - 1 ? 0 : currentTrackIndex + 1;
                playTrack(newIndex);
              }} 
              className="focus:outline-none hover:opacity-80 transition-opacity"
              aria-label="Next track"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
          
          {/* Sound wave animation when playing */}
          {isPlaying && (
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
                onClick={() => setShowUploadForm(false)}
                className="text-gray-500 focus:outline-none"
                aria-label="Close upload form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitUpload}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Track Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter track title"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audio File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: MP3, WAV, OGG (Max 10MB)
                </p>
              </div>
              
              <button
                type="submit"
                className="w-full bg-mindboost-primary text-white py-2 rounded-md hover:bg-mindboost-primary/90 transition-colors disabled:opacity-50"
                disabled={isUploading}
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
              Relaxation Tracks
            </h2>
            <button 
              onClick={handleUpload}
              className="flex items-center text-sm text-mindboost-primary"
              aria-label="Upload new track"
            >
              <Upload className="w-4 h-4 mr-1" /> Upload
            </button>
          </div>
          
          {/* Track loading state */}
          {loadingTracks ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindboost-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading tracks...</p>
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
                    className={`p-3 rounded-lg flex justify-between items-center cursor-pointer shadow-sm ${
                      currentTrackIndex === index
                        ? 'bg-mindboost-light text-mindboost-dark'
                        : 'bg-white'
                    }`}
                    onClick={() => playTrack(index)}
                  >
                    <div className="flex items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        currentTrackIndex === index
                          ? 'bg-mindboost-primary text-white'
                          : 'bg-gray-100'
                      }`}>
                        {currentTrackIndex === index && isPlaying 
                          ? <Pause className="w-5 h-5" /> 
                          : <Play className="w-5 h-5 ml-0.5" />
                        }
                      </div>
                      <div>
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
                          className="text-red-500 p-1 hover:bg-red-50 rounded-full"
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
