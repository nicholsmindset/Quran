import { createServerSupabaseClient } from './supabase'
import type { 
  Group, 
  GroupMembership, 
  GroupAssignment, 
  GroupInvite,
  CreateGroupRequest,
  CreateAssignmentRequest,
  GenerateInviteRequest,
  GroupProgress,
  StudentProgress,
  AssignmentResult,
  GroupAnalytics,
  ApiResponse
} from '@/types'

export class GroupManagementService {
  private _supabase: ReturnType<typeof createServerSupabaseClient> | null = null;
  private get supabase() {
    if (!this._supabase) {
      this._supabase = createServerSupabaseClient();
    }
    return this._supabase;
  }

  // Group Management
  async createGroup(teacherId: string, data: CreateGroupRequest): Promise<ApiResponse<Group>> {
    try {
      // Verify teacher role
      const { data: teacher } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', teacherId)
        .single()

      if (!teacher || !['teacher', 'scholar'].includes(teacher.role)) {
        return { success: false, error: 'Only teachers can create groups' }
      }

      const { data: group, error } = await this.supabase
        .from('groups')
        .insert({
          name: data.name,
          description: data.description,
          teacher_id: teacherId
        })
        .select(`
          *,
          teacher:users(id, email, role)
        `)
        .single()

      if (error) {
        console.error('Error creating group:', error)
        return { success: false, error: 'Failed to create group' }
      }

      return { 
        success: true, 
        data: this.transformGroupRow(group) 
      }
    } catch (error) {
      console.error('Error in createGroup:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async getTeacherGroups(teacherId: string): Promise<ApiResponse<Group[]>> {
    try {
      const { data, error } = await this.supabase
        .from('groups')
        .select(`
          *,
          teacher:users(id, email, role),
          member_count:group_member_counts(member_count)
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching teacher groups:', error)
        return { success: false, error: 'Failed to fetch groups' }
      }

      const transformedGroups = data?.map(group => ({
        ...this.transformGroupRow(group),
        memberCount: group.member_count?.[0]?.member_count || 0
      })) || []

      return { success: true, data: transformedGroups }
    } catch (error) {
      console.error('Error in getTeacherGroups:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async getGroup(groupId: string, userId: string): Promise<ApiResponse<Group>> {
    try {
      const { data, error } = await this.supabase
        .from('groups')
        .select(`
          *,
          teacher:users(id, email, role),
          member_count:group_member_counts(member_count)
        `)
        .eq('id', groupId)
        .single()

      if (error) {
        console.error('Error fetching group:', error)
        return { success: false, error: 'Group not found' }
      }

      // Check if user has access to this group
      const hasAccess = await this.userHasGroupAccess(userId, groupId)
      if (!hasAccess) {
        return { success: false, error: 'Access denied' }
      }

      const transformedGroup = {
        ...this.transformGroupRow(data),
        memberCount: data.member_count?.[0]?.member_count || 0
      }

      return { success: true, data: transformedGroup }
    } catch (error) {
      console.error('Error in getGroup:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async updateGroup(groupId: string, teacherId: string, updates: Partial<CreateGroupRequest>): Promise<ApiResponse<Group>> {
    try {
      const { data, error } = await this.supabase
        .from('groups')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
        .eq('teacher_id', teacherId)
        .select(`
          *,
          teacher:users(id, email, role)
        `)
        .single()

      if (error) {
        console.error('Error updating group:', error)
        return { success: false, error: 'Failed to update group' }
      }

      return { success: true, data: this.transformGroupRow(data) }
    } catch (error) {
      console.error('Error in updateGroup:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async deleteGroup(groupId: string, teacherId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('teacher_id', teacherId)

      if (error) {
        console.error('Error deleting group:', error)
        return { success: false, error: 'Failed to delete group' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteGroup:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Group Membership Management
  async generateInvite(groupId: string, teacherId: string, options: GenerateInviteRequest = {}): Promise<ApiResponse<GroupInvite>> {
    try {
      // Verify teacher owns the group
      const { data: group } = await this.supabase
        .from('groups')
        .select('teacher_id')
        .eq('id', groupId)
        .single()

      if (!group || group.teacher_id !== teacherId) {
        return { success: false, error: 'Access denied' }
      }

      const expiresInHours = options.expiresInHours || 48
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + expiresInHours)

      const { data, error } = await this.supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          created_by: teacherId,
          expires_at: expiresAt.toISOString(),
          max_uses: options.maxUses || null,
          current_uses: 0,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating invite:', error)
        return { success: false, error: 'Failed to create invite' }
      }

      return { success: true, data: this.transformInviteRow(data) }
    } catch (error) {
      console.error('Error in generateInvite:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async joinGroupByCode(userId: string, inviteCode: string): Promise<ApiResponse<Group>> {
    try {
      // Check if invite code is valid
      const { data: invite, error: inviteError } = await this.supabase
        .from('group_invites')
        .select(`
          *,
          group:groups(*)
        `)
        .eq('code', inviteCode)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (inviteError || !invite) {
        return { success: false, error: 'Invalid or expired invite code' }
      }

      // Check max uses
      if (invite.max_uses && invite.current_uses >= invite.max_uses) {
        return { success: false, error: 'Invite code has reached maximum uses' }
      }

      // Check if user is already a member
      const { data: existingMembership } = await this.supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', userId)
        .single()

      if (existingMembership) {
        return { success: false, error: 'You are already a member of this group' }
      }

      // Get user role to determine membership role
      const { data: user } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      const memberRole = ['teacher', 'scholar'].includes(user?.role) ? 'assistant' : 'student'

      // Start transaction
      const { error: membershipError } = await this.supabase
        .from('group_memberships')
        .insert({
          group_id: invite.group_id,
          user_id: userId,
          role: memberRole
        })

      if (membershipError) {
        console.error('Error creating membership:', membershipError)
        return { success: false, error: 'Failed to join group' }
      }

      // Update invite usage count
      await this.supabase
        .from('group_invites')
        .update({ current_uses: invite.current_uses + 1 })
        .eq('code', inviteCode)

      return { 
        success: true, 
        data: this.transformGroupRow(invite.group) 
      }
    } catch (error) {
      console.error('Error in joinGroupByCode:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async getGroupMembers(groupId: string, requesterId: string): Promise<ApiResponse<GroupMembership[]>> {
    try {
      // Check if requester has access to group
      const hasAccess = await this.userHasGroupAccess(requesterId, groupId)
      if (!hasAccess) {
        return { success: false, error: 'Access denied' }
      }

      const { data, error } = await this.supabase
        .from('group_memberships')
        .select(`
          *,
          user:users(id, email, role),
          group:groups(id, name)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('Error fetching group members:', error)
        return { success: false, error: 'Failed to fetch members' }
      }

      const transformedMembers = data?.map(this.transformMembershipRow) || []
      return { success: true, data: transformedMembers }
    } catch (error) {
      console.error('Error in getGroupMembers:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async removeGroupMember(groupId: string, userId: string, teacherId: string): Promise<ApiResponse<void>> {
    try {
      // Verify teacher owns the group
      const { data: group } = await this.supabase
        .from('groups')
        .select('teacher_id')
        .eq('id', groupId)
        .single()

      if (!group || group.teacher_id !== teacherId) {
        return { success: false, error: 'Access denied' }
      }

      const { error } = await this.supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error removing member:', error)
        return { success: false, error: 'Failed to remove member' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in removeGroupMember:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Assignment Management
  async createAssignment(groupId: string, creatorId: string, data: CreateAssignmentRequest): Promise<ApiResponse<GroupAssignment>> {
    try {
      // Verify creator has permission to create assignments
      const hasPermission = await this.userCanManageGroup(creatorId, groupId)
      if (!hasPermission) {
        return { success: false, error: 'Access denied' }
      }

      const { data: assignment, error } = await this.supabase
        .from('group_assignments')
        .insert({
          group_id: groupId,
          title: data.title,
          description: data.description,
          question_ids: data.questionIds,
          due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          created_by: creatorId,
          is_active: true
        })
        .select(`
          *,
          group:groups(id, name),
          creator:users(id, email)
        `)
        .single()

      if (error) {
        console.error('Error creating assignment:', error)
        return { success: false, error: 'Failed to create assignment' }
      }

      return { success: true, data: this.transformAssignmentRow(assignment) }
    } catch (error) {
      console.error('Error in createAssignment:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async getGroupAssignments(groupId: string, userId: string): Promise<ApiResponse<GroupAssignment[]>> {
    try {
      // Check if user has access to group
      const hasAccess = await this.userHasGroupAccess(userId, groupId)
      if (!hasAccess) {
        return { success: false, error: 'Access denied' }
      }

      const { data, error } = await this.supabase
        .from('group_assignments')
        .select(`
          *,
          group:groups(id, name),
          creator:users(id, email),
          completion_stats:assignment_completion_stats(completed_count, total_members, completion_percentage, average_score)
        `)
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching assignments:', error)
        return { success: false, error: 'Failed to fetch assignments' }
      }

      const transformedAssignments = data?.map(assignment => ({
        ...this.transformAssignmentRow(assignment),
        completionCount: assignment.completion_stats?.[0]?.completed_count || 0,
        totalMembers: assignment.completion_stats?.[0]?.total_members || 0
      })) || []

      return { success: true, data: transformedAssignments }
    } catch (error) {
      console.error('Error in getGroupAssignments:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async getAssignmentDetails(assignmentId: string, userId: string): Promise<ApiResponse<GroupAssignment>> {
    try {
      const { data, error } = await this.supabase
        .from('group_assignments')
        .select(`
          *,
          group:groups(id, name),
          creator:users(id, email),
          questions:questions(*)
        `)
        .eq('id', assignmentId)
        .single()

      if (error) {
        console.error('Error fetching assignment:', error)
        return { success: false, error: 'Assignment not found' }
      }

      // Check if user has access to this assignment's group
      const hasAccess = await this.userHasGroupAccess(userId, data.group_id)
      if (!hasAccess) {
        return { success: false, error: 'Access denied' }
      }

      const transformedAssignment = {
        ...this.transformAssignmentRow(data),
        questions: data.questions?.map(q => ({
          ...q,
          verseId: q.verse_id,
          createdBy: q.created_by,
          createdAt: new Date(q.created_at),
          approvedAt: q.approved_at ? new Date(q.approved_at) : undefined
        })) || []
      }

      return { success: true, data: transformedAssignment }
    } catch (error) {
      console.error('Error in getAssignmentDetails:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async updateAssignment(assignmentId: string, userId: string, updates: Partial<CreateAssignmentRequest>): Promise<ApiResponse<GroupAssignment>> {
    try {
      // Check if user can manage the assignment
      const { data: assignment } = await this.supabase
        .from('group_assignments')
        .select('group_id, created_by')
        .eq('id', assignmentId)
        .single()

      if (!assignment) {
        return { success: false, error: 'Assignment not found' }
      }

      const canManage = assignment.created_by === userId || 
                       await this.userCanManageGroup(userId, assignment.group_id)
      
      if (!canManage) {
        return { success: false, error: 'Access denied' }
      }

      const updateData: any = { updated_at: new Date().toISOString() }
      if (updates.title) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.questionIds) updateData.question_ids = updates.questionIds
      if (updates.dueDate !== undefined) {
        updateData.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null
      }

      const { data, error } = await this.supabase
        .from('group_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select(`
          *,
          group:groups(id, name),
          creator:users(id, email)
        `)
        .single()

      if (error) {
        console.error('Error updating assignment:', error)
        return { success: false, error: 'Failed to update assignment' }
      }

      return { success: true, data: this.transformAssignmentRow(data) }
    } catch (error) {
      console.error('Error in updateAssignment:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async deleteAssignment(assignmentId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      // Check if user can manage the assignment
      const { data: assignment } = await this.supabase
        .from('group_assignments')
        .select('group_id, created_by')
        .eq('id', assignmentId)
        .single()

      if (!assignment) {
        return { success: false, error: 'Assignment not found' }
      }

      const canManage = assignment.created_by === userId || 
                       await this.userCanManageGroup(userId, assignment.group_id)
      
      if (!canManage) {
        return { success: false, error: 'Access denied' }
      }

      // Soft delete by marking as inactive
      const { error } = await this.supabase
        .from('group_assignments')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', assignmentId)

      if (error) {
        console.error('Error deleting assignment:', error)
        return { success: false, error: 'Failed to delete assignment' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteAssignment:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Progress and Analytics
  async getGroupProgress(groupId: string, userId: string): Promise<ApiResponse<GroupProgress>> {
    try {
      // Check if user has access to group
      const hasAccess = await this.userHasGroupAccess(userId, groupId)
      if (!hasAccess) {
        return { success: false, error: 'Access denied' }
      }

      // Get overall group progress
      const { data: progressData } = await this.supabase
        .from('student_progress_summary')
        .select('*')
        .eq('group_id', groupId)

      const totalMembers = progressData?.length || 0
      const completedMembers = progressData?.filter(p => p.completion_rate === 100).length || 0
      const averageScore = progressData?.length ? 
        progressData.reduce((sum, p) => sum + (p.average_score || 0), 0) / progressData.length : 0

      const studentProgress: StudentProgress[] = progressData?.map(p => ({
        userId: p.user_id,
        studentName: p.student_email,
        assignmentsCompleted: p.completed_assignments,
        totalAssignments: p.total_assignments,
        averageScore: p.average_score || 0,
        lastActivity: new Date(p.last_activity || Date.now())
      })) || []

      const groupProgress: GroupProgress = {
        groupId,
        totalMembers,
        completedMembers,
        averageScore,
        completionRate: totalMembers > 0 ? (completedMembers / totalMembers) * 100 : 0,
        overallProgress: studentProgress
      }

      return { success: true, data: groupProgress }
    } catch (error) {
      console.error('Error in getGroupProgress:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async getStudentProgress(groupId: string, studentId: string, requesterId: string): Promise<ApiResponse<StudentProgress>> {
    try {
      // Check if requester has access to group
      const hasAccess = await this.userHasGroupAccess(requesterId, groupId)
      if (!hasAccess) {
        return { success: false, error: 'Access denied' }
      }

      const { data } = await this.supabase
        .from('student_progress_summary')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', studentId)
        .single()

      if (!data) {
        return { success: false, error: 'Student not found in group' }
      }

      const studentProgress: StudentProgress = {
        userId: data.user_id,
        studentName: data.student_email,
        assignmentsCompleted: data.completed_assignments,
        totalAssignments: data.total_assignments,
        averageScore: data.average_score || 0,
        lastActivity: new Date(data.last_activity || Date.now())
      }

      return { success: true, data: studentProgress }
    } catch (error) {
      console.error('Error in getStudentProgress:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  async getAssignmentResults(assignmentId: string, userId: string): Promise<ApiResponse<AssignmentResult[]>> {
    try {
      // Check if user can access assignment results
      const { data: assignment } = await this.supabase
        .from('group_assignments')
        .select('group_id')
        .eq('id', assignmentId)
        .single()

      if (!assignment) {
        return { success: false, error: 'Assignment not found' }
      }

      const hasAccess = await this.userHasGroupAccess(userId, assignment.group_id)
      if (!hasAccess) {
        return { success: false, error: 'Access denied' }
      }

      const { data, error } = await this.supabase
        .from('assignment_results')
        .select(`
          *,
          user:users(id, email),
          assignment:group_assignments(id, title)
        `)
        .eq('assignment_id', assignmentId)
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching assignment results:', error)
        return { success: false, error: 'Failed to fetch results' }
      }

      const transformedResults = data?.map(result => ({
        id: result.id,
        assignmentId: result.assignment_id,
        userId: result.user_id,
        score: result.score,
        totalQuestions: result.total_questions,
        correctAnswers: result.correct_answers,
        timeSpent: result.time_spent,
        completedAt: new Date(result.completed_at),
        answers: result.answers || [],
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          role: 'learner' as const,
          createdAt: new Date()
        } : undefined,
        assignment: result.assignment ? {
          id: result.assignment.id,
          groupId: assignment.group_id,
          title: result.assignment.title,
          description: null,
          questionIds: [],
          createdBy: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        } : undefined
      })) || []

      return { success: true, data: transformedResults }
    } catch (error) {
      console.error('Error in getAssignmentResults:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Helper methods
  private async userHasGroupAccess(userId: string, groupId: string): Promise<boolean> {
    try {
      // Check if user is the teacher of the group
      const { data: group } = await this.supabase
        .from('groups')
        .select('teacher_id')
        .eq('id', groupId)
        .single()

      if (group && group.teacher_id === userId) {
        return true
      }

      // Check if user is a member of the group
      const { data: membership } = await this.supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      return !!membership
    } catch (error) {
      console.error('Error checking group access:', error)
      return false
    }
  }

  private async userCanManageGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      // Check if user is the teacher of the group
      const { data: group } = await this.supabase
        .from('groups')
        .select('teacher_id')
        .eq('id', groupId)
        .single()

      if (group && group.teacher_id === userId) {
        return true
      }

      // Check if user is an assistant in the group
      const { data: membership } = await this.supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      return membership?.role === 'assistant'
    } catch (error) {
      console.error('Error checking group management permission:', error)
      return false
    }
  }

  private transformGroupRow(row: any): Group {
    return {
      id: row.id,
      name: row.name,
      teacherId: row.teacher_id,
      description: row.description,
      inviteCode: row.invite_code,
      inviteCodeExpiresAt: row.invite_code_expires_at ? new Date(row.invite_code_expires_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      teacher: row.teacher ? {
        id: row.teacher.id,
        email: row.teacher.email,
        role: row.teacher.role,
        createdAt: new Date()
      } : undefined
    }
  }

  private transformMembershipRow(row: any): GroupMembership {
    return {
      id: row.id,
      groupId: row.group_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: new Date(row.joined_at),
      user: row.user ? {
        id: row.user.id,
        email: row.user.email,
        role: row.user.role,
        createdAt: new Date()
      } : undefined,
      group: row.group ? {
        id: row.group.id,
        name: row.group.name,
        teacherId: '',
        inviteCode: '',
        createdAt: new Date(),
        updatedAt: new Date()
      } : undefined
    }
  }

  private transformAssignmentRow(row: any): GroupAssignment {
    return {
      id: row.id,
      groupId: row.group_id,
      title: row.title,
      description: row.description,
      questionIds: row.question_ids || [],
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: row.is_active,
      group: row.group ? {
        id: row.group.id,
        name: row.group.name,
        teacherId: '',
        inviteCode: '',
        createdAt: new Date(),
        updatedAt: new Date()
      } : undefined,
      creator: row.creator ? {
        id: row.creator.id,
        email: row.creator.email,
        role: 'teacher' as const,
        createdAt: new Date()
      } : undefined
    }
  }

  private transformInviteRow(row: any): GroupInvite {
    return {
      code: row.code,
      groupId: row.group_id,
      createdBy: row.created_by,
      expiresAt: new Date(row.expires_at),
      maxUses: row.max_uses,
      currentUses: row.current_uses,
      isActive: row.is_active
    }
  }
}

export const groupService = new GroupManagementService()