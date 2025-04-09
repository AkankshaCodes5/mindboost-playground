
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profiles" 
  ON profiles FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  activity_type text NOT NULL,
  activity_data jsonb,
  score int,
  duration int,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activity logs" 
  ON activity_logs FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity logs" 
  ON activity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create water_logs table
CREATE TABLE IF NOT EXISTS water_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  amount int NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own water logs" 
  ON water_logs FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own water logs" 
  ON water_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  daily_water_goal int DEFAULT 2000,
  meditation_reminder boolean DEFAULT false,
  reminder_time time,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own settings" 
  ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" 
  ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" 
  ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create meditation_sessions table
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  duration int NOT NULL,
  meditation_type text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own meditation sessions" 
  ON meditation_sessions FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meditation sessions" 
  ON meditation_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
