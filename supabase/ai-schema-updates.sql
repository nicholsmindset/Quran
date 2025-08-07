-- AI Question Generation Schema Updates
-- Run this in Supabase SQL Editor to add AI features

-- Add columns to questions table for AI-generated content
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'fill_blank')),
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS generation_model VARCHAR(50) DEFAULT 'gpt-4o';

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS questions_embedding_idx ON questions 
USING ivfflat (embedding vector_cosine_ops);

-- Create batch_runs table for monitoring AI generation
CREATE TABLE IF NOT EXISTS batch_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verses_processed INTEGER NOT NULL DEFAULT 0,
  questions_generated INTEGER NOT NULL DEFAULT 0,
  questions_saved INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for batch runs monitoring
CREATE INDEX IF NOT EXISTS batch_runs_run_at_idx ON batch_runs(run_at);
CREATE INDEX IF NOT EXISTS batch_runs_success_idx ON batch_runs(success);

-- Create question_topics table for better topic management
CREATE TABLE IF NOT EXISTS question_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  parent_topic_id UUID REFERENCES question_topics(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common Islamic topics
INSERT INTO question_topics (name, description, category) VALUES
('faith', 'Questions about belief and faith in Islam', 'core_beliefs'),
('prayer', 'Questions about salah and worship', 'worship'),
('charity', 'Questions about zakat and giving', 'worship'),
('fasting', 'Questions about sawm and Ramadan', 'worship'),
('pilgrimage', 'Questions about Hajj and Umrah', 'worship'),
('forgiveness', 'Questions about repentance and mercy', 'character'),
('guidance', 'Questions about divine guidance', 'core_beliefs'),
('creation', 'Questions about Allah as Creator', 'core_beliefs'),
('afterlife', 'Questions about the Day of Judgment and hereafter', 'eschatology'),
('prophets', 'Questions about messengers and prophets', 'prophetic_tradition'),
('worship', 'General worship and devotion', 'worship'),
('morality', 'Questions about Islamic ethics', 'character'),
('justice', 'Questions about fairness and justice', 'social_justice'),
('mercy', 'Questions about Allah mercy and compassion', 'attributes_of_allah'),
('patience', 'Questions about sabr and perseverance', 'character'),
('gratitude', 'Questions about thankfulness to Allah', 'character'),
('remembrance', 'Questions about dhikr and remembrance of Allah', 'worship'),
('knowledge', 'Questions about seeking knowledge', 'education'),
('family', 'Questions about family relationships', 'social'),
('community', 'Questions about ummah and society', 'social')
ON CONFLICT (name) DO NOTHING;

-- Create junction table for question-topic relationships
CREATE TABLE IF NOT EXISTS question_topic_links (
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES question_topics(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, topic_id)
);

-- Create verse_processing_status table to track processing
CREATE TABLE IF NOT EXISTS verse_processing_status (
  verse_id UUID PRIMARY KEY REFERENCES verses(id) ON DELETE CASCADE,
  questions_generated INTEGER DEFAULT 0,
  last_processed_at TIMESTAMP WITH TIME ZONE,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  priority_score INTEGER DEFAULT 0, -- Higher score = higher priority
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for processing status queries
CREATE INDEX IF NOT EXISTS verse_processing_status_idx ON verse_processing_status(processing_status);
CREATE INDEX IF NOT EXISTS verse_processing_priority_idx ON verse_processing_status(priority_score DESC);

-- Update questions table to include better metadata
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS semantic_keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.75 CHECK (confidence_score >= 0 AND confidence_score <= 1),
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Create function to automatically update verse processing status
CREATE OR REPLACE FUNCTION update_verse_processing_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update processing status when questions are added
  INSERT INTO verse_processing_status (verse_id, questions_generated, last_processed_at, processing_status)
  VALUES (NEW.verse_id, 1, NOW(), 'completed')
  ON CONFLICT (verse_id) 
  DO UPDATE SET 
    questions_generated = verse_processing_status.questions_generated + 1,
    last_processed_at = NOW(),
    processing_status = 'completed',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status updates
CREATE TRIGGER update_verse_processing_status_trigger
  AFTER INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_verse_processing_status();

-- Create function for semantic search using embeddings
CREATE OR REPLACE FUNCTION search_questions_by_similarity(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  question_id UUID,
  similarity_score float,
  prompt TEXT,
  surah INTEGER,
  ayah INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    1 - (q.embedding <=> query_embedding) as similarity,
    q.prompt,
    v.surah,
    v.ayah
  FROM questions q
  JOIN verses v ON q.verse_id = v.id
  WHERE q.embedding IS NOT NULL
    AND q.approved_at IS NOT NULL
    AND (1 - (q.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Create improved RLS policies for new AI features

-- Policy for batch_runs (only scholars and admins can view)
CREATE POLICY "batch_runs_select_policy" ON batch_runs
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('scholar', 'admin')
    OR auth.uid()::text = created_by
  );

-- Policy for question_topics (everyone can view, only admins can modify)
CREATE POLICY "question_topics_select_policy" ON question_topics
  FOR SELECT USING (true);

CREATE POLICY "question_topics_modify_policy" ON question_topics
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policy for verse_processing_status (scholars and admins can view)
CREATE POLICY "verse_processing_select_policy" ON verse_processing_status
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('scholar', 'admin')
  );

-- Enable RLS on new tables
ALTER TABLE batch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_processing_status ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS questions_topics_gin_idx ON questions USING gin(topics);
CREATE INDEX IF NOT EXISTS questions_ai_generated_idx ON questions(ai_generated);
CREATE INDEX IF NOT EXISTS questions_confidence_idx ON questions(confidence_score);
CREATE INDEX IF NOT EXISTS questions_approved_by_idx ON questions(approved_by);

-- Create view for scholar moderation queue with AI metadata
CREATE OR REPLACE VIEW scholar_moderation_queue AS
SELECT 
  q.id,
  q.prompt,
  q.choices,
  q.answer,
  q.difficulty,
  q.topics,
  q.explanation,
  q.question_type,
  q.ai_generated,
  q.confidence_score,
  q.created_at,
  q.created_by,
  v.surah,
  v.ayah,
  v.arabic_text,
  v.translation_en,
  u.email as created_by_email
FROM questions q
JOIN verses v ON q.verse_id = v.id
LEFT JOIN users u ON q.created_by = u.id::text
WHERE q.approved_at IS NULL
ORDER BY 
  q.confidence_score DESC, -- Higher confidence first
  q.created_at ASC; -- Then by creation time

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to get AI generation statistics
CREATE OR REPLACE FUNCTION get_ai_generation_stats(days_back INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH stats AS (
    SELECT 
      COUNT(*) as total_runs,
      COUNT(*) FILTER (WHERE success = true) as successful_runs,
      COALESCE(SUM(questions_generated), 0) as total_questions,
      COALESCE(AVG(duration_seconds), 0) as avg_duration,
      COUNT(*) FILTER (WHERE success = false) as failed_runs
    FROM batch_runs 
    WHERE run_at >= NOW() - INTERVAL '1 day' * days_back
  ),
  pending_questions AS (
    SELECT COUNT(*) as pending_count
    FROM questions 
    WHERE approved_at IS NULL AND ai_generated = true
  ),
  approved_questions AS (
    SELECT COUNT(*) as approved_count
    FROM questions 
    WHERE approved_at IS NOT NULL AND ai_generated = true
  )
  SELECT json_build_object(
    'total_runs', s.total_runs,
    'successful_runs', s.successful_runs,
    'failed_runs', s.failed_runs,
    'success_rate', CASE WHEN s.total_runs > 0 THEN ROUND((s.successful_runs::DECIMAL / s.total_runs) * 100, 2) ELSE 0 END,
    'total_questions_generated', s.total_questions,
    'average_duration_seconds', ROUND(s.avg_duration, 2),
    'pending_questions', pq.pending_count,
    'approved_questions', aq.approved_count,
    'days_analyzed', days_back,
    'generated_at', NOW()
  ) INTO result
  FROM stats s, pending_questions pq, approved_questions aq;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_ai_generation_stats IS 'Get comprehensive statistics about AI question generation system';
COMMENT ON TABLE batch_runs IS 'Tracks AI question generation batch processing runs';
COMMENT ON TABLE question_topics IS 'Hierarchical topic classification for questions';
COMMENT ON TABLE verse_processing_status IS 'Tracks which verses have been processed for question generation';

-- Insert sample priority scores for commonly memorized surahs
INSERT INTO verse_processing_status (verse_id, priority_score)
SELECT v.id, 
  CASE 
    WHEN v.surah = 1 THEN 100  -- Al-Fatiha (highest priority)
    WHEN v.surah IN (112, 113, 114) THEN 90  -- Last 3 surahs
    WHEN v.surah IN (110, 108, 107, 106, 105, 104, 103, 102, 101, 100) THEN 80  -- Short surahs
    WHEN v.surah = 2 AND v.ayah <= 10 THEN 70  -- Beginning of Al-Baqarah
    WHEN v.surah IN (18, 36, 67) THEN 60  -- Commonly recited longer surahs
    ELSE 10  -- Default priority
  END
FROM verses v
WHERE NOT EXISTS (
  SELECT 1 FROM verse_processing_status vps WHERE vps.verse_id = v.id
);

COMMIT;