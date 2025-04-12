
import { supabase as originalSupabase } from "./client";
import { Database } from "./types";

// Create a properly typed wrapper for our Supabase client
const supabase = {
  ...originalSupabase,
  // Ensure table methods are properly typed
  from: <T extends keyof Database["public"]["Tables"]>(table: T) => {
    return originalSupabase.from(table);
  },
  storage: originalSupabase.storage
};

// Function to check if storage bucket exists and create if needed
export const ensureMusicStorageBucket = async () => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return;
    }
    
    const musicBucketExists = buckets.some(bucket => bucket.name === 'music');
    
    if (!musicBucketExists) {
      console.log("Creating music storage bucket");
      const { error: createError } = await supabase.storage.createBucket('music', {
        public: true,
        fileSizeLimit: 10485760, // 10MB limit
        allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm']
      });
      
      if (createError) {
        console.error("Error creating music bucket:", createError);
      } else {
        console.log("Successfully created music bucket");
      }
    } else {
      console.log("Music bucket already exists");
    }
  } catch (e) {
    console.error("Error in ensureMusicStorageBucket:", e);
  }
};

// Initialize storage - call this when app starts
ensureMusicStorageBucket();

export { supabase };
