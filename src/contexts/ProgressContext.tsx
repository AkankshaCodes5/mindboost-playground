import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from "@/integrations/supabase/customClient";
import { saveGameScore, getGameScoresByType, getRecentGameScores, GameScore } from '../services/gameService';
import { getAllMusicTracks, getUserMusicTracks, uploadUserMusicTrack, deleteUserMusicTrack, MusicTrack } from '../services/musicService';

// Enhanced Game Score Types
type BaseGameScore = {
  timestamp: number;
  userId: string;
  duration: number; // in seconds
};

type MatchingGameScore = BaseGameScore & {
  gameType: 'matching';
  score: number;
  attempts: number;
};

type NumberRecallGameScore = BaseGameScore & {
  gameType: 'number-recall';
  identifiedCount: number;
  totalCount: number;
  userComments?: string;
};

type ObjectSequencingGameScore = BaseGameScore & {
  gameType: 'object-sequencing';
  isCorrect: boolean;
  attempts: number;
};

type StroopTestGameScore = BaseGameScore & {
  gameType: 'stroop-test';
  row: number;
  column: number;
};

// Water tracking
type WaterLog = {
  timestamp: number;
  userId: string;
  amount: number; // in ml
};

// Meditation tracking
type MeditationSession = {
  timestamp: number;
  userId: string;
  duration: number; // in seconds
  concentrationImprovement?: number; // percentage (0-100)
};

type ProgressContextType = {
  // Game methods
  gameScores: GameScore[];
  addMatchingGameScore: (score: number, attempts: number, duration: number) => void;
  addNumberRecallScore: (identifiedCount: number, totalCount: number, duration: number, comments?: string) => void;
  addObjectSequencingScore: (isCorrect: boolean, attempts: number, duration: number) => void;
  addStroopTestScore: (row: number, column: number, duration: number) => void;
  getGameScoresByType: (gameType: string) => GameScore[];
  getRecentGameScores: (gameType: string) => GameScore[];
  
  // Water tracking
  waterLogs: WaterLog[];
  dailyWaterGoal: number;
  setDailyWaterGoal: (goal: number) => void;
  addWaterLog: (amount: number) => void;
  getTotalWaterToday: () => number;
  getWaterPercentage: () => number;
  getWaterLogsByDateRange: (startDate: number, endDate: number) => WaterLog[];
  
  // Meditation tracking
  meditationSessions: MeditationSession[];
  addMeditationSession: (duration: number, concentrationImprovement?: number) => void;
  getMeditationMinutesToday: () => number;
  getMeditationSessionsByDateRange: (startDate: number, endDate: number) => MeditationSession[];
  
  // Music tracking
  musicTracks: MusicTrack[];
  addBuiltInMusicTrack: (id: string, title: string, artist: string, filePath: string) => void;
  addUserMusicTrack: (title: string, filePath: string) => void;
  getAllMusicTracks: () => MusicTrack[];
  getUserMusicTracks: () => MusicTrack[];
  
  // Progress analysis
  getDailyProgressSummary: () => {
    date: number;
    gameScoresCount: number;
    meditationMinutes: number;
    waterPercentage: number;
  };
  getWeeklyProgressHistory: () => Array<{
    date: number;
    gameScoresCount: number;
    meditationMinutes: number;
    waterPercentage: number;
  }>;
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
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  
  // State for all tracking features
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [meditationSessions, setMeditationSessions] = useState<MeditationSession[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [dailyWaterGoal, setDailyWaterGoal] = useState<number>(2000); // 2000ml default

  // Load stored data on initial load
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedGameScores = localStorage.getItem('mindboost_game_scores');
        const storedWaterLogs = localStorage.getItem('mindboost_water_logs');
        const storedMeditationSessions = localStorage.getItem('mindboost_meditation_sessions');
        const storedMusicTracks = localStorage.getItem('mindboost_music_tracks');
        const storedWaterGoal = localStorage.getItem('mindboost_water_goal');
        
        if (storedGameScores) setGameScores(JSON.parse(storedGameScores));
        if (storedWaterLogs) setWaterLogs(JSON.parse(storedWaterLogs));
        if (storedMeditationSessions) setMeditationSessions(JSON.parse(storedMeditationSessions));
        if (storedMusicTracks) setMusicTracks(JSON.parse(storedMusicTracks));
        if (storedWaterGoal) setDailyWaterGoal(JSON.parse(storedWaterGoal));
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
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
    localStorage.setItem('mindboost_music_tracks', JSON.stringify(musicTracks));
  }, [musicTracks]);
  
  useEffect(() => {
    localStorage.setItem('mindboost_water_goal', JSON.stringify(dailyWaterGoal));
  }, [dailyWaterGoal]);

  // Game score methods with Supabase integration
  const addMatchingGameScore = async (score: number, attempts: number, duration: number) => {
    const newScore: MatchingGameScore = {
      gameType: 'matching',
      timestamp: Date.now(),
      userId,
      score,
      attempts,
      duration
    };
    
    setGameScores(prev => [...prev, newScore]);
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await saveGameScore(newScore);
      } catch (error) {
        console.error('Error saving matching game score to Supabase:', error);
      }
    }
  };

  const addNumberRecallScore = async (identifiedCount: number, totalCount: number, duration: number, userComments?: string) => {
    const newScore: NumberRecallGameScore = {
      gameType: 'number-recall',
      timestamp: Date.now(),
      userId,
      identifiedCount,
      totalCount,
      duration,
      userComments
    };
    
    setGameScores(prev => [...prev, newScore]);
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await saveGameScore(newScore);
      } catch (error) {
        console.error('Error saving number recall score to Supabase:', error);
      }
    }
  };

  const addObjectSequencingScore = async (isCorrect: boolean, attempts: number, duration: number) => {
    const newScore: ObjectSequencingGameScore = {
      gameType: 'object-sequencing',
      timestamp: Date.now(),
      userId,
      isCorrect,
      attempts,
      duration
    };
    
    setGameScores(prev => [...prev, newScore]);
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await saveGameScore(newScore);
      } catch (error) {
        console.error('Error saving object sequencing score to Supabase:', error);
      }
    }
  };

  const addStroopTestScore = async (row: number, column: number, duration: number) => {
    const newScore: StroopTestGameScore = {
      gameType: 'stroop-test',
      timestamp: Date.now(),
      userId,
      row,
      column,
      duration
    };
    
    setGameScores(prev => [...prev, newScore]);
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await saveGameScore(newScore);
      } catch (error) {
        console.error('Error saving stroop test score to Supabase:', error);
      }
    }
  };

  const getGameScoresByType = (gameType: string) => {
    return gameScores.filter(score => score.gameType === gameType);
  };

  const getRecentGameScores = (gameType: string, limit: number = 5) => {
    return gameScores
      .filter(score => score.gameType === gameType && score.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  };

  // Water tracking methods
  const addWaterLog = (amount: number) => {
    setWaterLogs(prev => [...prev, { timestamp: Date.now(), userId, amount }]);
  };

  // Helper to get start of today's date in milliseconds
  const getStartOfToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  };

  // Helper to get start of a specific day
  const getStartOfDay = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const getTotalWaterToday = () => {
    const startOfToday = getStartOfToday();
    return waterLogs
      .filter(log => log.timestamp >= startOfToday && log.userId === userId)
      .reduce((total, log) => total + log.amount, 0);
  };

  const getWaterPercentage = () => {
    const totalWater = getTotalWaterToday();
    return Math.min(100, Math.round((totalWater / dailyWaterGoal) * 100));
  };

  const getWaterLogsByDateRange = (startDate: number, endDate: number) => {
    return waterLogs.filter(
      log => log.timestamp >= startDate && 
             log.timestamp <= endDate && 
             log.userId === userId
    );
  };

  // Meditation tracking methods
  const addMeditationSession = (duration: number, concentrationImprovement?: number) => {
    setMeditationSessions(prev => [
      ...prev, 
      { 
        timestamp: Date.now(), 
        userId, 
        duration,
        concentrationImprovement 
      }
    ]);
  };

  const getMeditationMinutesToday = () => {
    const startOfToday = getStartOfToday();
    const totalSeconds = meditationSessions
      .filter(session => session.timestamp >= startOfToday && session.userId === userId)
      .reduce((total, session) => total + session.duration, 0);
    
    return Math.round(totalSeconds / 60);
  };

  const getMeditationSessionsByDateRange = (startDate: number, endDate: number) => {
    return meditationSessions.filter(
      session => session.timestamp >= startDate && 
                 session.timestamp <= endDate &&
                 session.userId === userId
    );
  };

  // Music tracking methods
  const addBuiltInMusicTrack = async (id: string, title: string, artist: string, filePath: string) => {
    const newTrack: MusicTrack = {
      id,
      title,
      artist,
      isBuiltIn: true,
      filePath
    };
    
    // Only add if it doesn't exist already
    if (!musicTracks.some(track => track.id === id)) {
      setMusicTracks(prev => [...prev, newTrack]);
    }
  };

  const addUserMusicTrack = async (title: string, filePath: string, file?: File) => {
    const newTrack: MusicTrack = {
      id: `user-${Date.now()}`,
      title,
      isBuiltIn: false,
      filePath,
      userId,
      uploadTime: new Date().toISOString()
    };
    
    setMusicTracks(prev => [...prev, newTrack]);
    
    // Upload to Supabase if user is authenticated and file provided
    if (user && file) {
      try {
        await uploadUserMusicTrack(userId, title, file);
      } catch (error) {
        console.error('Error uploading user music track to Supabase:', error);
      }
    }
  };

  // Progress analysis methods
  const getDailyProgressSummary = () => {
    const startOfToday = getStartOfToday();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
    
    const todayGameScores = gameScores.filter(
      score => score.timestamp >= startOfToday && 
               score.timestamp <= endOfToday &&
               score.userId === userId
    );
    
    return {
      date: startOfToday,
      gameScoresCount: todayGameScores.length,
      meditationMinutes: getMeditationMinutesToday(),
      waterPercentage: getWaterPercentage()
    };
  };

  const getWeeklyProgressHistory = () => {
    const result = [];
    const today = new Date();
    
    // Get data for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const startOfDay = date.getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
      
      const dayGameScores = gameScores.filter(
        score => score.timestamp >= startOfDay && 
                 score.timestamp <= endOfDay &&
                 score.userId === userId
      );
      
      const dayMeditationSessions = meditationSessions.filter(
        session => session.timestamp >= startOfDay && 
                   session.timestamp <= endOfDay &&
                   session.userId === userId
      );
      
      const dayWaterLogs = waterLogs.filter(
        log => log.timestamp >= startOfDay && 
               log.timestamp <= endOfDay &&
               log.userId === userId
      );
      
      const totalMeditationSeconds = dayMeditationSessions.reduce(
        (total, session) => total + session.duration, 0
      );
      
      const totalWater = dayWaterLogs.reduce(
        (total, log) => total + log.amount, 0
      );
      
      result.push({
        date: startOfDay,
        gameScoresCount: dayGameScores.length,
        meditationMinutes: Math.round(totalMeditationSeconds / 60),
        waterPercentage: Math.min(100, Math.round((totalWater / dailyWaterGoal) * 100))
      });
    }
    
    return result;
  };

  // Fetch game scores from Supabase when user changes
  useEffect(() => {
    const fetchGameScores = async () => {
      if (!user) return;
      
      try {
        // Fetch all game types
        const matchingScores = await getGameScoresByType('matching', userId);
        const numberRecallScores = await getGameScoresByType('number-recall', userId);
        const objectSequencingScores = await getGameScoresByType('object-sequencing', userId);
        const stroopTestScores = await getGameScoresByType('stroop-test', userId);
        
        // Process and combine the scores
        const allScores = [
          ...matchingScores,
          ...numberRecallScores,
          ...objectSequencingScores,
          ...stroopTestScores
        ].map(dbScore => {
          const gameType = dbScore.game_type;
          const score = dbScore.score;
          const base = {
            timestamp: new Date(dbScore.created_at).getTime(),
            userId: dbScore.user_id,
            duration: score.duration || 0
          };
          
          switch (gameType) {
            case 'matching':
              return {
                ...base, 
                gameType: 'matching' as const,
                score: score.score,
                attempts: score.attempts
              };
            case 'number-recall':
              return {
                ...base, 
                gameType: 'number-recall' as const,
                identifiedCount: score.identifiedCount,
                totalCount: score.totalCount,
                userComments: dbScore.comments
              };
            case 'object-sequencing':
              return {
                ...base, 
                gameType: 'object-sequencing' as const,
                isCorrect: score.isCorrect,
                attempts: score.attempts
              };
            case 'stroop-test':
              return {
                ...base, 
                gameType: 'stroop-test' as const,
                row: score.row,
                column: score.column
              };
            default:
              return null;
          }
        }).filter(Boolean) as GameScore[];
        
        setGameScores(allScores);
      } catch (error) {
        console.error('Error fetching game scores from Supabase:', error);
      }
    };
    
    fetchGameScores();
  }, [user, userId]);

  // Fetch music tracks from Supabase when user changes
  useEffect(() => {
    const fetchMusicTracks = async () => {
      try {
        const tracks = await getAllMusicTracks();
        setMusicTracks(tracks);
      } catch (error) {
        console.error('Error fetching music tracks from Supabase:', error);
      }
    };
    
    fetchMusicTracks();
  }, [user]);

  const getAllMusicTracksFromState = () => {
    return [
      ...musicTracks.filter(track => track.isBuiltIn),
      ...musicTracks.filter(track => !track.isBuiltIn && track.userId === userId)
    ];
  };

  const getUserMusicTracksFromState = () => {
    return musicTracks.filter(track => !track.isBuiltIn && track.userId === userId);
  };

  const value = {
    // Game methods
    gameScores,
    addMatchingGameScore,
    addNumberRecallScore,
    addObjectSequencingScore,
    addStroopTestScore,
    getGameScoresByType,
    getRecentGameScores,
    
    // Water tracking
    waterLogs,
    dailyWaterGoal,
    setDailyWaterGoal,
    addWaterLog,
    getTotalWaterToday,
    getWaterPercentage,
    getWaterLogsByDateRange,
    
    // Meditation tracking
    meditationSessions,
    addMeditationSession,
    getMeditationMinutesToday,
    getMeditationSessionsByDateRange,
    
    // Music tracking
    musicTracks,
    addBuiltInMusicTrack,
    addUserMusicTrack,
    getAllMusicTracks: getAllMusicTracksFromState,
    getUserMusicTracks: getUserMusicTracksFromState,
    
    // Progress analysis
    getDailyProgressSummary,
    getWeeklyProgressHistory
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};
