-- Production Database Setup Script
-- Execute this script in your Supabase SQL editor for production database setup

-- This script is safe to run multiple times (idempotent)

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('learner', 'teacher', 'scholar');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
    END IF;
END $$;

-- 3. Create tables (with IF NOT EXISTS to prevent errors on re-run)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'learner' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS verses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    surah INTEGER NOT NULL CHECK (surah >= 1 AND surah <= 114),
    ayah INTEGER NOT NULL CHECK (ayah >= 1),
    arabic_text TEXT NOT NULL,
    translation_en TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(surah, ayah)
);

CREATE TABLE IF NOT EXISTS questions (
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

CREATE TABLE IF NOT EXISTS attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject')),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    scholar_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Create indexes (IF NOT EXISTS syntax for indexes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_verses_surah_ayah') THEN
        CREATE INDEX idx_verses_surah_ayah ON verses(surah, ayah);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_verses_arabic_text') THEN
        CREATE INDEX idx_verses_arabic_text ON verses USING gin(to_tsvector('arabic', arabic_text));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_questions_verse_id') THEN
        CREATE INDEX idx_questions_verse_id ON questions(verse_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_questions_approved_at') THEN
        CREATE INDEX idx_questions_approved_at ON questions(approved_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_questions_difficulty') THEN
        CREATE INDEX idx_questions_difficulty ON questions(difficulty);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attempts_user_id') THEN
        CREATE INDEX idx_attempts_user_id ON attempts(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attempts_question_id') THEN
        CREATE INDEX idx_attempts_question_id ON attempts(question_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attempts_answered_at') THEN
        CREATE INDEX idx_attempts_answered_at ON attempts(answered_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_question_id') THEN
        CREATE INDEX idx_audit_logs_question_id ON audit_logs(question_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_scholar_id') THEN
        CREATE INDEX idx_audit_logs_scholar_id ON audit_logs(scholar_id);
    END IF;
END $$;

-- 5. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (with proper error handling)
DO $$
BEGIN
    -- Users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_select_own' AND tablename = 'users') THEN
        CREATE POLICY "users_select_own" ON users
            FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own' AND tablename = 'users') THEN
        CREATE POLICY "users_update_own" ON users
            FOR UPDATE USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_insert' AND tablename = 'users') THEN
        CREATE POLICY "users_insert" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_select_elevated' AND tablename = 'users') THEN
        CREATE POLICY "users_select_elevated" ON users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('teacher', 'scholar')
                )
            );
    END IF;
    
    -- Verses policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'verses_select_all' AND tablename = 'verses') THEN
        CREATE POLICY "verses_select_all" ON verses
            FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'verses_insert_elevated' AND tablename = 'verses') THEN
        CREATE POLICY "verses_insert_elevated" ON verses
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('teacher', 'scholar')
                )
            );
    END IF;
    
    -- Questions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'questions_select_approved' AND tablename = 'questions') THEN
        CREATE POLICY "questions_select_approved" ON questions
            FOR SELECT USING (approved_at IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'questions_select_scholar' AND tablename = 'questions') THEN
        CREATE POLICY "questions_select_scholar" ON questions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = 'scholar'
                )
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'questions_insert_elevated' AND tablename = 'questions') THEN
        CREATE POLICY "questions_insert_elevated" ON questions
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('teacher', 'scholar')
                )
                AND created_by = auth.uid()
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'questions_update_scholar' AND tablename = 'questions') THEN
        CREATE POLICY "questions_update_scholar" ON questions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = 'scholar'
                )
            );
    END IF;
    
    -- Attempts policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attempts_select_own' AND tablename = 'attempts') THEN
        CREATE POLICY "attempts_select_own" ON attempts
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attempts_insert_own' AND tablename = 'attempts') THEN
        CREATE POLICY "attempts_insert_own" ON attempts
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'attempts_select_elevated' AND tablename = 'attempts') THEN
        CREATE POLICY "attempts_select_elevated" ON attempts
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('teacher', 'scholar')
                )
            );
    END IF;
    
    -- Streaks policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'streaks_select_own' AND tablename = 'streaks') THEN
        CREATE POLICY "streaks_select_own" ON streaks
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'streaks_upsert_own' AND tablename = 'streaks') THEN
        CREATE POLICY "streaks_upsert_own" ON streaks
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'streaks_update_own' AND tablename = 'streaks') THEN
        CREATE POLICY "streaks_update_own" ON streaks
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'streaks_select_elevated' AND tablename = 'streaks') THEN
        CREATE POLICY "streaks_select_elevated" ON streaks
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('teacher', 'scholar')
                )
            );
    END IF;
    
    -- Audit logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'audit_logs_scholar_only' AND tablename = 'audit_logs') THEN
        CREATE POLICY "audit_logs_scholar_only" ON audit_logs
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = 'scholar'
                )
            );
    END IF;
END $$;

-- 7. Create functions and triggers
CREATE OR REPLACE FUNCTION create_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO streaks (user_id, current_streak, longest_streak)
    VALUES (NEW.id, 0, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.correct THEN
        UPDATE streaks 
        SET 
            current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSE
        UPDATE streaks 
        SET 
            current_streak = 0,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_question_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.approved_at IS NULL AND NEW.approved_at IS NOT NULL THEN
        INSERT INTO audit_logs (action, question_id, scholar_id)
        VALUES ('approve', NEW.id, auth.uid());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers (if they don't exist)
DROP TRIGGER IF EXISTS trigger_create_user_streak ON users;
CREATE TRIGGER trigger_create_user_streak
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_streak();

DROP TRIGGER IF EXISTS trigger_update_user_streak ON attempts;
CREATE TRIGGER trigger_update_user_streak
    AFTER INSERT ON attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

DROP TRIGGER IF EXISTS trigger_log_question_approval ON questions;
CREATE TRIGGER trigger_log_question_approval
    AFTER UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION log_question_approval();

-- 9. Verification queries
SELECT 
    'Schema setup completed successfully' as status,
    NOW() as timestamp;

-- Check table counts
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 
    'verses' as table_name, 
    COUNT(*) as row_count 
FROM verses
UNION ALL
SELECT 
    'questions' as table_name, 
    COUNT(*) as row_count 
FROM questions
UNION ALL
SELECT 
    'attempts' as table_name, 
    COUNT(*) as row_count 
FROM attempts
UNION ALL
SELECT 
    'streaks' as table_name, 
    COUNT(*) as row_count 
FROM streaks
UNION ALL
SELECT 
    'audit_logs' as table_name, 
    COUNT(*) as row_count 
FROM audit_logs;

-- Display RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'verses', 'questions', 'attempts', 'streaks', 'audit_logs')
ORDER BY tablename;