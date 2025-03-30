
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type GameScore = {
  timestamp: number;
  score: number;
  duration: number;
};

type WaterLog = {
  timestamp: number;
  amount: number; // in ml
};

type MeditationSession = {
  timestamp: number;
  duration: number; // in seconds
};

type ProgressContextType = {
  gameScores: Record<string, GameScore[]>;
  waterLogs: WaterLog[];
  meditationSessions: MeditationSession[];
  dailyWaterGoal: number;
  setDailyWaterGoal: (goal: number) => void;
  addGameScore: (gameId: string, score: number, duration: number) => void;
  addWaterLog: (amount: number) => void;
  addMeditationSession: (duration: number) => void;
  getTotalWaterToday: () => number;
  getWaterPercentage: () => number;
  getMeditationMinutesToday: () => number;
  getRecentGameScores: (gameId: string) => GameScore[];
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [gameScores, setGameScores] = useState<Record<string, GameScore[]>>({});
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [meditationSessions, setMeditationSessions] = useState<MeditationSession[]>([]);
  const [dailyWaterGoal, setDailyWaterGoal] = useState<number>(2000); // 2000ml default

  // Load stored data on initial load
  useEffect(() => {
    const loadStoredData = () => {
      const storedGameScores = localStorage.getItem('mindboost_game_scores');
      const storedWaterLogs = localStorage.getItem('mindboost_water_logs');
      const storedMeditationSessions = localStorage.getItem('mindboost_meditation_sessions');
      const storedWaterGoal = localStorage.getItem('mindboost_water_goal');
      
      if (storedGameScores) setGameScores(JSON.parse(storedGameScores));
      if (storedWaterLogs) setWaterLogs(JSON.parse(storedWaterLogs));
      if (storedMeditationSessions) setMeditationSessions(JSON.parse(storedMeditationSessions));
      if (storedWaterGoal) setDailyWaterGoal(JSON.parse(storedWaterGoal));
    };
    
    loadStoredData();
  }, []);

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('mindboost_game_scores', JSON.stringify(gameScores));
  }, [gameScores]);
  
  useEffect(() => {
    localStorage.setItem('mindboost_water_logs', JSON.stringify(waterLogs));
  }, [waterLogs]);
  
  useEffect(() => {
    localStorage.setItem('mindboost_meditation_sessions', JSON.stringify(meditationSessions));
  }, [meditationSessions]);
  
  useEffect(() => {
    localStorage.setItem('mindboost_water_goal', JSON.stringify(dailyWaterGoal));
  }, [dailyWaterGoal]);

  const addGameScore = (gameId: string, score: number, duration: number) => {
    setGameScores(prev => {
      const newScores = { ...prev };
      if (!newScores[gameId]) {
        newScores[gameId] = [];
      }
      newScores[gameId] = [
        ...newScores[gameId], 
        { timestamp: Date.now(), score, duration }
      ];
      return newScores;
    });
  };

  const addWaterLog = (amount: number) => {
    setWaterLogs(prev => [...prev, { timestamp: Date.now(), amount }]);
  };

  const addMeditationSession = (duration: number) => {
    setMeditationSessions(prev => [...prev, { timestamp: Date.now(), duration }]);
  };

  // Helper to get start of today's date in milliseconds
  const getStartOfToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  };

  const getTotalWaterToday = () => {
    const startOfToday = getStartOfToday();
    return waterLogs
      .filter(log => log.timestamp >= startOfToday)
      .reduce((total, log) => total + log.amount, 0);
  };

  const getWaterPercentage = () => {
    const totalWater = getTotalWaterToday();
    return Math.min(100, Math.round((totalWater / dailyWaterGoal) * 100));
  };

  const getMeditationMinutesToday = () => {
    const startOfToday = getStartOfToday();
    const totalSeconds = meditationSessions
      .filter(session => session.timestamp >= startOfToday)
      .reduce((total, session) => total + session.duration, 0);
    
    return Math.round(totalSeconds / 60);
  };

  const getRecentGameScores = (gameId: string) => {
    const scores = gameScores[gameId] || [];
    return scores.slice(-5); // Return last 5 scores
  };

  const value = {
    gameScores,
    waterLogs,
    meditationSessions,
    dailyWaterGoal,
    setDailyWaterGoal,
    addGameScore,
    addWaterLog,
    addMeditationSession,
    getTotalWaterToday,
    getWaterPercentage,
    getMeditationMinutesToday,
    getRecentGameScores
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};
