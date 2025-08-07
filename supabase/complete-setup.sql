-- Complete Database Setup Script for Quran Verse Challenge
-- This script combines all schemas and ensures proper table creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('learner', 'teacher', 'scholar');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quiz_session_status AS ENUM ('in_progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Core Application Tables
-- T002: Create users table with roles
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'learner' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- T006: Design verses table schema
CREATE TABLE IF NOT EXISTS verses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    surah INTEGER NOT NULL CHECK (surah >= 1 AND surah <= 114),
    ayah INTEGER NOT NULL CHECK (ayah >= 1),
    arabic_text TEXT NOT NULL,
    translation_en TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(surah, ayah)
);

-- T011: Design questions table schema
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    choices JSONB NOT NULL CHECK (jsonb_array_length(choices) >= 2),
    answer TEXT NOT NULL,
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- T012: Design attempts table schema  
CREATE TABLE IF NOT EXISTS attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    response_time_ms INTEGER DEFAULT 0,
    UNIQUE(user_id, question_id)
);

-- Create streaks table for progress tracking
CREATE TABLE IF NOT EXISTS streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Quiz Sessions for tracking active quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type TEXT DEFAULT 'daily' CHECK (session_type IN ('daily', 'practice', 'challenge')),
    status quiz_session_status DEFAULT 'in_progress',
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 10,
    current_question_index INTEGER DEFAULT 0,
    session_data JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_date DATE DEFAULT CURRENT_DATE UNIQUE,
    theme TEXT NOT NULL,
    description TEXT,
    question_ids JSONB NOT NULL, -- Array of question IDs
    difficulty_distribution JSONB DEFAULT '{"easy": 3, "medium": 5, "hard": 2}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_study_time_minutes INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    badges_earned JSONB DEFAULT '[]'::jsonb,
    achievements JSONB DEFAULT '{}'::jsonb,
    last_quiz_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- T015: Create audit logging system
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject', 'create', 'update', 'delete')),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scholar_id UUID REFERENCES users(id) ON DELETE CASCADE,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Group Management Tables
CREATE TABLE IF NOT EXISTS teacher_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_code TEXT UNIQUE NOT NULL,
    max_students INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES teacher_groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(group_id, student_id)
);

CREATE TABLE IF NOT EXISTS group_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES teacher_groups(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    question_ids JSONB NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    assignment_type TEXT DEFAULT 'quiz' CHECK (assignment_type IN ('quiz', 'practice', 'assessment')),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verses_surah_ayah ON verses(surah, ayah);
CREATE INDEX IF NOT EXISTS idx_verses_arabic_text ON verses USING gin(to_tsvector('arabic', arabic_text));
CREATE INDEX IF NOT EXISTS idx_questions_verse_id ON questions(verse_id);
CREATE INDEX IF NOT EXISTS idx_questions_approved_at ON questions(approved_at);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_answered_at ON attempts(answered_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_student_id ON group_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_group_assignments_group_id ON group_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_question_id ON audit_logs(question_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_scholar_id ON audit_logs(scholar_id);

-- Insert sample data
INSERT INTO verses (surah, ayah, arabic_text, translation_en) VALUES
(1, 1, 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ', 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'),
(1, 2, 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'All praise is due to Allah, Lord of the worlds.'),
(1, 3, 'الرَّحْمَـٰنِ الرَّحِيمِ', 'The Entirely Merciful, the Especially Merciful,'),
(1, 4, 'مَالِكِ يَوْمِ الدِّينِ', 'Sovereign of the Day of Recompense.'),
(2, 255, 'اللَّهُ لَا إِلَـٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', 'Allah - there is no deity except Him, the Ever-Living, the Self-Sustaining.')
ON CONFLICT (surah, ayah) DO NOTHING;

-- Insert sample questions (these will need approval)
DO $$
DECLARE
    verse_uuid UUID;
BEGIN
    -- Get Al-Fatiha verse 1
    SELECT id INTO verse_uuid FROM verses WHERE surah = 1 AND ayah = 1 LIMIT 1;
    
    IF verse_uuid IS NOT NULL THEN
        INSERT INTO questions (verse_id, prompt, choices, answer, difficulty, status)
        VALUES (
            verse_uuid,
            'What is the meaning of "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ"?',
            '["In the name of Allah, the Entirely Merciful, the Especially Merciful", "All praise is due to Allah", "There is no god but Allah", "Allah is the Greatest"]'::jsonb,
            'In the name of Allah, the Entirely Merciful, the Especially Merciful',
            'easy',
            'approved'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Setup Row Level Security
-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_elevated" ON users;
CREATE POLICY "users_select_elevated" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
    );

-- Verses table
ALTER TABLE verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verses_select_all" ON verses;
CREATE POLICY "verses_select_all" ON verses
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "verses_insert_elevated" ON verses;
CREATE POLICY "verses_insert_elevated" ON verses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
    );

-- Questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions_select_approved" ON questions;
CREATE POLICY "questions_select_approved" ON questions
    FOR SELECT USING (status = 'approved' OR approved_at IS NOT NULL);

DROP POLICY IF EXISTS "questions_select_scholar" ON questions;
CREATE POLICY "questions_select_scholar" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'scholar'
        )
    );

DROP POLICY IF EXISTS "questions_insert_elevated" ON questions;
CREATE POLICY "questions_insert_elevated" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
        AND created_by = auth.uid()
    );

DROP POLICY IF EXISTS "questions_update_scholar" ON questions;
CREATE POLICY "questions_update_scholar" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'scholar'
        )
    );

-- Other table policies would follow similar patterns...

-- Functions
CREATE OR REPLACE FUNCTION create_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO streaks (user_id, current_streak, longest_streak)
    VALUES (NEW.id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_user_streak ON users;
CREATE TRIGGER trigger_create_user_streak
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_streak();

-- Function to update streak when attempt is made
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- If answer is correct, increment streak
    IF NEW.correct THEN
        UPDATE streaks 
        SET 
            current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Update user progress
        UPDATE user_progress
        SET 
            total_questions_answered = total_questions_answered + 1,
            total_correct_answers = total_correct_answers + 1,
            accuracy_percentage = (total_correct_answers + 1.0) / (total_questions_answered + 1.0) * 100,
            experience_points = experience_points + 10,
            last_quiz_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSE
        -- If answer is wrong, reset current streak
        UPDATE streaks 
        SET 
            current_streak = 0,
            last_activity_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Update user progress
        UPDATE user_progress
        SET 
            total_questions_answered = total_questions_answered + 1,
            accuracy_percentage = total_correct_answers / (total_questions_answered + 1.0) * 100,
            experience_points = experience_points + 2,
            last_quiz_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_user_streak ON attempts;
CREATE TRIGGER trigger_update_user_streak
    AFTER INSERT ON attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Function to log approval actions
CREATE OR REPLACE FUNCTION log_question_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when approved_at changes from null to not null (approval)
    IF OLD.approved_at IS NULL AND NEW.approved_at IS NOT NULL THEN
        INSERT INTO audit_logs (action, question_id, scholar_id, details)
        VALUES ('approve', NEW.id, auth.uid(), jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status));
    ELSIF OLD.status != NEW.status THEN
        INSERT INTO audit_logs (action, question_id, scholar_id, details)
        VALUES ('update', NEW.id, auth.uid(), jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_log_question_approval ON questions;
CREATE TRIGGER trigger_log_question_approval
    AFTER UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION log_question_approval();

-- Function to generate daily challenge
CREATE OR REPLACE FUNCTION generate_daily_challenge(challenge_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
    challenge_id UUID;
    question_ids JSONB;
BEGIN
    -- Get 10 random approved questions with difficulty distribution
    WITH random_questions AS (
        SELECT id, difficulty,
               ROW_NUMBER() OVER (PARTITION BY difficulty ORDER BY RANDOM()) as rn
        FROM questions 
        WHERE status = 'approved' AND approved_at IS NOT NULL
    ),
    selected_questions AS (
        SELECT id FROM random_questions 
        WHERE (difficulty = 'easy' AND rn <= 3)
           OR (difficulty = 'medium' AND rn <= 5) 
           OR (difficulty = 'hard' AND rn <= 2)
    )
    SELECT jsonb_agg(id) INTO question_ids FROM selected_questions;
    
    -- Insert daily challenge
    INSERT INTO daily_challenges (challenge_date, theme, description, question_ids)
    VALUES (
        challenge_date,
        'Daily Quran Challenge',
        'Test your knowledge with today''s selection of Quranic verses',
        question_ids
    )
    ON CONFLICT (challenge_date) 
    DO UPDATE SET 
        question_ids = EXCLUDED.question_ids,
        is_active = true
    RETURNING id INTO challenge_id;
    
    RETURN challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default admin user function
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT)
RETURNS UUID AS $$
DECLARE
    admin_id UUID;
BEGIN
    INSERT INTO users (id, email, role)
    VALUES (gen_random_uuid(), admin_email, 'scholar')
    ON CONFLICT (email) DO UPDATE SET role = 'scholar'
    RETURNING id INTO admin_id;
    
    RETURN admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Generate initial daily challenge
SELECT generate_daily_challenge();

COMMENT ON TABLE questions IS 'Questions for Quran verse challenges with approval workflow';
COMMENT ON TABLE quiz_sessions IS 'Active quiz sessions tracking user progress';
COMMENT ON TABLE daily_challenges IS 'Daily challenges with curated questions';
COMMENT ON TABLE user_progress IS 'Comprehensive user progress and achievement tracking';