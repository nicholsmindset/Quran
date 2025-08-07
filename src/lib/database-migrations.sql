-- AI Enhancement Database Schema for Sprint 2
-- Add these tables to support AI-powered features

-- Question Context Table
CREATE TABLE IF NOT EXISTS question_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    historical_background TEXT,
    thematic_connections TEXT[], -- Array of thematic connection strings
    difficulty_factors TEXT[], -- Array of difficulty factor strings
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(question_id)
);

-- Verse Context Table
CREATE TABLE IF NOT EXISTS verse_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    revelation_context TEXT,
    historical_period VARCHAR(20) CHECK (historical_period IN ('meccan', 'medinan')),
    occasion_of_revelation TEXT,
    related_verses TEXT[], -- Array of verse references
    main_themes TEXT[], -- Array of theme strings
    linguistic_features TEXT[], -- Array of linguistic feature strings
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(verse_id)
);

-- Tafsir References Table
CREATE TABLE IF NOT EXISTS tafsir_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    scholar VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    relevant_quotes TEXT[], -- Array of relevant quote strings
    is_authentic BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_tafsir_verse_id (verse_id),
    INDEX idx_tafsir_scholar (scholar)
);

-- AI Hints Table
CREATE TABLE IF NOT EXISTS ai_hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('vocabulary', 'context', 'grammar', 'theme')),
    is_revealing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_hints_question_level (question_id, level),
    UNIQUE(question_id, level, type)
);

-- AI Explanations Table
CREATE TABLE IF NOT EXISTS ai_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    explanation TEXT NOT NULL,
    additional_context TEXT,
    related_concepts TEXT[], -- Array of related concept strings
    further_reading TEXT[], -- Array of further reading strings
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_explanations_question_id (question_id)
);

-- Personalized Recommendations Table
CREATE TABLE IF NOT EXISTS personalized_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('study_plan', 'topic_focus', 'difficulty_adjustment', 'review_schedule')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_items TEXT[], -- Array of action item strings
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    estimated_time INTEGER NOT NULL, -- in minutes
    expires_at TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_recommendations_user_id (user_id),
    INDEX idx_recommendations_type (type),
    INDEX idx_recommendations_priority (priority)
);

-- User Performance Patterns Table
CREATE TABLE IF NOT EXISTS user_performance_patterns (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    topic_strengths JSONB, -- JSON object with topic -> proficiency mapping
    topic_weaknesses JSONB, -- JSON object with topic -> difficulty mapping
    difficulty_progression JSONB, -- JSON object with easy/medium/hard performance
    learning_velocity DECIMAL(5,2), -- questions per day
    retention_rate DECIMAL(3,2) CHECK (retention_rate >= 0 AND retention_rate <= 1),
    consistency_score DECIMAL(3,2) CHECK (consistency_score >= 0 AND consistency_score <= 1),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spaced Repetition Schedules Table
CREATE TABLE IF NOT EXISTS spaced_repetition_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    interval_days INTEGER NOT NULL DEFAULT 1,
    ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_date DATE NOT NULL,
    last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_performance VARCHAR(20) CHECK (last_performance IN ('again', 'hard', 'good', 'easy')),
    
    UNIQUE(user_id, question_id),
    INDEX idx_spaced_repetition_user_next_review (user_id, next_review_date),
    INDEX idx_spaced_repetition_question_id (question_id)
);

-- User Interactions Table (for analytics)
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('hint_requested', 'explanation_requested', 'context_viewed', 'recommendation_viewed')),
    user_answer TEXT,
    is_correct BOOLEAN,
    metadata JSONB, -- Additional interaction data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    INDEX idx_user_interactions_user_id (user_id),
    INDEX idx_user_interactions_type (interaction_type),
    INDEX idx_user_interactions_question_id (question_id),
    INDEX idx_user_interactions_created_at (created_at)
);

-- Learning Analytics Table
CREATE TABLE IF NOT EXISTS learning_analytics (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_questions_answered INTEGER NOT NULL DEFAULT 0,
    accuracy_rate DECIMAL(5,4) CHECK (accuracy_rate >= 0 AND accuracy_rate <= 1),
    average_response_time INTEGER, -- in milliseconds
    knowledge_gaps TEXT[], -- Array of knowledge gap topics
    mastered_topics TEXT[], -- Array of mastered topics
    recommended_study_time INTEGER, -- minutes per day
    projected_goal_completion DATE,
    learning_momentum VARCHAR(20) CHECK (learning_momentum IN ('accelerating', 'steady', 'declining')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_category_tags ON questions USING GIN(category_tags);
CREATE INDEX IF NOT EXISTS idx_verses_surah_ayah ON verses(surah, ayah);

-- Add RLS policies for security
ALTER TABLE question_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tafsir_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_performance_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Users can view question contexts" ON question_contexts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view verse contexts" ON verse_contexts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view tafsir references" ON tafsir_references FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view AI hints" ON ai_hints FOR SELECT TO authenticated USING (true);

-- User-specific data policies
CREATE POLICY "Users can manage their own recommendations" ON personalized_recommendations FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own performance patterns" ON user_performance_patterns FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own spaced repetition" ON spaced_repetition_schedules FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own interactions" ON user_interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own analytics" ON learning_analytics FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_question_contexts_updated_at BEFORE UPDATE ON question_contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verse_contexts_updated_at BEFORE UPDATE ON verse_contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_performance_patterns_updated_at BEFORE UPDATE ON user_performance_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_analytics_updated_at BEFORE UPDATE ON learning_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();