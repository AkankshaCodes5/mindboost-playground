
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  logWaterIntake, 
  getWaterLogs, 
  getUserSettings, 
  updateUserSettings,
  WaterLog,
  UserSettings
} from '@/services/api';
import { useToast } from "@/components/ui/use-toast";

interface ProgressContextType {
  dailyWaterGoal: number;
  setDailyWaterGoal: (goal: number) => Promise<void>;
  addWaterLog: (amount: number) => Promise<void>;
  getTotalWaterToday: () => number;
  getWaterPercentage: () => number;
  waterLogs: WaterLog[];
  isLoading: boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dailyWaterGoal, setDailyWaterGoalState] = useState(2000);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user settings and water logs when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Load user settings
        const settings = await getUserSettings();
        if (settings) {
          setDailyWaterGoalState(settings.daily_water_goal);
        }
        
        // Load today's water logs
        const today = new Date().toISOString().split('T')[0];
        const logs = await getWaterLogs(today);
        setWaterLogs(logs);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const setDailyWaterGoal = async (goal: number) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const updated = await updateUserSettings({ daily_water_goal: goal });
      
      if (updated) {
        setDailyWaterGoalState(goal);
        toast({
          title: "Goal Updated",
          description: `Your daily water goal is now ${goal}ml.`,
        });
      }
    } catch (error) {
      console.error('Error updating water goal:', error);
      toast({
        title: "Error",
        description: "Failed to update water goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addWaterLog = async (amount: number) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const log = await logWaterIntake(amount);
      
      if (log) {
        setWaterLogs(prev => [log, ...prev]);
        toast({
          title: "Water Added",
          description: `Added ${amount}ml to your daily intake.`,
        });
      }
    } catch (error) {
      console.error('Error adding water log:', error);
      toast({
        title: "Error",
        description: "Failed to add water log. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalWaterToday = () => {
    return waterLogs.reduce((total, log) => total + log.amount, 0);
  };

  const getWaterPercentage = () => {
    const total = getTotalWaterToday();
    return Math.min(100, Math.round((total / dailyWaterGoal) * 100));
  };

  return (
    <ProgressContext.Provider
      value={{
        dailyWaterGoal,
        setDailyWaterGoal,
        addWaterLog,
        getTotalWaterToday,
        getWaterPercentage,
        waterLogs,
        isLoading
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
