
import { useState } from 'react';
import MobileLayout from '../components/MobileLayout';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { motion } from 'framer-motion';
import { BarChart2, User, Settings, Award, AlertCircle, Droplet, Clock, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const { dailyWaterGoal, setDailyWaterGoal, waterSettings, updateWaterSettings } = useProgress();
  const [isWaterGoalEditing, setIsWaterGoalEditing] = useState(false);
  const [waterGoal, setWaterGoal] = useState(dailyWaterGoal);
  
  // Add states for water schedule settings
  const [isWaterSettingsEditing, setIsWaterSettingsEditing] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState(waterSettings?.wakeUpTime || "07:00");
  const [sleepTime, setSleepTime] = useState(waterSettings?.sleepTime || "22:00");
  const [remindersEnabled, setRemindersEnabled] = useState(waterSettings?.remindersEnabled || false);

  // Calculate active hours based on wake/sleep time
  const calculateActiveHours = () => {
    const [wakeHours, wakeMinutes] = wakeUpTime.split(':').map(Number);
    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
    
    let wakeTimeMinutes = wakeHours * 60 + wakeMinutes;
    let sleepTimeMinutes = sleepHours * 60 + sleepMinutes;
    
    // Handle case where sleep time is on the next day
    if (sleepTimeMinutes < wakeTimeMinutes) {
      sleepTimeMinutes += 24 * 60;
    }
    
    return Math.round((sleepTimeMinutes - wakeTimeMinutes) / 60);
  };

  const handleWaterGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setWaterGoal(value);
    }
  };

  const saveWaterGoal = () => {
    setDailyWaterGoal(waterGoal);
    setIsWaterGoalEditing(false);
  };
  
  const saveWaterSettings = () => {
    updateWaterSettings({
      wakeUpTime,
      sleepTime,
      remindersEnabled
    });
    setIsWaterSettingsEditing(false);
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return;
    }
    
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setRemindersEnabled(true);
      }
    } else {
      setRemindersEnabled(!remindersEnabled);
    }
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
                {isWaterGoalEditing ? (
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
                      onClick={() => setIsWaterGoalEditing(true)}
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
          
          {/* Water Schedule Settings */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Droplet className="w-5 h-5 mr-2 text-blue-500" />
                Water Schedule
              </h3>
              <button
                onClick={() => setIsWaterSettingsEditing(!isWaterSettingsEditing)}
                className="text-xs text-mindboost-primary"
              >
                {isWaterSettingsEditing ? "Cancel" : "Edit"}
              </button>
            </div>
            
            {isWaterSettingsEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Wake-up Time</label>
                  <Input 
                    type="time" 
                    value={wakeUpTime} 
                    onChange={(e) => setWakeUpTime(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Sleep Time</label>
                  <Input 
                    type="time" 
                    value={sleepTime} 
                    onChange={(e) => setSleepTime(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Water Reminders</span>
                    <button
                      onClick={requestNotificationPermission}
                      className={`px-3 py-1 rounded-md text-xs ${
                        remindersEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {remindersEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </label>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={saveWaterSettings}
                    className="w-full bg-mindboost-primary text-white p-2 rounded-md text-sm"
                  >
                    Save Water Schedule
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-mindboost-lightGray rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-mindboost-dark opacity-70" />
                    <span className="text-sm">Wake-up Time</span>
                  </div>
                  <span className="text-sm font-medium">{waterSettings?.wakeUpTime || "07:00"}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-mindboost-lightGray rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-mindboost-dark opacity-70" />
                    <span className="text-sm">Sleep Time</span>
                  </div>
                  <span className="text-sm font-medium">{waterSettings?.sleepTime || "22:00"}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-mindboost-lightGray rounded-lg">
                  <div className="flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-mindboost-dark opacity-70" />
                    <span className="text-sm">Water Reminders</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${waterSettings?.remindersEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {waterSettings?.remindersEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="text-sm">Active Hours</span>
                  </div>
                  <span className="text-sm font-medium">{calculateActiveHours()} hours</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Droplet className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="text-sm">Hourly Target</span>
                  </div>
                  <span className="text-sm font-medium">
                    {calculateActiveHours() > 0 
                      ? Math.round(dailyWaterGoal / calculateActiveHours()) 
                      : 0} ml/hour
                  </span>
                </div>
              </div>
            )}
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
