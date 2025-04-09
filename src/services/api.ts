
import { supabase } from '@/lib/supabase';

// Profile types
export type Profile = {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

// Activity log types
export type ActivityType = 'memory_game' | 'water_intake' | 'meditation';
export type ActivityLog = {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_data: any;
  score?: number;
  duration?: number;
  created_at: string;
};

// Water log types
export type WaterLog = {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
};

// User settings types
export type UserSettings = {
  id: string;
  user_id: string;
  daily_water_goal: number;
  meditation_reminder: boolean;
  reminder_time?: string;
  created_at: string;
  updated_at: string;
};

// Meditation session types
export type MeditationSession = {
  id: string;
  user_id: string;
  duration: number;
  meditation_type?: string;
  notes?: string;
  created_at: string;
};

// Check if Supabase is configured before making API calls
const checkSupabase = () => {
  return true; // Always true since we're using the configured client
};

// Profile functions
export const getProfile = async (): Promise<Profile | null> => {
  if (!checkSupabase()) return null;
  
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();
    
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
};

export const updateProfile = async (updates: Partial<Profile>): Promise<Profile | null> => {
  if (!checkSupabase()) return null;
  
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.user.id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return data;
};

// Activity log functions
export const logActivity = async (
  activity_type: ActivityType,
  activity_data: any,
  score?: number,
  duration?: number
): Promise<ActivityLog | null> => {
  if (!checkSupabase()) return null;
  
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user.user.id,
      activity_type,
      activity_data,
      score,
      duration,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error logging activity:', error);
    return null;
  }
  
  return data;
};

export const getActivityLogs = async (
  activity_type?: ActivityType,
  start_date?: string,
  end_date?: string
): Promise<ActivityLog[]> => {
  if (!checkSupabase()) return [];
  
  const { data: user } = await supabase!.auth.getUser();
  
  if (!user.user) return [];
  
  let query = supabase!
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });
    
  if (activity_type) {
    query = query.eq('activity_type', activity_type);
  }
  
  if (start_date) {
    query = query.gte('created_at', start_date);
  }
  
  if (end_date) {
    query = query.lte('created_at', end_date);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
  
  return data || [];
};

// Water log functions
export const logWaterIntake = async (amount: number): Promise<WaterLog | null> => {
  if (!checkSupabase()) return null;
  
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data, error } = await supabase
    .from('water_logs')
    .insert({
      user_id: user.user.id,
      amount,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error logging water intake:', error);
    return null;
  }
  
  return data;
};

export const getWaterLogs = async (date?: string): Promise<WaterLog[]> => {
  if (!checkSupabase()) return [];
  
  const { data: user } = await supabase!.auth.getUser();
  
  if (!user.user) return [];
  
  let query = supabase!
    .from('water_logs')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });
    
  if (date) {
    // Filter to specific date
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);
    
    query = query
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching water logs:', error);
    return [];
  }
  
  return data || [];
};

// User settings functions
export const getUserSettings = async (): Promise<UserSettings | null> => {
  if (!checkSupabase()) return null;
  
  const { data: user } = await supabase!.auth.getUser();
  
  if (!user.user) return null;
  
  const { data, error } = await supabase!
    .from('user_settings')
    .select('*')
    .eq('user_id', user.user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching user settings:', error);
    return null;
  }
  
  if (!data) {
    // Create default settings if none exist
    return createDefaultUserSettings();
  }
  
  return data;
};

export const createDefaultUserSettings = async (): Promise<UserSettings | null> => {
  if (!checkSupabase()) return null;
  
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: user.user.id,
      daily_water_goal: 2000,
      meditation_reminder: false,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating user settings:', error);
    return null;
  }
  
  return data;
};

export const updateUserSettings = async (updates: Partial<UserSettings>): Promise<UserSettings | null> => {
  if (!checkSupabase()) return null;
  
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data, error } = await supabase
    .from('user_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.user.id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating user settings:', error);
    return null;
  }
  
  return data;
};

// Meditation session functions
export const logMeditationSession = async (
  duration: number,
  meditation_type?: string,
  notes?: string
): Promise<MeditationSession | null> => {
  if (!checkSupabase()) return null;
  
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return null;
  
  const { data, error } = await supabase
    .from('meditation_sessions')
    .insert({
      user_id: user.user.id,
      duration,
      meditation_type,
      notes,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error logging meditation session:', error);
    return null;
  }
  
  return data;
};

export const getMeditationSessions = async (start_date?: string, end_date?: string): Promise<MeditationSession[]> => {
  if (!checkSupabase()) return [];
  
  const { data: user } = await supabase!.auth.getUser();
  
  if (!user.user) return [];
  
  let query = supabase!
    .from('meditation_sessions')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });
    
  if (start_date) {
    query = query.gte('created_at', start_date);
  }
  
  if (end_date) {
    query = query.lte('created_at', end_date);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching meditation sessions:', error);
    return [];
  }
  
  return data || [];
};

// Report generation functions
export const getDailyWaterSummary = async (date?: string): Promise<number> => {
  if (!checkSupabase()) return 0;
  
  const logs = await getWaterLogs(date || new Date().toISOString().split('T')[0]);
  return logs.reduce((total, log) => total + log.amount, 0);
};

export const getWeeklyActivitySummary = async (): Promise<{
  [key: string]: {
    count: number;
    totalScore?: number;
    totalDuration?: number;
  };
}> => {
  if (!checkSupabase()) {
    return {
      'memory_game': { count: 0, totalScore: 0 },
      'meditation': { count: 0, totalDuration: 0 }
    };
  }
  
  // Calculate date from 7 days ago
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const activities = await getActivityLogs(
    undefined,
    sevenDaysAgo.toISOString(),
    today.toISOString()
  );
  
  const summary: {
    [key: string]: {
      count: number;
      totalScore?: number;
      totalDuration?: number;
    };
  } = {};
  
  activities.forEach(activity => {
    if (!summary[activity.activity_type]) {
      summary[activity.activity_type] = {
        count: 0,
        totalScore: 0,
        totalDuration: 0,
      };
    }
    
    summary[activity.activity_type].count += 1;
    
    if (activity.score !== undefined) {
      summary[activity.activity_type].totalScore = 
        (summary[activity.activity_type].totalScore || 0) + activity.score;
    }
    
    if (activity.duration !== undefined) {
      summary[activity.activity_type].totalDuration = 
        (summary[activity.activity_type].totalDuration || 0) + activity.duration;
    }
  });
  
  return summary;
};

export const getTotalMeditationTime = async (timeframe: 'day' | 'week' | 'month'): Promise<number> => {
  if (!checkSupabase()) return 0;
  
  const today = new Date();
  let startDate = new Date();
  
  if (timeframe === 'day') {
    startDate.setUTCHours(0, 0, 0, 0);
  } else if (timeframe === 'week') {
    startDate.setDate(today.getDate() - 7);
  } else if (timeframe === 'month') {
    startDate.setMonth(today.getMonth() - 1);
  }
  
  const sessions = await getMeditationSessions(startDate.toISOString(), today.toISOString());
  
  return sessions.reduce((total, session) => total + session.duration, 0);
};
