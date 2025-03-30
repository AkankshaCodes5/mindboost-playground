
import { useState, useRef, useEffect } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, Upload } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  category: string;
  duration: string;
  source: string;
}

const MusicPage = () => {
  const [tracks] = useState<Track[]>([
    {
      id: '1',
      title: 'Calm Waters',
      category: 'Nature Sounds',
      duration: '5:32',
      source: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1baf.mp3?filename=calm-river-ambience-loop-125071.mp3'
    },
    {
      id: '2',
      title: 'Forest Meditation',
      category: 'Nature Sounds',
      duration: '4:15',
      source: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_82429925a9.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3'
    },
    {
      id: '3',
      title: 'Deep Focus',
      category: 'Binaural Beats',
      duration: '6:45',
      source: 'https://cdn.pixabay.com/download/audio/2021/11/13/audio_cb31ab7a71.mp3?filename=ambient-piano-ampamp-strings-10711.mp3'
    },
    {
      id: '4',
      title: 'Dream State',
      category: 'Binaural Beats',
      duration: '8:20',
      source: 'https://cdn.pixabay.com/download/audio/2021/04/08/audio_7ef676c9c8.mp3?filename=relaxing-mountains-rivers-amp-birds-singing-5816.mp3'
    }
  ]);
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const duration = audio.duration;
      const currentTime = audio.currentTime;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleTrackEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [currentTrackIndex]);

  const handleTrackEnd = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    } else {
      setCurrentTrackIndex(0);
    }
  };

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    
    if (audioRef.current) {
      audioRef.current.src = tracks[index].source;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error",
          description: "Could not play the selected track.",
          variant: "destructive",
        });
      });
    }
  };

  const togglePlayPause = () => {
    if (currentTrackIndex === -1 && tracks.length > 0) {
      playTrack(0);
      return;
    }
    
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const prevTrack = () => {
    const newIndex = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
    playTrack(newIndex);
  };

  const nextTrack = () => {
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
    if (!audioRef.current) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const duration = audioRef.current.duration;
    
    audioRef.current.currentTime = duration * pos;
  };

  const handleUpload = () => {
    toast({
      title: "Coming Soon",
      description: "The feature to upload your own tracks will be available soon.",
    });
  };
  
  return (
    <MobileLayout title="Music & Sounds">
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-mindboost-dark mb-1">Relaxation Sounds</h1>
          <p className="text-gray-500">
            Listen to calming sounds to reduce stress and improve focus
          </p>
        </div>
        
        {/* Current track player */}
        <div className="bg-mindboost-primary text-white rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">
                {currentTrackIndex >= 0 
                  ? tracks[currentTrackIndex].title 
                  : 'Select a track'}
              </h3>
              <p className="text-sm opacity-80">
                {currentTrackIndex >= 0 
                  ? tracks[currentTrackIndex].category 
                  : 'Relaxation sounds'}
              </p>
            </div>
            <div className="flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>
          
          {/* Progress bar */}
          <div 
            className="w-full bg-white bg-opacity-20 h-1.5 rounded-full mb-4 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="bg-white h-full rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center items-center space-x-8">
            <button onClick={prevTrack}>
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={togglePlayPause}
              className="bg-white text-mindboost-primary rounded-full w-12 h-12 flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button onClick={nextTrack}>
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
          
          <audio ref={audioRef} />
        </div>
        
        {/* Track list */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-mindboost-dark">Available Tracks</h2>
            <button 
              onClick={handleUpload}
              className="flex items-center text-sm text-mindboost-primary"
            >
              <Upload className="w-4 h-4 mr-1" /> Upload
            </button>
          </div>
          
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => playTrack(index)}
                className={`p-3 rounded-lg flex justify-between items-center cursor-pointer ${
                  currentTrackIndex === index
                    ? 'bg-mindboost-light text-mindboost-dark'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    currentTrackIndex === index
                      ? 'bg-mindboost-primary text-white'
                      : 'bg-gray-100'
                  }`}>
                    {currentTrackIndex === index && isPlaying 
                      ? <Pause className="w-4 h-4" /> 
                      : <Play className="w-4 h-4" />
                    }
                  </div>
                  <div>
                    <p className="font-medium">{track.title}</p>
                    <p className="text-xs text-gray-500">{track.category}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{track.duration}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Tips section */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2">Music & Sound Benefits</h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li>• Reduces stress hormone levels</li>
            <li>• Enhances focus and concentration</li>
            <li>• Binaural beats can alter brainwave frequency</li>
            <li>• Nature sounds improve cognitive function</li>
            <li>• Can reduce symptoms of depression</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MusicPage;
