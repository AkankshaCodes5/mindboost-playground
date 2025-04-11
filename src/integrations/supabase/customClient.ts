
import { supabase as originalSupabase } from "./client";
import { Database } from "./types";

// Define the expected structure more explicitly
type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
type TablesRow<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

// Custom wrapper to enable accessing the tables with proper types
const supabase = {
  ...originalSupabase,
  from: <T extends keyof Database["public"]["Tables"]>(table: T) => {
    return originalSupabase.from(table);
  },
  storage: originalSupabase.storage
};

export { supabase };
