
import { supabase } from "@/integrations/supabase/customClient";

// Types for game scores
export type BaseGameScore = {
  gameType: 'matching' | 'number-recall' | 'object-sequencing' | 'stroop-test';
  userId: string;
  duration: number;
};

export type MatchingGameScore = BaseGameScore & {
  gameType: 'matching';
  score: number;
  attempts: number;
};

export type NumberRecallGameScore = BaseGameScore & {
  gameType: 'number-recall';
  identifiedCount: number;
  totalCount: number;
  userComments?: string;
};

export type ObjectSequencingGameScore = BaseGameScore & {
  gameType: 'object-sequencing';
  isCorrect: boolean;
  attempts: number;
};

export type StroopTestGameScore = BaseGameScore & {
  gameType: 'stroop-test';
  row: number;
  column: number;
};

export type GameScore = 
  | MatchingGameScore 
  | NumberRecallGameScore 
  | ObjectSequencingGameScore 
  | StroopTestGameScore;

// Convert client-side GameScore to database format
const convertGameScoreToDbFormat = (gameScore: GameScore) => {
  const { gameType, userId, duration, ...scoreData } = gameScore;
  
  return {
    user_id: userId,
    game_type: gameType,
    score: scoreData,
    comments: 'userComments' in scoreData ? scoreData.userComments : null
  };
};

// Type guard to ensure database results are valid
const isValidData = (data: unknown): data is Record<string, any>[] => {
  return Array.isArray(data) && data.every(item => item && typeof item === 'object');
};

// Save game score to Supabase
export const saveGameScore = async (gameScore: GameScore) => {
  try {
    const dbGameScore = convertGameScoreToDbFormat(gameScore);
    
    const { data, error } = await supabase
      .from('game_scores')
      .insert(dbGameScore);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving game score:', error);
    throw error;
  }
};

// Get game scores by type
export const getGameScoresByType = async (gameType: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .eq('game_type', gameType)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    if (!isValidData(data)) {
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching game scores:', error);
    throw error;
  }
};

// Get recent game scores
export const getRecentGameScores = async (gameType: string, userId: string, limit: number = 5) => {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .eq('game_type', gameType)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    if (!isValidData(data)) {
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching recent game scores:', error);
    throw error;
  }
};
