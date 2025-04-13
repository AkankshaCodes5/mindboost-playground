
import { supabase } from "@/integrations/supabase/customClient";

export type MusicTrack = {
  id: string;
  title: string;
  artist?: string;
  isBuiltIn: boolean;
  filePath: string;
  userId?: string;
  uploadTime?: string;
  duration?: string; // Optional duration property
};

// Enhanced type guard to ensure database results are valid
const isValidData = (data: unknown): data is Record<string, any>[] => {
  return Array.isArray(data) && data.every(item => item && typeof item === 'object');
};

// Convert db track to client format with type safety
const convertDbTrackToClientFormat = (track: Record<string, any>): MusicTrack => {
  return {
    id: track.id || '',
    title: track.title || '',
    artist: track.artist,
    isBuiltIn: Boolean(track.is_built_in),
    filePath: track.file_path || '',
    userId: track.user_id,
    uploadTime: track.upload_time,
    duration: track.duration || '3:45' // Default duration
  };
};

// Get all music tracks (built-in and user uploaded)
export const getAllMusicTracks = async (): Promise<MusicTrack[]> => {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*');
      
    if (error) throw error;
    
    if (!isValidData(data)) {
      console.log('No valid music track data returned');
      return getDefaultTracks();
    }
    
    const tracks = data.map(convertDbTrackToClientFormat);
    console.log('Fetched tracks from DB:', tracks);
    
    if (tracks.length === 0) {
      console.log('No tracks found in DB, using defaults');
      return getDefaultTracks();
    }
    
    return tracks;
  } catch (error) {
    console.error('Error fetching music tracks:', error);
    return getDefaultTracks();
  }
};

// Return default tracks if database fails - using mp3 files with proper CORS headers
export const getDefaultTracks = (): MusicTrack[] => {
  const defaultTracks: MusicTrack[] = [
    {
      id: 'default-1',
      title: 'Calm Waters',
      artist: 'Nature Sounds',
      isBuiltIn: true,
      filePath: 'https://assets.mixkit.co/music/preview/mixkit-calming-rain-with-thunder-1262.mp3',
      duration: '3:45'
    },
    {
      id: 'default-2',
      title: 'Forest Meditation',
      artist: 'Nature Sounds',
      isBuiltIn: true,
      filePath: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-122.mp3',
      duration: '4:12'
    },
    {
      id: 'default-3',
      title: 'Deep Focus',
      artist: 'Binaural Beats',
      isBuiltIn: true,
      filePath: 'https://assets.mixkit.co/music/preview/mixkit-gatwick-6488.mp3',
      duration: '5:30'
    },
    {
      id: 'default-4',
      title: 'Dream State',
      artist: 'Binaural Beats',
      isBuiltIn: true,
      filePath: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-122.mp3',
      duration: '3:20'
    },
    {
      id: 'default-5',
      title: 'Ocean Waves',
      artist: 'Nature Sounds',
      isBuiltIn: true,
      filePath: 'https://assets.mixkit.co/music/preview/mixkit-valley-sunset-127.mp3',
      duration: '4:45'
    },
    {
      id: 'default-6',
      title: 'Rainfall Ambience',
      artist: 'Nature Sounds',
      isBuiltIn: true,
      filePath: 'https://assets.mixkit.co/music/preview/mixkit-calming-rain-with-thunder-1262.mp3',
      duration: '5:10'
    }
  ];
  
  console.log('Using default tracks:', defaultTracks);
  return defaultTracks;
};

// Get user uploaded music tracks
export const getUserMusicTracks = async (userId: string): Promise<MusicTrack[]> => {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_built_in', false);
      
    if (error) throw error;
    
    if (!isValidData(data)) {
      return [];
    }
    
    return data.map(convertDbTrackToClientFormat);
  } catch (error) {
    console.error('Error fetching user music tracks:', error);
    return [];
  }
};

// Add built-in music track
export const addBuiltInMusicTrack = async (title: string, artist: string, filePath: string) => {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .insert({
        title,
        artist,
        is_built_in: true,
        file_path: filePath
      });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding built-in music track:', error);
    throw error;
  }
};

// Upload user music track with improved type safety and error handling
export const uploadUserMusicTrack = async (userId: string, title: string, file: File) => {
  try {
    // Check file type
    if (!file.type.startsWith('audio/')) {
      throw new Error('File must be an audio file');
    }
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('music')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) throw uploadError;
    
    // 2. Get public URL safely
    const { data: publicUrlData } = supabase.storage
      .from('music')
      .getPublicUrl(fileName);
      
    // Safely access the URL with type checking
    const filePath = publicUrlData?.publicUrl || '';
    
    if (!filePath) {
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    // 3. Create record in music_tracks table
    const { data: trackData, error: trackError } = await supabase
      .from('music_tracks')
      .insert({
        title,
        is_built_in: false,
        file_path: filePath,
        user_id: userId,
        upload_time: new Date().toISOString()
      });
      
    if (trackError) throw trackError;
    
    return trackData;
  } catch (error) {
    console.error('Error uploading user music track:', error);
    throw error;
  }
};

// Delete user music track with improved type safety
export const deleteUserMusicTrack = async (trackId: string, userId: string) => {
  try {
    // 1. Get track info
    const { data: trackData, error: fetchError } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('id', trackId)
      .eq('user_id', userId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    if (!trackData || typeof trackData !== 'object') {
      throw new Error('Track not found');
    }
    
    // Safely access file_path with proper type checking
    const filePath = trackData.file_path as string || '';
    
    // 2. Delete from storage if it's stored in our bucket
    if (filePath && typeof filePath === 'string' && filePath.includes('music')) {
      const storageFilePath = filePath.split('/').slice(-2).join('/');
      
      const { error: deleteFileError } = await supabase.storage
        .from('music')
        .remove([storageFilePath]);
        
      if (deleteFileError) console.error('Could not delete file from storage', deleteFileError);
    }
    
    // 3. Delete from database
    const { error: deleteTrackError } = await supabase
      .from('music_tracks')
      .delete()
      .eq('id', trackId)
      .eq('user_id', userId);
      
    if (deleteTrackError) throw deleteTrackError;
    
    return true;
  } catch (error) {
    console.error('Error deleting user music track:', error);
    throw error;
  }
};
