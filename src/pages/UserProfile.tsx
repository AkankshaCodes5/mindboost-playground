
import { useState } from 'react';
import MobileLayout from '../components/MobileLayout';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { motion } from 'framer-motion';
import { BarChart2, User, Settings, Award, AlertCircle } from 'lucide-react';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const { dailyWaterGoal, setDailyWaterGoal } = useProgress();
  const [isEditing, setIsEditing] = useState(false);
  const [waterGoal, setWaterGoal] = useState(dailyWaterGoal);

  const handleWaterGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setWaterGoal(value);
    }
  };

  const saveWaterGoal = () => {
    setDailyWaterGoal(waterGoal);
    setIsEditing(false);
  };

  return (
    <MobileLayout title="User Profile">
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* User info card */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-mindboost-primary flex items-center justify-center text-white text-2xl font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold">{user?.name}</h2>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>
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
                <p className="text-xl font-semibold">0</p>
              </div>
              <div className="bg-mindboost-lightGray rounded-lg p-3">
                <p className="text-xs text-gray-500">Meditation Minutes</p>
                <p className="text-xl font-semibold">0</p>
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
            onClick={signOut}
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
