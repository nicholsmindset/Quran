-- Teacher Group Management System Schema
-- Sprint 2: Group assignments and classroom management

-- Groups table for teacher-managed classes
CREATE TABLE groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    invitation_code VARCHAR(10) UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 10),
    invitation_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    max_members INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT groups_name_length CHECK (length(name) >= 3 AND length(name) <= 255),
    CONSTRAINT groups_teacher_role CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = teacher_id AND role IN ('teacher', 'scholar')
        )
    )
);

-- Group memberships for student enrollment
CREATE TABLE group_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'assistant')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Group assignments for quiz distribution
CREATE TABLE group_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    question_ids UUID[] NOT NULL DEFAULT '{}',
    difficulty_distribution JSONB DEFAULT '{"easy": 40, "medium": 40, "hard": 20}'::jsonb,
    total_questions INTEGER DEFAULT 5 CHECK (total_questions >= 1 AND total_questions <= 20),
    time_limit_minutes INTEGER DEFAULT 30,
    due_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT assignments_title_length CHECK (length(title) >= 3),
    CONSTRAINT assignments_creator_access CHECK (
        created_by IN (
            SELECT teacher_id FROM groups WHERE id = group_id
            UNION
            SELECT user_id FROM group_memberships 
            WHERE group_id = group_assignments.group_id AND role = 'assistant'
        )
    )
);

-- Assignment attempts for tracking student progress
CREATE TABLE assignment_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES group_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    score DECIMAL(5,2) DEFAULT 0.00 CHECK (score >= 0 AND score <= 100),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    
    UNIQUE(assignment_id, user_id),
    CONSTRAINT attempts_score_logic CHECK (
        (is_completed = false) OR 
        (is_completed = true AND completed_at IS NOT NULL AND score IS NOT NULL)
    )
);

-- Group activity logs for audit trail
CREATE TABLE group_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'joined', 'left', 'assignment_created', 'assignment_completed', 
        'assignment_started', 'member_added', 'member_removed'
    )),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_groups_teacher_id ON groups(teacher_id);
CREATE INDEX idx_groups_invitation_code ON groups(invitation_code) WHERE invitation_expires_at > NOW();
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_assignments_group_id ON group_assignments(group_id);
CREATE INDEX idx_group_assignments_due_date ON group_assignments(due_date) WHERE is_active = true;
CREATE INDEX idx_assignment_attempts_assignment_id ON assignment_attempts(assignment_id);
CREATE INDEX idx_assignment_attempts_user_id ON assignment_attempts(user_id);
CREATE INDEX idx_group_activity_logs_group_id ON group_activity_logs(group_id);
CREATE INDEX idx_group_activity_logs_created_at ON group_activity_logs(created_at);

-- Row Level Security Policies

-- Groups RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Teachers can see their own groups
CREATE POLICY "groups_teacher_access" ON groups
    FOR ALL USING (teacher_id = auth.uid());

-- Students can see groups they belong to
CREATE POLICY "groups_member_access" ON groups
    FOR SELECT USING (
        id IN (
            SELECT group_id FROM group_memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Group Memberships RLS
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their group memberships
CREATE POLICY "memberships_teacher_manage" ON group_memberships
    FOR ALL USING (
        group_id IN (
            SELECT id FROM groups WHERE teacher_id = auth.uid()
        )
    );

-- Users can see their own memberships
CREATE POLICY "memberships_own_access" ON group_memberships
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own memberships (joining groups)
CREATE POLICY "memberships_self_join" ON group_memberships
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Group Assignments RLS
ALTER TABLE group_assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can manage assignments for their groups
CREATE POLICY "assignments_teacher_manage" ON group_assignments
    FOR ALL USING (
        group_id IN (
            SELECT id FROM groups WHERE teacher_id = auth.uid()
        )
    );

-- Group members can see assignments
CREATE POLICY "assignments_member_access" ON group_assignments
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Assignment Attempts RLS
ALTER TABLE assignment_attempts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own attempts
CREATE POLICY "attempts_own_access" ON assignment_attempts
    FOR ALL USING (user_id = auth.uid());

-- Teachers can view attempts for their group assignments
CREATE POLICY "attempts_teacher_view" ON assignment_attempts
    FOR SELECT USING (
        assignment_id IN (
            SELECT id FROM group_assignments ga
            JOIN groups g ON ga.group_id = g.id
            WHERE g.teacher_id = auth.uid()
        )
    );

-- Group Activity Logs RLS
ALTER TABLE group_activity_logs ENABLE ROW LEVEL SECURITY;

-- Teachers and group members can view activity logs
CREATE POLICY "activity_logs_access" ON group_activity_logs
    FOR SELECT USING (
        group_id IN (
            SELECT id FROM groups WHERE teacher_id = auth.uid()
            UNION
            SELECT group_id FROM group_memberships WHERE user_id = auth.uid()
        )
    );

-- Only system can insert activity logs
CREATE POLICY "activity_logs_system_insert" ON group_activity_logs
    FOR INSERT WITH CHECK (true);

-- Functions and Triggers

-- Function to update group updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for groups updated_at
CREATE TRIGGER trigger_update_group_timestamp
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_group_timestamp();

-- Function to update assignment updated_at timestamp
CREATE OR REPLACE FUNCTION update_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assignments updated_at
CREATE TRIGGER trigger_update_assignment_timestamp
    BEFORE UPDATE ON group_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_timestamp();

-- Function to log group activities
CREATE OR REPLACE FUNCTION log_group_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Log new membership
        IF TG_TABLE_NAME = 'group_memberships' THEN
            INSERT INTO group_activity_logs (group_id, user_id, action, details)
            VALUES (NEW.group_id, NEW.user_id, 'joined', 
                    jsonb_build_object('role', NEW.role));
        END IF;
        
        -- Log new assignment
        IF TG_TABLE_NAME = 'group_assignments' THEN
            INSERT INTO group_activity_logs (group_id, user_id, action, details)
            VALUES (NEW.group_id, NEW.created_by, 'assignment_created',
                    jsonb_build_object('assignment_title', NEW.title, 'assignment_id', NEW.id));
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Log assignment completion
        IF TG_TABLE_NAME = 'assignment_attempts' AND OLD.is_completed = false AND NEW.is_completed = true THEN
            INSERT INTO group_activity_logs (group_id, user_id, action, details)
            SELECT ga.group_id, NEW.user_id, 'assignment_completed',
                   jsonb_build_object('assignment_id', NEW.assignment_id, 'score', NEW.score)
            FROM group_assignments ga WHERE ga.id = NEW.assignment_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Log membership removal
        IF TG_TABLE_NAME = 'group_memberships' THEN
            INSERT INTO group_activity_logs (group_id, user_id, action, details)
            VALUES (OLD.group_id, OLD.user_id, 'left',
                    jsonb_build_object('role', OLD.role));
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for activity logging
CREATE TRIGGER trigger_log_membership_activity
    AFTER INSERT OR DELETE ON group_memberships
    FOR EACH ROW
    EXECUTE FUNCTION log_group_activity();

CREATE TRIGGER trigger_log_assignment_activity
    AFTER INSERT ON group_assignments
    FOR EACH ROW
    EXECUTE FUNCTION log_group_activity();

CREATE TRIGGER trigger_log_attempt_activity
    AFTER UPDATE ON assignment_attempts
    FOR EACH ROW
    EXECUTE FUNCTION log_group_activity();

-- Function to generate new invitation codes
CREATE OR REPLACE FUNCTION regenerate_invitation_code(group_uuid UUID)
RETURNS VARCHAR(10) AS $$
DECLARE
    new_code VARCHAR(10);
BEGIN
    -- Generate unique code
    LOOP
        new_code := upper(substr(md5(random()::text), 1, 6));
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM groups 
            WHERE invitation_code = new_code 
            AND invitation_expires_at > NOW()
        );
    END LOOP;
    
    -- Update group with new code
    UPDATE groups 
    SET invitation_code = new_code,
        invitation_expires_at = NOW() + INTERVAL '7 days',
        updated_at = NOW()
    WHERE id = group_uuid;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate group statistics
CREATE OR REPLACE FUNCTION get_group_statistics(group_uuid UUID)
RETURNS TABLE (
    total_members INTEGER,
    active_assignments INTEGER,
    completed_assignments INTEGER,
    average_score DECIMAL(5,2),
    recent_activity_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM group_memberships WHERE group_id = group_uuid),
        (SELECT COUNT(*)::INTEGER FROM group_assignments 
         WHERE group_id = group_uuid AND is_active = true),
        (SELECT COUNT(*)::INTEGER FROM assignment_attempts aa
         JOIN group_assignments ga ON aa.assignment_id = ga.id
         WHERE ga.group_id = group_uuid AND aa.is_completed = true),
        (SELECT COALESCE(AVG(aa.score), 0.00)::DECIMAL(5,2) FROM assignment_attempts aa
         JOIN group_assignments ga ON aa.assignment_id = ga.id
         WHERE ga.group_id = group_uuid AND aa.is_completed = true),
        (SELECT COUNT(*)::INTEGER FROM group_activity_logs 
         WHERE group_id = group_uuid AND created_at > NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;