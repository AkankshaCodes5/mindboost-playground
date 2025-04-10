
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

// Convert db track to client format
const convertDbTrackToClientFormat = (track: any): MusicTrack => {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    isBuiltIn: track.is_built_in,
    filePath: track.file_path,
    userId: track.user_id,
    uploadTime: track.upload_time
  };
};

// Get all music tracks (built-in and user uploaded)
export const getAllMusicTracks = async (): Promise<MusicTrack[]> => {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .order('title');
      
    if (error) throw error;
    
    return data.map(convertDbTrackToClientFormat);
  } catch (error) {
    console.error('Error fetching music tracks:', error);
    throw error;
  }
};

// Get user uploaded music tracks
export const getUserMusicTracks = async (userId: string): Promise<MusicTrack[]> => {
  try {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_built_in', false)
      .order('upload_time', { ascending: false });
      
    if (error) throw error;
    
    return data.map(convertDbTrackToClientFormat);
  } catch (error) {
    console.error('Error fetching user music tracks:', error);
    throw error;
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

// Upload user music track
export const uploadUserMusicTrack = async (userId: string, title: string, file: File) => {
  try {
    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('music')
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    // 2. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('music')
      .getPublicUrl(fileName);
      
    const filePath = publicUrlData.publicUrl;
    
    // 3. Create record in music_tracks table
    const { data: trackData, error: trackError } = await supabase
      .from('music_tracks')
      .insert({
        title,
        is_built_in: false,
        file_path: filePath,
        user_id: userId
      });
      
    if (trackError) throw trackError;
    
    return trackData;
  } catch (error) {
    console.error('Error uploading user music track:', error);
    throw error;
  }
};

// Delete user music track
export const deleteUserMusicTrack = async (trackId: string, userId: string) => {
  try {
    // 1. Get track info
    const { data: trackData, error: fetchError } = await supabase
      .from('music_tracks')
      .select('file_path')
      .eq('id', trackId)
      .eq('user_id', userId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // 2. Delete from storage if it's stored in our bucket
    if (trackData && trackData.file_path && trackData.file_path.includes('music')) {
      const filePath = trackData.file_path.split('/').slice(-2).join('/');
      
      const { error: deleteFileError } = await supabase.storage
        .from('music')
        .remove([filePath]);
        
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
