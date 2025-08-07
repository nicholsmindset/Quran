-- Quran Verse Challenge Database Schema
-- Sprint 1: User Authentication, Verses, Questions, and Approval Workflow

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('learner', 'teacher', 'scholar');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- T002: Create users table with roles
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'learner' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- T006: Design verses table schema
CREATE TABLE verses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    surah INTEGER NOT NULL CHECK (surah >= 1 AND surah <= 114),
    ayah INTEGER NOT NULL CHECK (ayah >= 1),
    arabic_text TEXT NOT NULL,
    translation_en TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(surah, ayah)
);

-- T011: Design questions table schema
CREATE TABLE questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    choices JSONB NOT NULL CHECK (jsonb_array_length(choices) >= 2),
    answer TEXT NOT NULL,
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- T012: Design attempts table schema  
CREATE TABLE attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, question_id)
);

-- Create streaks table for progress tracking
CREATE TABLE streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- T015: Create audit logging system
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject')),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    scholar_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- T010: Create database indexes for performance
CREATE INDEX idx_verses_surah_ayah ON verses(surah, ayah);
CREATE INDEX idx_verses_arabic_text ON verses USING gin(to_tsvector('arabic', arabic_text));
CREATE INDEX idx_questions_verse_id ON questions(verse_id);
CREATE INDEX idx_questions_approved_at ON questions(approved_at);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_question_id ON attempts(question_id);
CREATE INDEX idx_attempts_answered_at ON attempts(answered_at);
CREATE INDEX idx_audit_logs_question_id ON audit_logs(question_id);
CREATE INDEX idx_audit_logs_scholar_id ON audit_logs(scholar_id);

-- T005: Setup RLS policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data (except role)
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- Only authenticated users can insert (registration)
CREATE POLICY "users_insert" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Scholars and teachers can view all users
CREATE POLICY "users_select_elevated" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
    );

-- Setup RLS for verses table
ALTER TABLE verses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read verses
CREATE POLICY "verses_select_all" ON verses
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only teachers and scholars can insert verses
CREATE POLICY "verses_insert_elevated" ON verses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
    );

-- T014: Setup RLS for questions/attempts
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Users can only see approved questions
CREATE POLICY "questions_select_approved" ON questions
    FOR SELECT USING (approved_at IS NOT NULL);

-- Scholars can see all questions including pending
CREATE POLICY "questions_select_scholar" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'scholar'
        )
    );

-- Teachers and scholars can create questions
CREATE POLICY "questions_insert_elevated" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
        AND created_by = auth.uid()
    );

-- Only scholars can approve/update questions
CREATE POLICY "questions_update_scholar" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'scholar'
        )
    );

-- Setup RLS for attempts table
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own attempts
CREATE POLICY "attempts_select_own" ON attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "attempts_insert_own" ON attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Teachers and scholars can view all attempts
CREATE POLICY "attempts_select_elevated" ON attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
    );

-- Setup RLS for streaks table
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Users can read their own streaks
CREATE POLICY "streaks_select_own" ON streaks
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update their own streaks
CREATE POLICY "streaks_upsert_own" ON streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update_own" ON streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- Teachers and scholars can view all streaks
CREATE POLICY "streaks_select_elevated" ON streaks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
    );

-- Setup RLS for audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only scholars can read and insert audit logs
CREATE POLICY "audit_logs_scholar_only" ON audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'scholar'
        )
    );

-- Function to automatically create streak record for new users
CREATE OR REPLACE FUNCTION create_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO streaks (user_id, current_streak, longest_streak)
    VALUES (NEW.id, 0, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create streak record when user is created
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
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSE
        -- If answer is wrong, reset current streak
        UPDATE streaks 
        SET 
            current_streak = 0,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streaks on attempts
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
        INSERT INTO audit_logs (action, question_id, scholar_id)
        VALUES ('approve', NEW.id, auth.uid());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log question approvals
CREATE TRIGGER trigger_log_question_approval
    AFTER UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION log_question_approval();