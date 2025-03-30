
import { useState, useEffect, useRef } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useProgress } from '../../contexts/ProgressContext';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { Timer, Play, Pause, ArrowLeft } from 'lucide-react';

const MeditationPage = () => {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [breathingState, setBreathingState] = useState<'in' | 'out'>('in');
  const [breathingText, setBreathingText] = useState('Breathe in...');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { addMeditationSession } = useProgress();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      const breatheToggle = setInterval(() => {
        setBreathingState(prev => {
          const newState = prev === 'in' ? 'out' : 'in';
          setBreathingText(newState === 'in' ? 'Breathe in...' : 'Breathe out...');
          return newState;
        });
      }, 5000); // Toggle every 5 seconds

      return () => clearInterval(breatheToggle);
    }
  }, [isActive]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMeditation = () => {
    if (!isActive) {
      setIsActive(true);
      toast({
        title: "Meditation Started",
        description: "Follow the breathing pattern and relax.",
      });
    } else {
      setIsActive(false);
      addMeditationSession(seconds);
      toast({
        title: "Meditation Ended",
        description: `You meditated for ${formatTime(seconds)}.`,
      });
      setSeconds(0);
    }
  };

  return (
    <MobileLayout title="Meditation">
      <div className="p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-mindboost-dark">Guided Breathing</h1>
          <p className="text-gray-500 mt-1">
            Follow the animation and focus on your breathing
          </p>
        </div>

        <div className="mb-8 flex flex-col items-center">
          <div className="text-lg font-medium mb-2 text-mindboost-dark">
            {breathingText}
          </div>
          
          <div className="relative h-40 w-40 flex items-center justify-center">
            <motion.div
              animate={
                isActive
                  ? {
                      scale: breathingState === 'in' ? 1.3 : 1,
                      opacity: breathingState === 'in' ? 1 : 0.7,
                    }
                  : { scale: 1, opacity: 0.7 }
              }
              transition={{ duration: 5, ease: "easeInOut" }}
              className="absolute rounded-full bg-mindboost-light h-32 w-32"
            />
            <div className="relative z-10 text-4xl font-bold text-mindboost-dark">
              {formatTime(seconds)}
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-600">
            {isActive
              ? "Focus on your breathing and clear your mind"
              : "Press start to begin your meditation session"}
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={toggleMeditation}
            className={`flex items-center justify-center rounded-full w-16 h-16 text-white ${
              isActive ? 'bg-red-500' : 'bg-mindboost-primary'
            }`}
          >
            {isActive ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2">Meditation Benefits</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Reduces stress and anxiety</li>
            <li>• Improves focus and concentration</li>
            <li>• Enhances self-awareness</li>
            <li>• Promotes emotional health</li>
            <li>• Improves sleep quality</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MeditationPage;
