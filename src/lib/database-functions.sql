-- Database functions and triggers for the Quran Verse Challenge quiz system
-- These should be executed in your Supabase SQL editor

-- Create daily_quizzes table
CREATE TABLE IF NOT EXISTS daily_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    question_ids UUID[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_quiz_id UUID NOT NULL REFERENCES daily_quizzes(id) ON DELETE CASCADE,
    current_question_index INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}',
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    timezone TEXT DEFAULT 'UTC',
    UNIQUE(user_id, daily_quiz_id, status) -- Prevent multiple active sessions for same quiz
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_daily_quizzes_date ON daily_quizzes(date);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_daily_quiz ON quiz_sessions(daily_quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_last_activity ON quiz_sessions(last_activity_at);

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    current_streak_count INTEGER := 0;
    longest_streak_count INTEGER := 0;
    last_completion_date DATE;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get current streak info
    SELECT current_streak, longest_streak 
    INTO current_streak_count, longest_streak_count
    FROM streaks 
    WHERE user_id = p_user_id;

    -- If no streak record exists, create one
    IF NOT FOUND THEN
        current_streak_count := 0;
        longest_streak_count := 0;
    END IF;

    -- Find the last completion date
    SELECT MAX(dq.date::date)
    INTO last_completion_date
    FROM quiz_sessions qs
    JOIN daily_quizzes dq ON qs.daily_quiz_id = dq.id
    WHERE qs.user_id = p_user_id 
    AND qs.status = 'completed'
    AND qs.completed_at IS NOT NULL;

    -- Calculate new streak
    IF last_completion_date IS NULL THEN
        -- First completion
        current_streak_count := 1;
    ELSIF last_completion_date = today_date THEN
        -- Completed today, increment streak
        current_streak_count := current_streak_count + 1;
    ELSIF last_completion_date = today_date - INTERVAL '1 day' THEN
        -- Completed yesterday, maintain streak
        -- (This handles edge cases where function is called multiple times)
        current_streak_count := GREATEST(current_streak_count, 1);
    ELSE
        -- Gap in completions, reset streak
        current_streak_count := 1;
    END IF;

    -- Update longest streak if necessary
    longest_streak_count := GREATEST(longest_streak_count, current_streak_count);

    -- Upsert streak record
    INSERT INTO streaks (user_id, current_streak, longest_streak, updated_at)
    VALUES (p_user_id, current_streak_count, longest_streak_count, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset user streak (when quiz is not completed)
CREATE OR REPLACE FUNCTION reset_user_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    longest_streak_count INTEGER := 0;
BEGIN
    -- Get current longest streak
    SELECT longest_streak 
    INTO longest_streak_count
    FROM streaks 
    WHERE user_id = p_user_id;

    -- If no record exists, create one with zero streak
    IF NOT FOUND THEN
        longest_streak_count := 0;
    END IF;

    -- Reset current streak while preserving longest streak
    INSERT INTO streaks (user_id, current_streak, longest_streak, updated_at)
    VALUES (p_user_id, 0, longest_streak_count, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
        current_streak = 0,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_activity_at when answers are modified
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
    BEFORE UPDATE ON quiz_sessions
    FOR EACH ROW
    WHEN (OLD.answers IS DISTINCT FROM NEW.answers OR OLD.current_question_index IS DISTINCT FROM NEW.current_question_index)
    EXECUTE FUNCTION update_session_activity();

-- Function to get balanced questions for quiz generation (used by quiz engine)
CREATE OR REPLACE FUNCTION get_balanced_quiz_questions(
    p_easy_count INTEGER DEFAULT 2,
    p_medium_count INTEGER DEFAULT 2,
    p_hard_count INTEGER DEFAULT 1
)
RETURNS TABLE (
    question_id UUID,
    difficulty difficulty_level,
    surah INTEGER
) AS $$
DECLARE
    selected_surahs INTEGER[] := ARRAY[]::INTEGER[];
BEGIN
    -- Get easy questions
    RETURN QUERY
    WITH available_easy AS (
        SELECT q.id, q.difficulty, v.surah
        FROM questions q
        JOIN verses v ON q.verse_id = v.id
        WHERE q.difficulty = 'easy' 
        AND q.approved_at IS NOT NULL
        ORDER BY RANDOM()
    ),
    selected_easy AS (
        SELECT ae.id, ae.difficulty, ae.surah,
               ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
        FROM available_easy ae
        WHERE NOT EXISTS (
            SELECT 1 FROM unnest(selected_surahs) AS ss WHERE ss = ae.surah
        )
    )
    SELECT se.id, se.difficulty, se.surah
    FROM selected_easy se
    WHERE se.rn <= p_easy_count;

    -- Update selected surahs array
    selected_surahs := selected_surahs || ARRAY(
        SELECT DISTINCT v.surah
        FROM questions q
        JOIN verses v ON q.verse_id = v.id
        WHERE q.id IN (
            SELECT question_id FROM get_balanced_quiz_questions(p_easy_count, 0, 0)
        )
    );

    -- Get medium questions (avoiding used surahs when possible)
    RETURN QUERY
    WITH available_medium AS (
        SELECT q.id, q.difficulty, v.surah,
               CASE WHEN v.surah = ANY(selected_surahs) THEN 1 ELSE 0 END as surah_used
        FROM questions q
        JOIN verses v ON q.verse_id = v.id
        WHERE q.difficulty = 'medium' 
        AND q.approved_at IS NOT NULL
        ORDER BY surah_used, RANDOM()
    )
    SELECT am.id, am.difficulty, am.surah
    FROM available_medium am
    LIMIT p_medium_count;

    -- Get hard questions (avoiding used surahs when possible)
    RETURN QUERY
    WITH available_hard AS (
        SELECT q.id, q.difficulty, v.surah,
               CASE WHEN v.surah = ANY(selected_surahs) THEN 1 ELSE 0 END as surah_used
        FROM questions q
        JOIN verses v ON q.verse_id = v.id
        WHERE q.difficulty = 'hard' 
        AND q.approved_at IS NOT NULL
        ORDER BY surah_used, RANDOM()
    )
    SELECT ah.id, ah.difficulty, ah.surah
    FROM available_hard ah
    LIMIT p_hard_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies
ALTER TABLE daily_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Daily quizzes are readable by all authenticated users
CREATE POLICY "Daily quizzes are viewable by authenticated users" ON daily_quizzes
    FOR SELECT TO authenticated
    USING (true);

-- Quiz sessions can only be accessed by the user who owns them
CREATE POLICY "Users can view their own quiz sessions" ON quiz_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own quiz sessions" ON quiz_sessions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz sessions" ON quiz_sessions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Scholars and teachers can create daily quizzes
CREATE POLICY "Teachers and scholars can create daily quizzes" ON daily_quizzes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'scholar')
        )
    );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_balanced_quiz_questions(INTEGER, INTEGER, INTEGER) TO service_role;

-- Add helpful comments
COMMENT ON TABLE daily_quizzes IS 'Stores daily quiz configurations with question IDs';
COMMENT ON TABLE quiz_sessions IS 'Tracks individual user quiz sessions and progress';
COMMENT ON FUNCTION update_user_streak IS 'Updates user streak when they complete a daily quiz';
COMMENT ON FUNCTION reset_user_streak IS 'Resets user streak when they miss a day';
COMMENT ON FUNCTION get_balanced_quiz_questions IS 'Selects balanced questions for daily quiz generation';