// Teacher Group Management Service
// Comprehensive service for managing classroom groups and assignments

import { createClient } from '@/lib/supabase';

export interface GroupStatistics {
  totalMembers: number;
  activeAssignments: number;
  totalAssignments: number;
  completedAttempts: number;
  averageScore: number;
  recentActivity: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  invitation_code: string;
  invitation_expires_at: string;
  max_members: number;
  created_at: string;
  updated_at: string;
  statistics?: GroupStatistics;
  group_memberships?: GroupMembership[];
  group_assignments?: Assignment[];
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  role: 'student' | 'assistant';
  joined_at: string;
  last_activity: string;
  users?: {
    id: string;
    email: string;
  };
}

export interface Assignment {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  total_questions: number;
  time_limit_minutes: number;
  due_date?: string;
  is_active: boolean;
  question_ids: string[];
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
  assignment_attempts?: AssignmentAttempt[];
  statistics?: AssignmentStatistics;
}

export interface AssignmentAttempt {
  id: string;
  assignment_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
  users?: {
    id: string;
    email: string;
  };
}

export interface AssignmentStatistics {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
}

export interface MemberProgress {
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
  lastActivity: string;
  currentStreak: number;
  longestStreak: number;
  statistics: {
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    averageTime: number;
    completionRate: number;
  };
  recentAttempts: Array<{
    assignmentId: string;
    score: number;
    completedAt: string;
    timeTaken: number;
  }>;
}

export class TeacherGroupService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Create a new group for the teacher
   */
  async createGroup(groupData: {
    name: string;
    description?: string;
    maxMembers?: number;
  }): Promise<{ group: Group; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { group: {} as Group, error: 'User not authenticated' };
      }

      const { data: group, error } = await this.supabase
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          teacher_id: user.user.id,
          max_members: groupData.maxMembers || 50
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating group:', error);
        return { group: {} as Group, error: 'Failed to create group' };
      }

      return { group: group as Group };
    } catch (error) {
      console.error('Service error creating group:', error);
      return { group: {} as Group, error: 'Internal service error' };
    }
  }

  /**
   * Get all groups for the current teacher
   */
  async getTeacherGroups(): Promise<{ groups: Group[]; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { groups: [], error: 'User not authenticated' };
      }

      const { data: groups, error } = await this.supabase
        .from('groups')
        .select(`
          *,
          group_memberships (
            id,
            user_id,
            role,
            joined_at,
            users (
              id,
              email
            )
          ),
          group_assignments (
            id,
            title,
            is_active,
            due_date,
            created_at
          )
        `)
        .eq('teacher_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching groups:', error);
        return { groups: [], error: 'Failed to fetch groups' };
      }

      // Calculate statistics for each group
      const groupsWithStats = groups?.map(group => ({
        ...group,
        statistics: {
          totalMembers: group.group_memberships?.length || 0,
          activeAssignments: group.group_assignments?.filter((a: any) => a.is_active).length || 0,
          totalAssignments: group.group_assignments?.length || 0,
          completedAttempts: 0, // Would need additional query
          averageScore: 0, // Would need additional query
          recentActivity: 0 // Would need additional query
        } as GroupStatistics
      })) || [];

      return { groups: groupsWithStats as Group[] };
    } catch (error) {
      console.error('Service error fetching groups:', error);
      return { groups: [], error: 'Internal service error' };
    }
  }

  /**
   * Get detailed group information with members and assignments
   */
  async getGroupDetails(groupId: string): Promise<{ group: Group | null; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { group: null, error: 'User not authenticated' };
      }

      const { data: group, error } = await this.supabase
        .from('groups')
        .select(`
          *,
          group_memberships (
            id,
            user_id,
            role,
            joined_at,
            last_activity,
            users (
              id,
              email
            )
          ),
          group_assignments (
            id,
            title,
            description,
            total_questions,
            time_limit_minutes,
            due_date,
            is_active,
            created_at,
            assignment_attempts (
              id,
              user_id,
              score,
              is_completed,
              completed_at
            )
          )
        `)
        .eq('id', groupId)
        .single();

      if (error || !group) {
        return { group: null, error: 'Group not found' };
      }

      // Verify teacher owns this group
      if (group.teacher_id !== user.user.id) {
        return { group: null, error: 'Access denied' };
      }

      return { group: group as Group };
    } catch (error) {
      console.error('Service error fetching group details:', error);
      return { group: null, error: 'Internal service error' };
    }
  }

  /**
   * Create a new assignment for a group
   */
  async createAssignment(
    groupId: string,
    assignmentData: {
      title: string;
      description?: string;
      totalQuestions?: number;
      timeLimitMinutes?: number;
      dueDate?: Date;
      difficultyDistribution?: {
        easy: number;
        medium: number;
        hard: number;
      };
      questionIds?: string[];
    }
  ): Promise<{ assignment: Assignment | null; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { assignment: null, error: 'User not authenticated' };
      }

      // Verify group ownership
      const { data: group } = await this.supabase
        .from('groups')
        .select('teacher_id')
        .eq('id', groupId)
        .single();

      if (!group || group.teacher_id !== user.user.id) {
        return { assignment: null, error: 'Access denied' };
      }

      let questionIds = assignmentData.questionIds || [];

      // If no custom questions, auto-select from approved questions
      if (questionIds.length === 0) {
        const totalQuestions = assignmentData.totalQuestions || 5;
        const distribution = assignmentData.difficultyDistribution || { easy: 40, medium: 40, hard: 20 };

        const { data: questions } = await this.supabase
          .from('questions')
          .select('id, difficulty')
          .not('approved_at', 'is', null)
          .limit(totalQuestions * 2); // Get more than needed for variety

        if (!questions || questions.length < totalQuestions) {
          return { assignment: null, error: 'Not enough approved questions available' };
        }

        // Distribute questions by difficulty
        const easyCount = Math.round((distribution.easy / 100) * totalQuestions);
        const mediumCount = Math.round((distribution.medium / 100) * totalQuestions);
        const hardCount = totalQuestions - easyCount - mediumCount;

        const easyQuestions = questions.filter(q => q.difficulty === 'easy').slice(0, easyCount);
        const mediumQuestions = questions.filter(q => q.difficulty === 'medium').slice(0, mediumCount);
        const hardQuestions = questions.filter(q => q.difficulty === 'hard').slice(0, hardCount);

        questionIds = [
          ...easyQuestions.map(q => q.id),
          ...mediumQuestions.map(q => q.id),
          ...hardQuestions.map(q => q.id)
        ].slice(0, totalQuestions);
      }

      const { data: assignment, error } = await this.supabase
        .from('group_assignments')
        .insert({
          group_id: groupId,
          title: assignmentData.title,
          description: assignmentData.description,
          total_questions: assignmentData.totalQuestions || 5,
          time_limit_minutes: assignmentData.timeLimitMinutes || 30,
          due_date: assignmentData.dueDate?.toISOString(),
          question_ids: questionIds,
          difficulty_distribution: assignmentData.difficultyDistribution || { easy: 40, medium: 40, hard: 20 },
          created_by: user.user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment:', error);
        return { assignment: null, error: 'Failed to create assignment' };
      }

      return { assignment: assignment as Assignment };
    } catch (error) {
      console.error('Service error creating assignment:', error);
      return { assignment: null, error: 'Internal service error' };
    }
  }

  /**
   * Get group progress analytics
   */
  async getGroupProgress(
    groupId: string,
    timeframe: '1d' | '7d' | '30d' | 'all' = '7d'
  ): Promise<{ 
    members: MemberProgress[]; 
    groupStats: any; 
    error?: string 
  }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { members: [], groupStats: {}, error: 'User not authenticated' };
      }

      // Calculate time filter
      let timeFilter = '1970-01-01T00:00:00Z';
      const now = new Date();
      
      switch (timeframe) {
        case '1d':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
      }

      // Get group members with their progress
      const { data: members, error: membersError } = await this.supabase
        .from('group_memberships')
        .select(`
          user_id,
          role,
          joined_at,
          last_activity,
          users!inner (
            id,
            email,
            streaks (
              current_streak,
              longest_streak
            )
          )
        `)
        .eq('group_id', groupId);

      if (membersError) {
        return { members: [], groupStats: {}, error: 'Failed to fetch members' };
      }

      // Get assignment attempts for progress calculation
      const { data: attempts } = await this.supabase
        .from('assignment_attempts')
        .select(`
          user_id,
          assignment_id,
          score,
          is_completed,
          completed_at,
          time_taken_seconds,
          group_assignments!inner (
            group_id
          )
        `)
        .eq('group_assignments.group_id', groupId)
        .gte('completed_at', timeFilter)
        .not('completed_at', 'is', null);

      // Calculate progress for each member
      const memberProgress: MemberProgress[] = members?.map(member => {
        const userAttempts = attempts?.filter(attempt => attempt.user_id === member.user_id) || [];
        const completedAttempts = userAttempts.filter(attempt => attempt.is_completed);
        
        return {
          userId: member.user_id,
          email: member.users.email,
          role: member.role,
          joinedAt: member.joined_at,
          lastActivity: member.last_activity,
          currentStreak: member.users.streaks?.[0]?.current_streak || 0,
          longestStreak: member.users.streaks?.[0]?.longest_streak || 0,
          statistics: {
            totalAttempts: userAttempts.length,
            completedAttempts: completedAttempts.length,
            averageScore: completedAttempts.length > 0
              ? Math.round(
                  completedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) 
                  / completedAttempts.length * 100
                ) / 100
              : 0,
            averageTime: completedAttempts.length > 0
              ? Math.round(
                  completedAttempts.reduce((sum, attempt) => sum + attempt.time_taken_seconds, 0)
                  / completedAttempts.length
                )
              : 0,
            completionRate: userAttempts.length > 0 
              ? Math.round((completedAttempts.length / userAttempts.length) * 100)
              : 0
          },
          recentAttempts: completedAttempts.slice(-5).map(attempt => ({
            assignmentId: attempt.assignment_id,
            score: attempt.score,
            completedAt: attempt.completed_at!,
            timeTaken: attempt.time_taken_seconds
          }))
        };
      }) || [];

      // Calculate group-wide statistics
      const allAttempts = attempts || [];
      const allCompleted = allAttempts.filter(attempt => attempt.is_completed);
      
      const groupStats = {
        totalMembers: members?.length || 0,
        totalAttempts: allAttempts.length,
        completedAttempts: allCompleted.length,
        averageScore: allCompleted.length > 0
          ? Math.round(
              allCompleted.reduce((sum, attempt) => sum + attempt.score, 0) 
              / allCompleted.length * 100
            ) / 100
          : 0,
        completionRate: allAttempts.length > 0 
          ? Math.round((allCompleted.length / allAttempts.length) * 100)
          : 0
      };

      return { members: memberProgress, groupStats };
    } catch (error) {
      console.error('Service error getting group progress:', error);
      return { members: [], groupStats: {}, error: 'Internal service error' };
    }
  }

  /**
   * Generate new invitation code for a group
   */
  async regenerateInvitationCode(groupId: string): Promise<{ invitationCode?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { error: 'User not authenticated' };
      }

      // Call the database function to regenerate code
      const { data, error } = await this.supabase.rpc(
        'regenerate_invitation_code',
        { group_uuid: groupId }
      );

      if (error) {
        console.error('Error regenerating invitation code:', error);
        return { error: 'Failed to regenerate invitation code' };
      }

      return { invitationCode: data };
    } catch (error) {
      console.error('Service error regenerating invitation code:', error);
      return { error: 'Internal service error' };
    }
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify group ownership
      const { data: group } = await this.supabase
        .from('groups')
        .select('teacher_id')
        .eq('id', groupId)
        .single();

      if (!group || group.teacher_id !== user.user.id) {
        return { success: false, error: 'Access denied' };
      }

      const { error } = await this.supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        return { success: false, error: 'Failed to remove member' };
      }

      return { success: true };
    } catch (error) {
      console.error('Service error removing member:', error);
      return { success: false, error: 'Internal service error' };
    }
  }
}

// Export singleton instance
export const teacherGroupService = new TeacherGroupService();