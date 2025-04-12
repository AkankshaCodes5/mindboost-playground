
import { supabase } from "@/integrations/supabase/customClient";

export type MusicTrack = {
  id: string;
  title: string;
  artist?: string;
  isBuiltIn: boolean;
  filePath: string;
  userId?: string;
  uploadTime?: string;
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
    uploadTime: track.upload_time
  };
};

// Default tracks that will be used if database tracks can't be loaded
export const getDefaultTracks = (): MusicTrack[] => {
  return [
    {
      id: 'default-1',
      title: 'Calm Waters',
      artist: 'Nature Sounds',
      isBuiltIn: true,
      filePath: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1baf.mp3?filename=calm-river-ambience-loop-125071.mp3',
    },
    {
      id: 'default-2',
      title: 'Forest Meditation',
      artist: 'Nature Sounds',
      isBuiltIn: true,
      filePath: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_82429925a9.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3',
    },
    {
      id: 'default-3',
      title: 'Deep Focus',
      artist: 'Binaural Beats',
      isBuiltIn: true,
      filePath: 'https://cdn.pixabay.com/download/audio/2021/11/13/audio_cb31ab7a71.mp3?filename=ambient-piano-ampamp-strings-10711.mp3',
    },
    {
      id: 'default-4',
      title: 'Dream State',
      artist: 'Binaural Beats',
      isBuiltIn: true,
      filePath: 'https://cdn.pixabay.com/download/audio/2021/04/08/audio_7ef676c9c8.mp3?filename=relaxing-mountains-rivers-amp-birds-singing-5816.mp3',
    }
  ];
};

// Check if a URL is valid
export const isValidAudioUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Pre-load audio to check if it's playable
export const checkAudioPlayable = async (url: string): Promise<boolean> => {
  return new Promise(resolve => {
    const audio = new Audio();
    audio.preload = "metadata";
    
    const onCanPlay = () => {
      cleanup();
      resolve(true);
    };
    
    const onError = () => {
      cleanup();
      resolve(false);
    };
    
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    
    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('error', onError);
    
    // Set timeout to prevent waiting too long
    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);
    
    audio.src = url;
    audio.load();
  });
};

// Get all music tracks (built-in and user uploaded)
export const getAllMusicTracks = async (): Promise<MusicTrack[]> => {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*');
      
    if (error) {
      console.error('Error fetching tracks from database:', error);
      return getDefaultTracks(); // Return default tracks if database fails
    }
    
    if (!isValidData(data) || data.length === 0) {
      console.log('No tracks found in database or invalid data format, using defaults');
      return getDefaultTracks();
    }
    
    const tracks = data.map(convertDbTrackToClientFormat);
    console.log('Fetched tracks successfully:', tracks);
    return tracks;
  } catch (error) {
    console.error('Exception fetching music tracks:', error);
    return getDefaultTracks();
  }
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
      })
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding built-in music track:', error);
    throw error;
  }
};

// Upload user music track with improved error handling
export const uploadUserMusicTrack = async (userId: string, title: string, file: File) => {
  try {
    console.log(`Uploading track "${title}" for user ${userId}`);
    
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    console.log(`Storage path: music/${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('music')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('File uploaded successfully:', uploadData);
    
    // 2. Get public URL safely
    const { data: publicUrlData } = await supabase.storage
      .from('music')
      .getPublicUrl(fileName);
      
    // Safely access the URL with type checking
    const filePath = publicUrlData?.publicUrl || '';
    
    console.log('Public URL:', filePath);
    
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
        user_id: userId
      })
      .select();
      
    if (trackError) {
      console.error('Database insert error:', trackError);
      throw trackError;
    }
    
    console.log('Track record created:', trackData);
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
      // Extract the storage path from the URL
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
