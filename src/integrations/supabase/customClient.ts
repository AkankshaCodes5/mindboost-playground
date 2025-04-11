
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

export { supabase };
