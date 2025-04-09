
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/MobileLayout';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { getProfile, updateProfile, getWeeklyActivitySummary } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { BarChart2, User, Settings, Award, AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { dailyWaterGoal, setDailyWaterGoal } = useProgress();
  const [isEditing, setIsEditing] = useState(false);
  const [waterGoal, setWaterGoal] = useState(dailyWaterGoal);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [activityStats, setActivityStats] = useState({
    gamesPlayed: 0,
    meditationMinutes: 0,
  });

  useEffect(() => {
    // Check if Supabase is configured and show warning if not
    setShowWarning(!isSupabaseConfigured());
    
    const loadProfileData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Set default profile data from auth user
        const defaultProfile = getUserProfileFromUser(user);
        
        if (isSupabaseConfigured()) {
          try {
            // Load profile from database if Supabase is configured
            const profileData = await getProfile();
            if (profileData) {
              setProfile({
                name: profileData.name,
                email: profileData.email
              });
            } else {
              // Fallback if profile not found
              setProfile(defaultProfile);
            }
            
            // Load activity stats
            try {
              const activitySummary = await getWeeklyActivitySummary();
              
              // Calculate games played
              const gamesPlayed = 
                (activitySummary['memory_game']?.count || 0);
              
              // Calculate meditation minutes
              const meditationMinutes = 
                (activitySummary['meditation']?.totalDuration || 0) / 60; // Convert seconds to minutes
              
              setActivityStats({
                gamesPlayed,
                meditationMinutes: Math.round(meditationMinutes)
              });
            } catch (error) {
              console.error('Error loading activity data:', error);
              // Keep default stats (0 values)
            }
          } catch (error) {
            console.error('Error loading profile data:', error);
            // Fallback if profile loading fails
            setProfile(defaultProfile);
          }
        } else {
          // Supabase not configured - use basic user info
          setProfile(defaultProfile);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Extract user profile from user object
    const getUserProfileFromUser = (user: any) => {
      if (!user) return { name: 'User', email: '' };
      
      // Try to get name from user_metadata
      const userMetadata = user.user_metadata as { name?: string } | undefined;
      const name = userMetadata?.name || (user.email ? user.email.split('@')[0] : 'User');
      
      return {
        name,
        email: user.email || ''
      };
    };
    
    loadProfileData();
  }, [user]);

  useEffect(() => {
    setWaterGoal(dailyWaterGoal);
  }, [dailyWaterGoal]);

  const handleWaterGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setWaterGoal(value);
    }
  };

  const saveWaterGoal = async () => {
    await setDailyWaterGoal(waterGoal);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <MobileLayout title="User Profile">
      <div className="p-4">
        {showWarning && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              Supabase is not configured. Some features will be limited.
            </AlertDescription>
          </Alert>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* User info card */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-mindboost-primary"></div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-mindboost-primary flex items-center justify-center text-white text-2xl font-semibold">
                  {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold">{profile?.name || 'User'}</h2>
                  <p className="text-gray-500">{profile?.email || user?.email || 'No email provided'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats overview */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-mindboost-primary" />
              Your Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-mindboost-lightGray rounded-lg p-3">
                <p className="text-xs text-gray-500">Memory Games Played</p>
                <p className="text-xl font-semibold">{activityStats.gamesPlayed}</p>
              </div>
              <div className="bg-mindboost-lightGray rounded-lg p-3">
                <p className="text-xs text-gray-500">Meditation Minutes</p>
                <p className="text-xl font-semibold">{activityStats.meditationMinutes}</p>
              </div>
              <div className="bg-mindboost-lightGray rounded-lg p-3">
                <p className="text-xs text-gray-500">Water Intake Goal</p>
                {isEditing ? (
                  <div className="flex items-center mt-1">
                    <input
                      type="number"
                      value={waterGoal}
                      onChange={handleWaterGoalChange}
                      className="w-20 p-1 border rounded"
                    />
                    <span className="ml-1 text-xs">ml</span>
                    <button
                      onClick={saveWaterGoal}
                      className="ml-2 p-1 bg-mindboost-primary text-white rounded text-xs"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold">{dailyWaterGoal} ml</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-mindboost-primary"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-mindboost-lightGray rounded-lg p-3">
                <p className="text-xs text-gray-500">Achievements</p>
                <p className="text-xl font-semibold">0</p>
              </div>
            </div>
          </div>

          {/* App settings */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-mindboost-primary" />
              Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-mindboost-lightGray rounded-lg">
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-3 text-mindboost-dark" />
                  <span>Account Settings</span>
                </div>
                <span>→</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-mindboost-lightGray rounded-lg">
                <div className="flex items-center">
                  <Award className="w-5 h-5 mr-3 text-mindboost-dark" />
                  <span>Achievements</span>
                </div>
                <span>→</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-mindboost-lightGray rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-3 text-mindboost-dark" />
                  <span>About</span>
                </div>
                <span>→</span>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleSignOut}
            className="w-full p-3 bg-red-100 text-red-600 rounded-lg font-medium"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default UserProfile;
