
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/MobileLayout';
import ActivityCard from '../components/ActivityCard';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { motion } from 'framer-motion';
import { Brain, Music, Droplet, Timer, Award, BarChart } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    getTotalWaterToday, 
    getWaterPercentage, 
    getMeditationMinutesToday,
    getGameScoresByType
  } = useProgress();

  // Get game scores count for today
  const getGameScoresCount = () => {
    // Count all game scores from different types
    const matchingGames = getGameScoresByType('matching').length;
    const numberRecallGames = getGameScoresByType('number-recall').length;
    const objectSequencingGames = getGameScoresByType('object-sequencing').length;
    const stroopTestGames = getGameScoresByType('stroop-test').length;
    
    return matchingGames + numberRecallGames + objectSequencingGames + stroopTestGames;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <MobileLayout title="Dashboard" showBack={false}>
      <div className="p-4">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Welcome section */}
          <motion.div variants={item} className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-1">Welcome, {user?.name}</h2>
            <p className="text-gray-500">Ready to boost your mind today?</p>
          </motion.div>

          {/* Progress summary */}
          <motion.div variants={item}>
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-mindboost-primary" />
              Today's Progress
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center">
                <Brain className="w-6 h-6 text-mindboost-primary mb-2" />
                <span className="text-xs text-gray-500">Memory Games</span>
                <span className="font-semibold text-mindboost-dark">{getGameScoresCount()}</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center">
                <Timer className="w-6 h-6 text-mindboost-primary mb-2" />
                <span className="text-xs text-gray-500">Meditation</span>
                <span className="font-semibold text-mindboost-dark">{getMeditationMinutesToday()} min</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center">
                <Droplet className="w-6 h-6 text-mindboost-primary mb-2" />
                <span className="text-xs text-gray-500">Water</span>
                <span className="font-semibold text-mindboost-dark">{getWaterPercentage()}%</span>
              </div>
            </div>
          </motion.div>

          {/* Activities */}
          <motion.div variants={item}>
            <h3 className="font-medium text-gray-700 mb-3">Activities</h3>
            <div className="space-y-3">
              <ActivityCard
                title="Memory Games"
                description="Improve your memory and concentration"
                icon={<Brain className="w-5 h-5" />}
                path="/games"
              />
              <ActivityCard
                title="Meditation"
                description="Guided breathing exercises"
                icon={<Timer className="w-5 h-5" />}
                path="/meditation"
                color="bg-mindboost-secondary"
              />
              <ActivityCard
                title="Music & Sounds"
                description="Relaxation and stress relief tracks"
                icon={<Music className="w-5 h-5" />}
                path="/music"
                color="bg-purple-500"
              />
              <ActivityCard
                title="Water Tracker"
                description="Track your daily water intake"
                icon={<Droplet className="w-5 h-5" />}
                path="/water-tracker"
                color="bg-blue-500"
              />
            </div>
          </motion.div>

          {/* Daily challenge */}
          <motion.div variants={item} className="bg-mindboost-primary text-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold mb-1">Daily Challenge</h3>
                <p className="text-sm opacity-90">Complete a memory game and 5 minutes of meditation</p>
              </div>
              <Award className="w-8 h-8" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
