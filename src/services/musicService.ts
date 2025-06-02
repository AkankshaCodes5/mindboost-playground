import { supabase } from "@/integrations/supabase/customClient";

export type MusicTrack = {
  id: string;
  title: string;
  artist?: string;
  isBuiltIn: boolean;
  filePath: string;
  userId?: string;
  uploadTime?: string;
  duration?: string;
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
    duration: track.duration || '3:45'
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

// Return default tracks with working and tested audio URLs
export const getDefaultTracks = (): MusicTrack[] => {
  const defaultTracks: MusicTrack[] = [
    {
      id: 'default-1',
      title: 'Peaceful Piano',
      artist: 'Relaxation Music',
      isBuiltIn: true,
      filePath: 'https://www.kozco.com/tech/piano2.wav',
      duration: '0:33'
    },
    {
      id: 'default-2',
      title: 'Sample Audio',
      artist: 'Demo Track',
      isBuiltIn: true,
      filePath: 'https://file-examples.com/storage/fe68c42b8fc9315f4e9eace/2017/11/file_example_WAV_1MG.wav',
      duration: '0:33'
    },
    {
      id: 'default-3',
      title: 'Kalimba',
      artist: 'Sample Music',
      isBuiltIn: true,
      filePath: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
      duration: '0:30'
    },
    {
      id: 'default-4',
      title: 'Nature Sounds',
      artist: 'Ambient Audio',
      isBuiltIn: true,
      filePath: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
      duration: '1:00'
    },
    {
      id: 'default-5',
      title: 'Relaxing Melody',
      artist: 'Calm Music',
      isBuiltIn: true,
      filePath: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: '0:03'
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

// Upload user music track with improved error handling and validation
export const uploadUserMusicTrack = async (userId: string, title: string, file: File) => {
  try {
    // Validate file type more strictly
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      throw new Error('Please upload a valid audio file (MP3, WAV, OGG, M4A, AAC)');
    }
    
    // Check file size (limit to 15MB for better compatibility)
    const maxSize = 15 * 1024 * 1024; // 15MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size exceeds 15MB limit');
    }
    
    // Validate title
    if (!title || title.trim().length === 0) {
      throw new Error('Please provide a track title');
    }
    
    // 1. Upload file to storage with better naming
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const fileName = `${userId}/${Date.now()}_${cleanTitle}.${fileExt}`;
    
    console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('music')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        duplex: 'half'
      });
      
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    console.log('Upload successful:', uploadData);
    
    // 2. Get public URL safely
    const { data: publicUrlData } = supabase.storage
      .from('music')
      .getPublicUrl(fileName);
      
    const filePath = publicUrlData?.publicUrl;
    
    if (!filePath) {
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    console.log('Public URL generated:', filePath);
    
    // 3. Create record in music_tracks table
    const { data: trackData, error: trackError } = await supabase
      .from('music_tracks')
      .insert({
        title: title.trim(),
        is_built_in: false,
        file_path: filePath,
        user_id: userId,
        upload_time: new Date().toISOString()
      })
      .select()
      .single();
      
    if (trackError) {
      console.error('Database insert error:', trackError);
      // Try to clean up uploaded file
      await supabase.storage.from('music').remove([fileName]);
      throw new Error(`Database error: ${trackError.message}`);
    }
    
    console.log('Track record created:', trackData);
    return trackData;
  } catch (error) {
    console.error('Error uploading user music track:', error);
    throw error;
  }
};

// Delete user music track with improved error handling
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
      throw new Error(`Track not found: ${fetchError.message}`);
    }
    
    if (!trackData || typeof trackData !== 'object') {
      throw new Error('Track not found or access denied');
    }
    
    const filePath = trackData.file_path as string || '';
    console.log('Deleting track:', trackData.title, 'File path:', filePath);
    
    // 2. Delete from storage if it's our uploaded file
    if (filePath && filePath.includes('/storage/v1/object/public/music/')) {
      try {
        const pathParts = filePath.split('/');
        const storageFilePath = pathParts.slice(-2).join('/'); // Get last two parts: userId/filename
        
        const { error: deleteFileError } = await supabase.storage
          .from('music')
          .remove([storageFilePath]);
          
        if (deleteFileError) {
          console.error('Could not delete file from storage:', deleteFileError);
        } else {
          console.log('File deleted from storage:', storageFilePath);
        }
      } catch (storageError) {
        console.error('Error processing storage deletion:', storageError);
      }
    }
    
    // 3. Delete from database
    const { error: deleteTrackError } = await supabase
      .from('music_tracks')
      .delete()
      .eq('id', trackId)
      .eq('user_id', userId);
      
    if (deleteTrackError) {
      throw new Error(`Failed to delete track: ${deleteTrackError.message}`);
    }
    
    console.log('Track deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting user music track:', error);
    throw error;
  }
};
