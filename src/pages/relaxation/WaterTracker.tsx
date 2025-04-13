import { useState, useEffect } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useProgress } from '../../contexts/ProgressContext';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { Droplet, Settings, Plus, ChevronUp, ChevronDown, Clock, Bell, Moon, Sun } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/customClient";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";

const WaterTracker = () => {
  const { 
    dailyWaterGoal, 
    setDailyWaterGoal, 
    addWaterLog, 
    getTotalWaterToday, 
    getWaterPercentage,
    waterLogs,
    waterSettings,
    updateWaterSettings,
  } = useProgress();
  
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyWaterGoal);
  const [waterAmount, setWaterAmount] = useState(200);
  const [totalWater, setTotalWater] = useState(0);
  const [percentage, setPercentage] = useState(0);
  
  // Water schedule settings
  const [wakeUpTime, setWakeUpTime] = useState(waterSettings?.wakeUpTime || "07:00");
  const [sleepTime, setSleepTime] = useState(waterSettings?.sleepTime || "22:00");
  const [activeHours, setActiveHours] = useState(0);
  const [hourlyTarget, setHourlyTarget] = useState(0);
  const [remindersEnabled, setRemindersEnabled] = useState(waterSettings?.remindersEnabled || false);
  const [permissionState, setPermissionState] = useState<string>("default");
  
  const { toast } = useToast();

  // Calculate active hours and hourly target when wake/sleep time changes
  useEffect(() => {
    const calculateActiveHours = () => {
      if (!wakeUpTime || !sleepTime) return;
      
      const [wakeHours, wakeMinutes] = wakeUpTime.split(':').map(Number);
      const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
      
      let wakeTimeMinutes = wakeHours * 60 + wakeMinutes;
      let sleepTimeMinutes = sleepHours * 60 + sleepMinutes;
      
      // Handle case where sleep time is on the next day
      if (sleepTimeMinutes < wakeTimeMinutes) {
        sleepTimeMinutes += 24 * 60;
      }
      
      const activeMinutes = sleepTimeMinutes - wakeTimeMinutes;
      const hours = Math.round(activeMinutes / 60);
      
      setActiveHours(hours);
      if (hours > 0) {
        setHourlyTarget(Math.round(newGoal / hours));
      }
    };
    
    calculateActiveHours();
  }, [wakeUpTime, sleepTime, newGoal]);

  // Check notification permission status on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Load user data
  useEffect(() => {
    setTotalWater(getTotalWaterToday());
    setPercentage(getWaterPercentage());
    
    // Initialize settings from context
    if (waterSettings) {
      setWakeUpTime(waterSettings.wakeUpTime || "07:00");
      setSleepTime(waterSettings.sleepTime || "22:00");
      setRemindersEnabled(waterSettings.remindersEnabled || false);
    }
  }, [getTotalWaterToday, getWaterPercentage, waterLogs, waterSettings]);

  // Check if current time is within active hours
  const isActiveHour = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const [wakeHours, wakeMinutes] = wakeUpTime.split(':').map(Number);
    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
    
    const wakeTimeMinutes = wakeHours * 60 + wakeMinutes;
    let sleepTimeMinutes = sleepHours * 60 + sleepMinutes;
    
    if (sleepTimeMinutes < wakeTimeMinutes) {
      sleepTimeMinutes += 24 * 60;
      if (currentTimeMinutes < wakeTimeMinutes) {
        return false;
      }
    }
    
    return currentTimeMinutes >= wakeTimeMinutes && 
           currentTimeMinutes < sleepTimeMinutes;
  };

  // Handle notifications
  useEffect(() => {
    if (!remindersEnabled) return;
    
    const checkAndNotify = () => {
      if (isActiveHour() && percentage < 100) {
        // Show notification
        if (Notification.permission === "granted") {
          new Notification("MindBoost Water Reminder", {
            body: "💧 Time to drink water and log your intake!",
            icon: "/logo.png" 
          });
        }
        
        // Show toast notification
        toast({
          title: "Water Reminder",
          description: "💧 Time to drink water and log your intake!",
        });
      }
    };
    
    // Show notifications every hour
    const interval = setInterval(checkAndNotify, 60 * 60 * 1000);
    
    // Also check on mount
    checkAndNotify();
    
    return () => clearInterval(interval);
  }, [remindersEnabled, percentage, toast]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return;
    }
    
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      
      if (permission === "granted") {
        setRemindersEnabled(true);
        updateWaterSettings({
          ...waterSettings,
          remindersEnabled: true
        });
        toast({
          title: "Notifications enabled",
          description: "You'll receive water reminders during active hours",
        });
      } else {
        toast({
          title: "Notifications disabled",
          description: "Please enable notifications in your browser settings to receive water reminders",
          variant: "destructive",
        });
      }
    } else {
      // Toggle notifications if already granted
      const newState = !remindersEnabled;
      setRemindersEnabled(newState);
      updateWaterSettings({
        ...waterSettings,
        remindersEnabled: newState
      });
      
      toast({
        title: newState ? "Reminders enabled" : "Reminders disabled",
        description: newState 
          ? "You'll receive water reminders during active hours" 
          : "You won't receive water reminders",
      });
    }
  };

  const handleToggleReminders = (enabled: boolean) => {
    if (enabled && Notification.permission !== "granted") {
      // Need to request permission first
      requestNotificationPermission();
    } else {
      // Just toggle the state if permission already granted
      setRemindersEnabled(enabled);
      updateWaterSettings({
        ...waterSettings,
        remindersEnabled: enabled
      });
      
      toast({
        title: enabled ? "Reminders enabled" : "Reminders disabled",
        description: enabled 
          ? "You'll receive water reminders during active hours" 
          : "You won't receive water reminders",
      });
    }
  };

  const handleAddWater = () => {
    addWaterLog(waterAmount);
    
    toast({
      title: "Water Added",
      description: `Added ${waterAmount}ml to your daily intake.`,
    });
    
    setTotalWater(prev => prev + waterAmount);
    setPercentage(Math.min(100, Math.round(((totalWater + waterAmount) / dailyWaterGoal) * 100)));
  };

  const handleSaveGoal = async () => {
    setDailyWaterGoal(newGoal);
    
    // Save water settings
    const settings = {
      wakeUpTime,
      sleepTime,
      remindersEnabled,
    };
    
    updateWaterSettings(settings);
    
    setShowSettings(false);
    
    toast({
      title: "Settings Saved",
      description: "Your water intake settings have been updated.",
    });
  };

  const increaseWaterAmount = () => {
    setWaterAmount(prev => Math.min(prev + 50, 500));
  };

  const decreaseWaterAmount = () => {
    setWaterAmount(prev => Math.max(prev - 50, 50));
  };

  const handleSliderChange = (value: number[]) => {
    setNewGoal(value[0]);
  };

  const getMotivationalMessage = () => {
    if (percentage < 25) {
      return "You're just getting started! Keep drinking water.";
    } else if (percentage < 50) {
      return "Nice progress! Staying hydrated improves concentration.";
    } else if (percentage < 75) {
      return "Well done! You're more than halfway to your goal.";
    } else if (percentage < 100) {
      return "Almost there! A hydrated brain functions better.";
    } else {
      return "Congratulations! You've reached your daily water goal!";
    }
  };

  const predefinedGoals = [1500, 2000, 2500, 3000, 3500];

  return (
    <MobileLayout title="Water Tracker">
      <div className="p-4">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-mindboost-dark">Water Tracker</h1>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Settings className="w-5 h-5 text-mindboost-dark" />
            </button>
          </div>
          <p className="text-gray-500">
            Track your daily water intake for better brain performance
          </p>
        </div>
        
        {/* Settings panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-4 mb-6"
          >
            <h3 className="font-medium mb-3">Water Intake Settings</h3>
            
            <div className="mb-4 space-y-4">
              {/* Daily water goal */}
              <div>
                <Label className="text-sm text-gray-500 mb-1 block">Daily Water Goal</Label>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>500ml</span>
                  <span>4000ml</span>
                </div>
                <Slider
                  min={500}
                  max={4000}
                  step={100}
                  value={[newGoal]}
                  onValueChange={handleSliderChange}
                />
                <div className="text-center font-medium mt-1">{newGoal}ml</div>
              
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {predefinedGoals.map(goal => (
                    <button
                      key={goal}
                      onClick={() => setNewGoal(goal)}
                      className={`text-xs py-1 px-2 rounded-md ${
                        newGoal === goal 
                          ? 'bg-mindboost-primary text-white' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {goal}ml
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Active hours settings */}
              <div className="space-y-3">
                <div>
                  <Label className="flex items-center gap-2 mb-1">
                    <Sun className="h-4 w-4" /> Wake-up Time
                  </Label>
                  <Input
                    type="time"
                    value={wakeUpTime}
                    onChange={(e) => setWakeUpTime(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2 mb-1">
                    <Moon className="h-4 w-4" /> Sleep Time
                  </Label>
                  <Input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Active hours and reminders */}
              {activeHours > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">Active Hours:</span>
                    <span className="text-sm font-medium">{activeHours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Hourly Target:</span>
                    <span className="text-sm font-medium">{hourlyTarget} ml/hour</span>
                  </div>
                </div>
              )}
              
              {/* Reminder toggle with switch */}
              <div className="flex items-center justify-between">
                <Label htmlFor="reminder-switch" className="flex items-center gap-2 cursor-pointer">
                  <Bell className="h-4 w-4" /> Enable Reminders
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{remindersEnabled ? 'On' : 'Off'}</span>
                  <Switch
                    id="reminder-switch"
                    checked={remindersEnabled}
                    onCheckedChange={handleToggleReminders}
                  />
                </div>
              </div>
              
              {permissionState === "denied" && (
                <p className="text-xs text-red-500">
                  Notifications are blocked in your browser. You'll need to change your browser settings to enable reminders.
                </p>
              )}
              
              {remindersEnabled && permissionState === "granted" && (
                <p className="text-xs text-blue-500">
                  You'll receive reminders during your active hours
                </p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSaveGoal}
                className="bg-mindboost-primary text-white px-4 py-2 rounded-md text-sm"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Water glass visualization */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-40 h-40 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Glass outline */}
              <path
                d="M30,20 L30,80 C30,88 40,95 50,95 C60,95 70,88 70,80 L70,20 Z"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="2"
              />
              
              {/* Water fill */}
              <path
                d="M30,80 C30,88 40,95 50,95 C60,95 70,88 70,80 L70,80 L30,80 Z"
                fill="#d3e4fd"
                transform={`translate(0, ${-60 * (percentage / 100)})`}
              />
              
              {/* Glass top */}
              <ellipse
                cx="50"
                cy="20"
                rx="20"
                ry="5"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="2"
              />
              
              {/* Water top - only show if there's water */}
              {percentage > 0 && (
                <ellipse
                  cx="50"
                  cy="80"
                  rx="20"
                  ry="5"
                  fill="#73b5fd"
                  transform={`translate(0, ${-60 * (percentage / 100)})`}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-mindboost-dark font-bold text-xl">
              {percentage}%
            </div>
          </div>
          
          <div className="text-center">
            <p className="font-semibold text-lg text-mindboost-dark">
              {totalWater} / {dailyWaterGoal} ml
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {getMotivationalMessage()}
            </p>
            {remindersEnabled && isActiveHour() && (
              <p className="text-xs text-blue-500 mt-1">
                Remember to drink ~{hourlyTarget}ml this hour
              </p>
            )}
          </div>
        </div>
        
        {/* Add water section */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-medium mb-3">Add Water</h3>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={decreaseWaterAmount}
              className="p-2 rounded-full bg-gray-100"
              disabled={waterAmount <= 50}
            >
              <ChevronDown className="w-5 h-5 text-mindboost-dark" />
            </button>
            <div className="flex items-center">
              <Droplet className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-xl font-bold">{waterAmount} ml</span>
            </div>
            <button
              onClick={increaseWaterAmount}
              className="p-2 rounded-full bg-gray-100"
              disabled={waterAmount >= 500}
            >
              <ChevronUp className="w-5 h-5 text-mindboost-dark" />
            </button>
          </div>
          <button
            onClick={handleAddWater}
            className="w-full flex items-center justify-center mindboost-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Water
          </button>
        </div>
        
        {/* Today's water log */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-semibold mb-2">Today's Water Intake</h3>
          <div className="space-y-2">
            {waterLogs
              .filter(log => {
                const today = new Date();
                today.setHours(0,0,0,0);
                return new Date(log.timestamp).getTime() >= today.getTime();
              })
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((log, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <Droplet className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="text-sm">{log.amount} ml</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              ))
            }
            
            {waterLogs.filter(log => {
              const today = new Date();
              today.setHours(0,0,0,0);
              return new Date(log.timestamp).getTime() >= today.getTime();
            }).length === 0 && (
              <p className="text-sm text-gray-500 py-2">No water logged today yet</p>
            )}
          </div>
        </div>
        
        {/* Benefits section */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2">Benefits of Hydration</h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li>• Improves cognitive performance</li>
            <li>• Enhances memory function</li>
            <li>• Regulates mood and reduces stress</li>
            <li>• Maintains concentration and alertness</li>
            <li>• Helps prevent headaches</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  );
};

export default WaterTracker;
