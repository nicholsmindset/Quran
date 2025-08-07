-- Notification and Email System Schema
-- This extends the existing Quran Verse Challenge schema

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_reminder BOOLEAN DEFAULT true,
    streak_notifications BOOLEAN DEFAULT true,
    weekly_progress BOOLEAN DEFAULT true,
    moderation_updates BOOLEAN DEFAULT true,
    group_activities BOOLEAN DEFAULT true,
    system_announcements BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily_digest', 'weekly_digest')),
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar', 'ur', 'id', 'tr', 'fr')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names used in template
    category TEXT DEFAULT 'transactional' CHECK (category IN ('transactional', 'marketing', 'system')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient EMAIL NOT NULL,
    subject TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    template_data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

-- Notification Queue Table
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'email' CHECK (type IN ('email', 'push', 'sms')),
    template_id TEXT NOT NULL, -- Can be template name or UUID
    template_data JSONB DEFAULT '{}'::jsonb,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Announcements Table
CREATE TABLE IF NOT EXISTS system_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    target_roles TEXT[] DEFAULT ARRAY['learner', 'teacher', 'scholar'],
    is_active BOOLEAN DEFAULT true,
    show_until TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cron Job Logs Table
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial_success', 'failed')),
    processed INTEGER DEFAULT 0,
    successful INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    error_details JSONB,
    execution_time_ms INTEGER,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unsubscribe Tokens Table (for secure unsubscribe links)
CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    notification_type TEXT, -- If null, unsubscribes from all
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_system_announcements_active ON system_announcements(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_executed_at ON cron_job_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON unsubscribe_tokens(token);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_user_id ON unsubscribe_tokens(user_id);

-- Row Level Security (RLS) Policies

-- Notification Preferences RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Email Templates RLS (Admin only for modifications)
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active email templates"
    ON email_templates FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage email templates"
    ON email_templates FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Email Logs RLS (Users can view their own, admins can view all)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
    ON email_logs FOR SELECT
    USING (
        recipient = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all email logs"
    ON email_logs FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- System Announcements RLS
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active announcements for their role"
    ON system_announcements FOR SELECT
    USING (
        is_active = true 
        AND (show_until IS NULL OR show_until > NOW())
        AND (
            target_roles IS NULL 
            OR (
                SELECT raw_user_meta_data->>'role' 
                FROM auth.users 
                WHERE id = auth.uid()
            ) = ANY(target_roles)
        )
    );

CREATE POLICY "Admins can manage system announcements"
    ON system_announcements FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Functions for Notification System

-- Function to get users needing daily reminders
CREATE OR REPLACE FUNCTION get_users_needing_daily_reminders(target_date DATE)
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'role' as role
    FROM auth.users u
    INNER JOIN notification_preferences np ON u.id = np.user_id
    WHERE 
        np.daily_reminder = true
        AND u.id NOT IN (
            -- Exclude users who completed today's quiz
            SELECT DISTINCT qs.user_id
            FROM quiz_sessions qs
            WHERE qs.status = 'completed'
            AND DATE(qs.completed_at) = target_date
        )
        AND u.id NOT IN (
            -- Exclude users who already received a reminder today
            SELECT DISTINCT nq.user_id
            FROM notification_queue nq
            WHERE nq.template_id = 'daily_reminder'
            AND DATE(nq.created_at) = target_date
            AND nq.status IN ('sent', 'processing', 'pending')
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update notification preferences timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notification preferences
CREATE TRIGGER update_notification_preferences_updated_at_trigger
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Function to clean up old email logs and cron logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete email logs older than 90 days
    DELETE FROM email_logs 
    WHERE sent_at < NOW() - INTERVAL '90 days';
    
    -- Delete cron job logs older than 30 days
    DELETE FROM cron_job_logs 
    WHERE executed_at < NOW() - INTERVAL '30 days';
    
    -- Delete used unsubscribe tokens older than 7 days
    DELETE FROM unsubscribe_tokens 
    WHERE is_used = true AND created_at < NOW() - INTERVAL '7 days';
    
    -- Delete expired unsubscribe tokens
    DELETE FROM unsubscribe_tokens 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables, category) VALUES
('daily_reminder', 
 '🌟 Keep your {{currentStreak}}-day streak alive!',
 '<html><body><h2>As-Salamu Alaikum {{userName}}</h2><p>Your daily Qur''an question is ready! Don''t let your {{currentStreak}}-day streak break.</p><p><a href="{{quizUrl}}">Take Today''s Quiz</a></p></body></html>',
 'As-Salamu Alaikum {{userName}}\n\nYour daily Qur''an question is ready! Don''t let your {{currentStreak}}-day streak break.\n\nVisit: {{quizUrl}}',
 '["userName", "currentStreak", "quizUrl"]',
 'transactional'),

('weekly_progress',
 '📊 Your Weekly Qur''an Learning Summary',
 '<html><body><h2>Weekly Progress Report</h2><p>Hi {{userName}},</p><p>This week you answered {{questionsAnswered}} questions with {{accuracy}}% accuracy!</p></body></html>',
 'Weekly Progress Report\n\nHi {{userName}},\n\nThis week you answered {{questionsAnswered}} questions with {{accuracy}}% accuracy!',
 '["userName", "questionsAnswered", "accuracy"]',
 'transactional'),

('streak_milestone',
 '🎉 Amazing! You''ve reached a {{streak}}-day streak!',
 '<html><body><h2>Congratulations!</h2><p>{{userName}}, you''ve achieved a {{streak}}-day learning streak! {{achievementBadge}}</p></body></html>',
 'Congratulations!\n\n{{userName}}, you''ve achieved a {{streak}}-day learning streak! {{achievementBadge}}',
 '["userName", "streak", "achievementBadge"]',
 'transactional')

ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE notification_preferences IS 'User preferences for different types of notifications';
COMMENT ON TABLE email_templates IS 'Reusable email templates with variable substitution';
COMMENT ON TABLE email_logs IS 'Log of all emails sent through the system';
COMMENT ON TABLE notification_queue IS 'Queue for processing notifications asynchronously';
COMMENT ON TABLE system_announcements IS 'Platform-wide announcements for different user roles';
COMMENT ON TABLE cron_job_logs IS 'Logs of automated job executions';
COMMENT ON TABLE unsubscribe_tokens IS 'Secure tokens for email unsubscribe functionality';