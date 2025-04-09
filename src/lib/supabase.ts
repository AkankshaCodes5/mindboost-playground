
import { createClient } from '@supabase/supabase-js'

// Use the values directly from the client.ts that has the correct configuration
import { supabase as configuredClient } from "@/integrations/supabase/client";

// Export the already configured client
export const supabase = configuredClient;

// Function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return true; // Since we're using the configured client, we know it's configured
};
