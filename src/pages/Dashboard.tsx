import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Brain, Music, GlassWater } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { getProfile } from '@/services/api';
import ActivityCard from '../components/ActivityCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTotalWaterToday, getWaterPercentage, getMeditationMinutesToday } = useProgress();
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');
  const waterPercentage = getWaterPercentage();
  const meditationMinutes = getMeditationMinutesToday();

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          // Attempt to get user's name from profile
          const profile = await getProfile();
          if (profile && profile.name) {
            setUserName(profile.name);
          } else {
            // Fall back to user metadata or email
            setUserName(getUserNameFromUser(user));
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          // Fall back to simple user name extraction
          setUserName(getUserNameFromUser(user));
        }
      } else {
        setUserName('User');
      }
    };
    
    // Extract user name from user object
    const getUserNameFromUser = (user: any) => {
      if (!user) return 'User';
      
      // Try to get name from user_metadata
      const userMetadata = user.user_metadata as { name?: string } | undefined;
      if (userMetadata?.name) return userMetadata.name;
      
      // Try to get name from email
      if (user.email) return user.email.split('@')[0];
      
      // Fallback
      return 'User';
    };
    
    loadUserProfile();
    
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [user]);

  const activityCards = [
    {
      title: 'Memory Games',
      description: 'Enhance your cognitive abilities',
      icon: <Brain className="w-6 h-6 text-mindboost-primary" />,
      path: '/games',
      color: 'bg-blue-100'
    },
    {
      title: 'Meditation',
      description: 'Find your inner peace',
      icon: <Activity className="w-6 h-6 text-mindboost-primary" />,
      path: '/meditation',
      color: 'bg-green-100'
    },
    {
      title: 'Relaxing Music',
      description: 'Calm your mind with sounds',
      icon: <Music className="w-6 h-6 text-mindboost-primary" />,
      path: '/music',
      color: 'bg-purple-100'
    },
    {
      title: 'Water Tracker',
      description: 'Stay hydrated throughout the day',
      icon: <GlassWater className="w-6 h-6 text-mindboost-primary" />,
      path: '/water-tracker',
      color: 'bg-cyan-100'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4">
      <img 
        src="/lovable-uploads/90151ba5-1f64-49ca-8445-777a7bc2fb42.png" 
        alt="MindBoost Logo" 
        className="w-24 h-24 mb-4"
      />
      <h1 className="text-3xl font-bold text-mindboost-dark mb-2">MINDBOOST</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-mindboost-dark">
          {greeting}, {userName}!
        </h2>
        <p className="text-gray-600">Let's boost your mind today.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 w-full max-w-md"
      >
        {activityCards.map((card, index) => (
          <ActivityCard
            key={index}
            title={card.title}
            description={card.description}
            icon={card.icon}
            path={card.path}
            color={card.color}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-8 w-full max-w-md"
      >
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-lg font-semibold text-mindboost-dark mb-2">Today's Progress</h3>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Water Intake:</p>
            <div className="text-mindboost-primary font-semibold">
              {getTotalWaterToday()}ml / 100%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-mindboost-primary h-2.5 rounded-full" style={{ width: `${waterPercentage}%` }}></div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Meditation:</p>
            <div className="text-mindboost-primary font-semibold">
              {meditationMinutes} minutes
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
