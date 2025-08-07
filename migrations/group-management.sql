-- Teacher Group Management System Database Schema
-- Sprint 2: US009-US010 Implementation

-- Create enum for group member roles
CREATE TYPE group_member_role AS ENUM ('student', 'assistant');

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    invite_code VARCHAR(32) NOT NULL UNIQUE,
    invite_code_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT groups_name_length CHECK (char_length(name) BETWEEN 1 AND 255),
    CONSTRAINT groups_teacher_role CHECK (
        (SELECT role FROM users WHERE id = teacher_id) IN ('teacher', 'scholar')
    )
);

-- Group Memberships Table
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role group_member_role NOT NULL DEFAULT 'student',
    joined_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unique constraint to prevent duplicate memberships
    UNIQUE(group_id, user_id),
    
    -- Constraint to prevent teachers from joining as students
    CONSTRAINT membership_role_check CHECK (
        role = 'student' OR 
        (role = 'assistant' AND (SELECT role FROM users WHERE id = user_id) IN ('teacher', 'scholar'))
    )
);

-- Group Assignments Table
CREATE TABLE IF NOT EXISTS group_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    question_ids UUID[] NOT NULL,
    due_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT assignments_title_length CHECK (char_length(title) BETWEEN 1 AND 255),
    CONSTRAINT assignments_questions_not_empty CHECK (array_length(question_ids, 1) > 0),
    CONSTRAINT assignments_creator_is_teacher CHECK (
        created_by = (SELECT teacher_id FROM groups WHERE id = group_id) OR
        created_by IN (
            SELECT user_id FROM group_memberships 
            WHERE group_id = group_assignments.group_id AND role = 'assistant'
        )
    )
);

-- Group Invites Table (for tracking invitation codes)
CREATE TABLE IF NOT EXISTS group_invites (
    code VARCHAR(32) PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT invites_max_uses_positive CHECK (max_uses IS NULL OR max_uses > 0),
    CONSTRAINT invites_current_uses_valid CHECK (
        current_uses >= 0 AND 
        (max_uses IS NULL OR current_uses <= max_uses)
    )
);

-- Assignment Results Table
CREATE TABLE IF NOT EXISTS assignment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES group_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_spent INTEGER NOT NULL, -- in minutes
    completed_at TIMESTAMPTZ DEFAULT now(),
    answers JSONB NOT NULL, -- Array of AssignmentAnswer objects
    
    -- Unique constraint to prevent duplicate results
    UNIQUE(assignment_id, user_id),
    
    -- Constraints
    CONSTRAINT results_score_valid CHECK (score >= 0 AND score <= 100),
    CONSTRAINT results_correct_answers_valid CHECK (
        correct_answers >= 0 AND correct_answers <= total_questions
    ),
    CONSTRAINT results_time_positive CHECK (time_spent > 0),
    CONSTRAINT results_user_in_group CHECK (
        user_id IN (
            SELECT gm.user_id FROM group_memberships gm
            JOIN group_assignments ga ON ga.group_id = gm.group_id
            WHERE ga.id = assignment_id
        )
    )
);

-- Indexes for Performance Optimization

-- Groups indexes
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);

-- Group memberships indexes
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_composite ON group_memberships(group_id, user_id);

-- Group assignments indexes
CREATE INDEX IF NOT EXISTS idx_group_assignments_group_id ON group_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_group_assignments_created_by ON group_assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_group_assignments_due_date ON group_assignments(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_assignments_is_active ON group_assignments(is_active) WHERE is_active = true;

-- Group invites indexes
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_expires_at ON group_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_group_invites_is_active ON group_invites(is_active) WHERE is_active = true;

-- Assignment results indexes
CREATE INDEX IF NOT EXISTS idx_assignment_results_assignment_id ON assignment_results(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_results_user_id ON assignment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_results_completed_at ON assignment_results(completed_at DESC);

-- Triggers for updated_at timestamps

-- Groups updated_at trigger
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_groups_updated_at();

-- Group assignments updated_at trigger
CREATE OR REPLACE FUNCTION update_group_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_assignments_updated_at
    BEFORE UPDATE ON group_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_group_assignments_updated_at();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_results ENABLE ROW LEVEL SECURITY;

-- Groups RLS Policies
-- Teachers can manage their own groups
CREATE POLICY "Teachers can manage their own groups"
ON groups
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Students can view groups they belong to
CREATE POLICY "Students can view their groups"
ON groups
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT group_id FROM group_memberships 
        WHERE user_id = auth.uid()
    )
);

-- Group Memberships RLS Policies
-- Teachers can manage memberships in their groups
CREATE POLICY "Teachers can manage group memberships"
ON group_memberships
FOR ALL
TO authenticated
USING (
    group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid())
)
WITH CHECK (
    group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid())
);

-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
ON group_memberships
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Group Assignments RLS Policies
-- Teachers can manage assignments in their groups
CREATE POLICY "Teachers can manage group assignments"
ON group_assignments
FOR ALL
TO authenticated
USING (
    group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid()) OR
    created_by = auth.uid()
)
WITH CHECK (
    group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid()) OR
    created_by = auth.uid()
);

-- Students can view assignments in their groups
CREATE POLICY "Students can view group assignments"
ON group_assignments
FOR SELECT
TO authenticated
USING (
    group_id IN (
        SELECT group_id FROM group_memberships 
        WHERE user_id = auth.uid()
    )
);

-- Group Invites RLS Policies
-- Teachers can manage invites for their groups
CREATE POLICY "Teachers can manage group invites"
ON group_invites
FOR ALL
TO authenticated
USING (
    group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid())
)
WITH CHECK (
    group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid())
);

-- Anyone can view active invites (for joining)
CREATE POLICY "Anyone can view active invites"
ON group_invites
FOR SELECT
TO authenticated
USING (is_active = true AND expires_at > now());

-- Assignment Results RLS Policies
-- Teachers can view results for their group assignments
CREATE POLICY "Teachers can view assignment results"
ON assignment_results
FOR SELECT
TO authenticated
USING (
    assignment_id IN (
        SELECT ga.id FROM group_assignments ga
        JOIN groups g ON g.id = ga.group_id
        WHERE g.teacher_id = auth.uid()
    )
);

-- Students can view and create their own results
CREATE POLICY "Students can manage their own results"
ON assignment_results
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Utility Functions

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(32) AS $$
DECLARE
    chars VARCHAR(62) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result VARCHAR(32) := '';
    i INTEGER;
    char_index INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        char_index := floor(random() * length(chars) + 1);
        result := result || substr(chars, char_index, 1);
    END LOOP;
    
    -- Ensure uniqueness
    WHILE EXISTS(SELECT 1 FROM groups WHERE invite_code = result) OR 
          EXISTS(SELECT 1 FROM group_invites WHERE code = result) LOOP
        result := '';
        FOR i IN 1..8 LOOP
            char_index := floor(random() * length(chars) + 1);
            result := result || substr(chars, char_index, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate invite code for new groups
CREATE OR REPLACE FUNCTION auto_generate_group_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
        NEW.invite_code := generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_group_invite_code
    BEFORE INSERT ON groups
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_group_invite_code();

-- Function to validate question IDs exist and are approved
CREATE OR REPLACE FUNCTION validate_assignment_questions()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if all question IDs exist and are approved
    IF NOT (
        SELECT COUNT(*) = array_length(NEW.question_ids, 1)
        FROM questions 
        WHERE id = ANY(NEW.question_ids) 
        AND (approved_at IS NOT NULL OR status = 'approved')
    ) THEN
        RAISE EXCEPTION 'All questions must exist and be approved';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_assignment_questions
    BEFORE INSERT OR UPDATE ON group_assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_assignment_questions();

-- Views for Analytics and Reporting

-- Group member count view
CREATE OR REPLACE VIEW group_member_counts AS
SELECT 
    g.id as group_id,
    g.name,
    g.teacher_id,
    COUNT(gm.user_id) as member_count,
    COUNT(CASE WHEN gm.role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN gm.role = 'assistant' THEN 1 END) as assistant_count
FROM groups g
LEFT JOIN group_memberships gm ON g.id = gm.group_id
GROUP BY g.id, g.name, g.teacher_id;

-- Assignment completion statistics
CREATE OR REPLACE VIEW assignment_completion_stats AS
SELECT 
    ga.id as assignment_id,
    ga.title,
    ga.group_id,
    COUNT(gm.user_id) as total_members,
    COUNT(ar.user_id) as completed_count,
    ROUND(
        CASE 
            WHEN COUNT(gm.user_id) > 0 
            THEN (COUNT(ar.user_id)::NUMERIC / COUNT(gm.user_id)) * 100 
            ELSE 0 
        END, 2
    ) as completion_percentage,
    AVG(ar.score) as average_score,
    MIN(ar.score) as min_score,
    MAX(ar.score) as max_score
FROM group_assignments ga
LEFT JOIN group_memberships gm ON ga.group_id = gm.group_id
LEFT JOIN assignment_results ar ON ga.id = ar.assignment_id AND gm.user_id = ar.user_id
WHERE ga.is_active = true
GROUP BY ga.id, ga.title, ga.group_id;

-- Student progress summary
CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
    gm.user_id,
    gm.group_id,
    u.email as student_email,
    COUNT(ga.id) as total_assignments,
    COUNT(ar.id) as completed_assignments,
    ROUND(
        CASE 
            WHEN COUNT(ga.id) > 0 
            THEN (COUNT(ar.id)::NUMERIC / COUNT(ga.id)) * 100 
            ELSE 0 
        END, 2
    ) as completion_rate,
    AVG(ar.score) as average_score,
    MAX(ar.completed_at) as last_activity
FROM group_memberships gm
JOIN users u ON gm.user_id = u.id
LEFT JOIN group_assignments ga ON gm.group_id = ga.group_id AND ga.is_active = true
LEFT JOIN assignment_results ar ON ga.id = ar.assignment_id AND gm.user_id = ar.user_id
WHERE gm.role = 'student'
GROUP BY gm.user_id, gm.group_id, u.email;

-- Grant permissions for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant read permissions for authenticated users
GRANT SELECT ON group_member_counts TO authenticated;
GRANT SELECT ON assignment_completion_stats TO authenticated;  
GRANT SELECT ON student_progress_summary TO authenticated;