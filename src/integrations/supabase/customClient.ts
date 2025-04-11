
import { supabase as originalSupabase } from "./client";

// Custom wrapper to enable accessing the new tables we've added
// This is a workaround for TypeScript errors until types.ts gets updated
const supabase = {
  ...originalSupabase,
  from: (table: string) => originalSupabase.from(table as any),
  storage: originalSupabase.storage
};

export { supabase };
