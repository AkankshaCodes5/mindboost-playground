
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  logWaterIntake, 
  getWaterLogs, 
  getUserSettings, 
  updateUserSettings,
  logActivity,
  logMeditationSession,
  getMeditationSessions,
  WaterLog,
  UserSettings,
  ActivityType
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
  addGameScore: (game: string, score: number, duration?: number) => Promise<void>;
  addMeditationSession: (duration: number, type?: string, notes?: string) => Promise<void>;
  getMeditationMinutesToday: () => number;
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
  const [meditationMinutesToday, setMeditationMinutesToday] = useState(0);
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
        
        // Load today's meditation sessions
        await loadMeditationData();
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const loadMeditationData = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sessions = await getMeditationSessions(today.toISOString());
      const totalMinutes = sessions.reduce((total, session) => total + (session.duration / 60), 0);
      setMeditationMinutesToday(totalMinutes);
    } catch (error) {
      console.error('Error loading meditation data:', error);
    }
  };

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

  const addGameScore = async (game: string, score: number, duration?: number) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await logActivity('memory_game', { game_type: game }, score, duration);
      
      toast({
        title: "Score Recorded",
        description: `Your ${game} score has been saved.`,
      });
    } catch (error) {
      console.error('Error adding game score:', error);
      toast({
        title: "Error",
        description: "Failed to save your score. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMeditationSession = async (duration: number, type?: string, notes?: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await logMeditationSession(duration, type, notes);
      
      // Also log as an activity for reporting
      await logActivity('meditation', { meditation_type: type }, undefined, duration);
      
      // Update today's total
      await loadMeditationData();
      
      toast({
        title: "Meditation Recorded",
        description: `Your ${Math.round(duration / 60)}-minute session has been saved.`,
      });
    } catch (error) {
      console.error('Error adding meditation session:', error);
      toast({
        title: "Error",
        description: "Failed to save your meditation session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMeditationMinutesToday = () => {
    return meditationMinutesToday;
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
        isLoading,
        addGameScore,
        addMeditationSession,
        getMeditationMinutesToday
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
