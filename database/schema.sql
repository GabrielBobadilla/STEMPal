-- Supabase PostgreSQL Schema for STEMPal
-- Run this in the Supabase SQL Editor

-- Users table (profiles - extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fullname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  profile_picture TEXT,
  theme_preference TEXT CHECK (theme_preference IN ('light', 'dark', NULL)),
  notification_enabled BOOLEAN DEFAULT TRUE,
  grade_level TEXT,
  school TEXT,
  stem_strand TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, fullname, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'fullname', ''),
    NEW.email
  );
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_active_date)
  VALUES (NEW.id, 0, 0, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Preferences
CREATE TABLE IF NOT EXISTS preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subjects JSONB DEFAULT '[]',
  hobbies JSONB DEFAULT '[]',
  learning_style TEXT,
  study_duration TEXT DEFAULT '25min',
  preferred_break JSONB DEFAULT '[]',
  study_goals TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  source TEXT DEFAULT 'ai',
  difficulty TEXT DEFAULT 'medium',
  tags JSONB DEFAULT '[]',
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Reviewers
CREATE TABLE IF NOT EXISTS generated_reviewers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  reviewer_type TEXT DEFAULT 'basic',
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDF Uploads
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT,
  file_size INTEGER,
  file_path TEXT,
  extracted_text TEXT,
  ocr_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  quiz_type TEXT,
  questions JSONB,
  answers JSONB,
  score NUMERIC DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_taken INTEGER DEFAULT 0,
  difficulty TEXT,
  weak_topics JSONB DEFAULT '[]',
  strong_topics JSONB DEFAULT '[]',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  is_favorite BOOLEAN DEFAULT FALSE,
  mastery_level INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study History
CREATE TABLE IF NOT EXISTS study_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity TEXT,
  activity_type TEXT,
  duration INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Break Recommendations
CREATE TABLE IF NOT EXISTS break_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation TEXT,
  reason TEXT,
  benefits JSONB DEFAULT '[]',
  duration INTEGER DEFAULT 5,
  study_time INTEGER DEFAULT 0,
  focus_level TEXT DEFAULT 'medium',
  is_taken BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE IF NOT EXISTS streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date TEXT,
  UNIQUE(user_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_type TEXT,
  description TEXT,
  unlocked_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'study_reminder',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP Log
CREATE TABLE IF NOT EXISTS xp_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp_earned INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Levels
CREATE TABLE IF NOT EXISTS levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level INTEGER NOT NULL,
  level_name TEXT NOT NULL,
  min_xp INTEGER NOT NULL,
  max_xp INTEGER NOT NULL
);

-- Insert default levels
INSERT INTO levels (level, level_name, min_xp, max_xp) VALUES
  (1, 'Beginner', 0, 99),
  (2, 'Apprentice', 100, 299),
  (3, 'Scholar', 300, 599),
  (4, 'Expert', 600, 999),
  (5, 'Master', 1000, 1499),
  (6, 'Sage', 1500, 2499),
  (7, 'STEM Legend', 2500, 99999)
ON CONFLICT DO NOTHING;

-- Crossword Puzzles
CREATE TABLE IF NOT EXISTS crossword_puzzles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_data JSONB,
  difficulty TEXT,
  score NUMERIC DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  completed_words INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  time_taken INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Focus Scores
CREATE TABLE IF NOT EXISTS focus_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  session_type TEXT DEFAULT 'study',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pomodoro Sessions
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  study_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  sessions_completed INTEGER DEFAULT 1,
  mode TEXT DEFAULT 'traditional',
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiplayer Rooms
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'General',
  difficulty TEXT DEFAULT 'medium',
  max_players INTEGER DEFAULT 4,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiplayer Participants
CREATE TABLE IF NOT EXISTS multiplayer_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiplayer Quiz History
CREATE TABLE IF NOT EXISTS multiplayer_quiz_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_code TEXT,
  category TEXT,
  difficulty TEXT,
  score NUMERIC DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  rank INTEGER,
  total_players INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossword_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_quiz_history ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Generic user-owned table policies
DO $$ BEGIN
  -- Preferences
  CREATE POLICY "own preferences" ON preferences FOR ALL USING (auth.uid() = user_id);
  -- Notes
  CREATE POLICY "own notes" ON notes FOR ALL USING (auth.uid() = user_id);
  -- Generated Reviewers
  CREATE POLICY "own reviewers" ON generated_reviewers FOR ALL USING (auth.uid() = user_id);
  -- PDF Uploads
  CREATE POLICY "own pdfs" ON pdf_uploads FOR ALL USING (auth.uid() = user_id);
  -- Quizzes
  CREATE POLICY "own quizzes" ON quizzes FOR ALL USING (auth.uid() = user_id);
  -- Flashcards
  CREATE POLICY "own flashcards" ON flashcards FOR ALL USING (auth.uid() = user_id);
  -- Study History
  CREATE POLICY "own study history" ON study_history FOR ALL USING (auth.uid() = user_id);
  -- Break Recommendations
  CREATE POLICY "own breaks" ON break_recommendations FOR ALL USING (auth.uid() = user_id);
  -- Streaks
  CREATE POLICY "own streaks" ON streaks FOR ALL USING (auth.uid() = user_id);
  -- Achievements
  CREATE POLICY "own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);
  -- Notifications
  CREATE POLICY "own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
  -- XP Log
  CREATE POLICY "own xp_log" ON xp_log FOR ALL USING (auth.uid() = user_id);
  -- Crossword Puzzles
  CREATE POLICY "own crosswords" ON crossword_puzzles FOR ALL USING (auth.uid() = user_id);
  -- Focus Scores
  CREATE POLICY "own focus" ON focus_scores FOR ALL USING (auth.uid() = user_id);
  -- Pomodoro Sessions
  CREATE POLICY "own pomodoro" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);
  -- Multiplayer Rooms
  CREATE POLICY "rooms" ON multiplayer_rooms FOR ALL USING (TRUE);
  -- Multiplayer Participants
  CREATE POLICY "participants" ON multiplayer_participants FOR ALL USING (TRUE);
  -- Multiplayer Quiz History
  CREATE POLICY "own multiplayer history" ON multiplayer_quiz_history FOR ALL USING (auth.uid() = user_id);
  -- Levels (public read)
  CREATE POLICY "public levels" ON levels FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_study_history_user ON study_history(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_log_user ON xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_user ON preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_user ON pdf_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reviewers_user ON generated_reviewers(user_id);
CREATE INDEX IF NOT EXISTS idx_crossword_puzzles_user ON crossword_puzzles(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_scores_user ON focus_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_rooms_code ON multiplayer_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_multiplayer_participants_room ON multiplayer_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_multiplayer_quiz_history_user ON multiplayer_quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_break_recommendations_user ON break_recommendations(user_id);
