-- Performance Monitoring Schema
-- Extends the Quran Verse Challenge database with performance monitoring capabilities

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    metric_unit TEXT NOT NULL,
    user_agent TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    page_url TEXT,
    api_endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    additional_data JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Reports Table
CREATE TABLE IF NOT EXISTS error_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    page_url TEXT,
    api_endpoint TEXT,
    user_agent TEXT,
    additional_context JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- Performance Alerts Table
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('slow_query', 'high_memory', 'error_rate', 'availability', 'performance_budget')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metric_name TEXT,
    threshold_value DECIMAL(10,3),
    current_value DECIMAL(10,3),
    affected_users INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Health Snapshots Table
CREATE TABLE IF NOT EXISTS system_health_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_time TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance metrics
    avg_response_time DECIMAL(8,2),
    p95_response_time DECIMAL(8,2),
    p99_response_time DECIMAL(8,2),
    error_rate DECIMAL(5,2),
    throughput INTEGER,
    
    -- Resource usage
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    disk_usage_percent DECIMAL(5,2),
    
    -- Database metrics
    active_connections INTEGER,
    slow_queries_count INTEGER,
    deadlocks_count INTEGER DEFAULT 0,
    
    -- Application metrics
    active_users INTEGER,
    quiz_sessions_active INTEGER,
    pending_moderation INTEGER,
    
    -- Core Web Vitals aggregates
    avg_lcp DECIMAL(8,2),
    avg_fid DECIMAL(8,2),
    avg_cls DECIMAL(6,4),
    avg_ttfb DECIMAL(8,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Budgets Table
CREATE TABLE IF NOT EXISTS performance_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL UNIQUE,
    budget_value DECIMAL(10,3) NOT NULL,
    metric_unit TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Response Time Tracking Table
CREATE TABLE IF NOT EXISTS api_response_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    response_time_ms DECIMAL(8,2) NOT NULL,
    status_code INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- User Session Analytics Table
CREATE TABLE IF NOT EXISTS user_session_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session metrics
    session_start TIMESTAMPTZ NOT NULL,
    session_end TIMESTAMPTZ,
    session_duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    quiz_questions_answered INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_page_load_time DECIMAL(8,2),
    bounce_rate DECIMAL(5,4), -- 0.0 to 1.0
    
    -- Device info
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    
    -- Engagement metrics
    scroll_depth_percent DECIMAL(5,2),
    time_on_quiz DECIMAL(8,2),
    interactions_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_url ON performance_metrics(page_url);

CREATE INDEX IF NOT EXISTS idx_error_reports_error_type ON error_reports(error_type);
CREATE INDEX IF NOT EXISTS idx_error_reports_timestamp ON error_reports(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_resolved ON error_reports(resolved_at) WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_performance_alerts_active ON performance_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON performance_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_system_health_snapshots_time ON system_health_snapshots(snapshot_time);

CREATE INDEX IF NOT EXISTS idx_api_response_times_endpoint ON api_response_times(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_response_times_timestamp ON api_response_times(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_response_times_response_time ON api_response_times(response_time_ms);

CREATE INDEX IF NOT EXISTS idx_user_session_analytics_user_id ON user_session_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_analytics_session_start ON user_session_analytics(session_start);

-- Partitioning for performance metrics (monthly partitions)
-- This would be set up in production for large-scale data
-- CREATE TABLE performance_metrics_y2024m01 PARTITION OF performance_metrics
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Row Level Security (RLS) Policies

-- Performance metrics - admins can see all, users can see their own
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all performance metrics"
    ON performance_metrics FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can view own performance metrics"
    ON performance_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert performance metrics"
    ON performance_metrics FOR INSERT
    WITH CHECK (true); -- Allow system to insert metrics

-- Error reports - similar policy
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage error reports"
    ON error_reports FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "System can insert error reports"
    ON error_reports FOR INSERT
    WITH CHECK (true);

-- Performance alerts - admin only
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage performance alerts"
    ON performance_alerts FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- System health snapshots - admin only
ALTER TABLE system_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system health snapshots"
    ON system_health_snapshots FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- User session analytics - users own data, admins all
ALTER TABLE user_session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session analytics"
    ON user_session_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all session analytics"
    ON user_session_analytics FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Functions for Performance Monitoring

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
    start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    end_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    metric_name TEXT,
    avg_value DECIMAL(10,3),
    min_value DECIMAL(10,3),
    max_value DECIMAL(10,3),
    p95_value DECIMAL(10,3),
    count_samples BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.metric_name,
        AVG(pm.metric_value)::DECIMAL(10,3) as avg_value,
        MIN(pm.metric_value)::DECIMAL(10,3) as min_value,
        MAX(pm.metric_value)::DECIMAL(10,3) as max_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.metric_value)::DECIMAL(10,3) as p95_value,
        COUNT(*)::BIGINT as count_samples
    FROM performance_metrics pm
    WHERE pm.timestamp BETWEEN start_time AND end_time
    GROUP BY pm.metric_name
    ORDER BY pm.metric_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check performance budgets
CREATE OR REPLACE FUNCTION check_performance_budgets()
RETURNS TABLE (
    metric_name TEXT,
    current_value DECIMAL(10,3),
    budget_value DECIMAL(10,3),
    violation_percentage DECIMAL(5,2),
    samples_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_metrics AS (
        SELECT 
            pm.metric_name,
            AVG(pm.metric_value) as avg_value,
            COUNT(*) as samples_count
        FROM performance_metrics pm
        WHERE pm.timestamp >= NOW() - INTERVAL '1 hour'
        GROUP BY pm.metric_name
    )
    SELECT 
        rm.metric_name,
        rm.avg_value::DECIMAL(10,3) as current_value,
        pb.budget_value,
        ((rm.avg_value - pb.budget_value) / pb.budget_value * 100)::DECIMAL(5,2) as violation_percentage,
        rm.samples_count::BIGINT
    FROM recent_metrics rm
    INNER JOIN performance_budgets pb ON rm.metric_name = pb.metric_name
    WHERE pb.is_active = true
    AND rm.avg_value > pb.budget_value
    ORDER BY violation_percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create system health snapshot
CREATE OR REPLACE FUNCTION create_system_health_snapshot()
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
BEGIN
    INSERT INTO system_health_snapshots (
        avg_response_time,
        p95_response_time,
        p99_response_time,
        error_rate,
        throughput,
        memory_usage_mb,
        active_users,
        quiz_sessions_active,
        pending_moderation,
        avg_lcp,
        avg_fid,
        avg_cls,
        avg_ttfb
    )
    SELECT 
        (SELECT AVG(response_time_ms) FROM api_response_times WHERE timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) FROM api_response_times WHERE timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) FROM api_response_times WHERE timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0 
                ELSE (COUNT(*) FILTER (WHERE status_code >= 400)::DECIMAL / COUNT(*) * 100)
            END
         FROM api_response_times 
         WHERE timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT COUNT(*) FROM api_response_times WHERE timestamp >= NOW() - INTERVAL '1 minute'),
        (SELECT AVG(metric_value) FROM performance_metrics WHERE metric_name = 'memory_used' AND timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT COUNT(DISTINCT user_id) FROM performance_metrics WHERE timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT COUNT(*) FROM quiz_sessions WHERE status = 'in_progress' AND last_activity_at >= NOW() - INTERVAL '30 minutes'),
        (SELECT COUNT(*) FROM questions WHERE status = 'pending'),
        (SELECT AVG(metric_value) FROM performance_metrics WHERE metric_name = 'lcp' AND timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT AVG(metric_value) FROM performance_metrics WHERE metric_name = 'fid' AND timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT AVG(metric_value) FROM performance_metrics WHERE metric_name = 'cls' AND timestamp >= NOW() - INTERVAL '5 minutes'),
        (SELECT AVG(metric_value) FROM performance_metrics WHERE metric_name = 'ttfb' AND timestamp >= NOW() - INTERVAL '5 minutes')
    RETURNING id INTO snapshot_id;
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old performance data
CREATE OR REPLACE FUNCTION cleanup_performance_data()
RETURNS void AS $$
BEGIN
    -- Delete performance metrics older than 30 days
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete error reports older than 90 days (keep resolved ones for 90 days, unresolved for 180 days)
    DELETE FROM error_reports 
    WHERE (resolved_at IS NOT NULL AND resolved_at < NOW() - INTERVAL '90 days')
    OR (resolved_at IS NULL AND created_at < NOW() - INTERVAL '180 days');
    
    -- Delete old API response time data (keep for 7 days)
    DELETE FROM api_response_times 
    WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Delete old session analytics (keep for 90 days)
    DELETE FROM user_session_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete old health snapshots (keep hourly snapshots for 7 days, daily for 30 days)
    DELETE FROM system_health_snapshots 
    WHERE snapshot_time < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default performance budgets
INSERT INTO performance_budgets (metric_name, budget_value, metric_unit, description) VALUES
('lcp', 2500, 'ms', 'Largest Contentful Paint should be under 2.5 seconds'),
('fid', 100, 'ms', 'First Input Delay should be under 100ms'),
('cls', 0.1, 'score', 'Cumulative Layout Shift should be under 0.1'),
('ttfb', 600, 'ms', 'Time to First Byte should be under 600ms'),
('page_load_time', 3000, 'ms', 'Full page load should complete under 3 seconds'),
('api_response_time', 500, 'ms', 'API responses should be under 500ms'),
('db_query_time', 1000, 'ms', 'Database queries should complete under 1 second'),
('memory_used', 100, 'MB', 'Client-side memory usage should stay under 100MB')
ON CONFLICT (metric_name) DO NOTHING;

-- Trigger to update system health snapshots timestamp
CREATE OR REPLACE FUNCTION update_system_health_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for system health snapshots
CREATE TRIGGER update_system_health_snapshots_updated_at_trigger
    BEFORE UPDATE ON system_health_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_system_health_snapshots_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_performance_summary(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION check_performance_budgets() TO authenticated;
GRANT EXECUTE ON FUNCTION create_system_health_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_performance_data() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE performance_metrics IS 'Real-time performance metrics collection for web vitals and custom metrics';
COMMENT ON TABLE error_reports IS 'Application errors and exceptions for debugging and monitoring';
COMMENT ON TABLE performance_alerts IS 'Automated alerts for performance issues and threshold violations';
COMMENT ON TABLE system_health_snapshots IS 'Periodic snapshots of overall system health metrics';
COMMENT ON TABLE performance_budgets IS 'Performance budgets and thresholds for automated monitoring';
COMMENT ON TABLE api_response_times IS 'Detailed API endpoint performance tracking';
COMMENT ON TABLE user_session_analytics IS 'User session behavior and performance analytics';

COMMENT ON FUNCTION get_performance_summary IS 'Get aggregated performance metrics for a time range';
COMMENT ON FUNCTION check_performance_budgets IS 'Check current metrics against defined performance budgets';
COMMENT ON FUNCTION create_system_health_snapshot IS 'Create a snapshot of current system health';
COMMENT ON FUNCTION cleanup_performance_data IS 'Clean up old performance monitoring data';