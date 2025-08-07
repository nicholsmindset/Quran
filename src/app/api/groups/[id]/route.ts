import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schemas
const UpdateGroupSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  maxMembers: z.number().min(1).max(200).optional()
});

// GET /api/groups/[id] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get group with detailed information
    const { data: group, error: groupError } = await supabase
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

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check access - teacher owns group OR user is member
    const isTeacher = group.teacher_id === user.id;
    const isMember = group.group_memberships?.some(
      (membership: { user_id: string }) => membership.user_id === user.id
    );

    if (!isTeacher && !isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Calculate detailed statistics
    const totalMembers = group.group_memberships?.length || 0;
    const activeAssignments = group.group_assignments?.filter(
      (assignment: { is_active: boolean }) => assignment.is_active
    ).length || 0;
    
    const completedAttempts = group.group_assignments?.reduce(
      (total: number, assignment: { assignment_attempts?: { is_completed: boolean }[] }) => 
        total + (assignment.assignment_attempts?.filter(
          (attempt: { is_completed: boolean }) => attempt.is_completed
        ).length || 0), 0
    ) || 0;

    const averageScore = group.group_assignments?.reduce(
      (acc: { sum: number, count: number }, assignment: { assignment_attempts?: { is_completed: boolean; score?: number }[] }) => {
        const completedAttempts = assignment.assignment_attempts?.filter(
          (attempt: { is_completed: boolean }) => attempt.is_completed
        ) || [];
        
        const assignmentTotal = completedAttempts.reduce(
          (sum: number, attempt: { score?: number }) => sum + (attempt.score || 0), 0
        );
        
        return {
          sum: acc.sum + assignmentTotal,
          count: acc.count + completedAttempts.length
        };
      }, { sum: 0, count: 0 }
    );

    const groupWithStats = {
      ...group,
      statistics: {
        totalMembers,
        activeAssignments,
        totalAssignments: group.group_assignments?.length || 0,
        completedAttempts,
        averageScore: averageScore?.count > 0 
          ? Math.round((averageScore.sum / averageScore.count) * 100) / 100 
          : 0,
        recentActivity: group.group_memberships?.filter(
          (membership: { last_activity?: string; joined_at: string }) => {
            const lastActivity = new Date(membership.last_activity || membership.joined_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return lastActivity > weekAgo;
          }
        ).length || 0
      },
      // Only show sensitive data to teacher
      invitationCode: isTeacher ? group.invitation_code : undefined,
      invitationExpiresAt: isTeacher ? group.invitation_expires_at : undefined
    };

    return NextResponse.json({ group: groupWithStats });

  } catch (error) {
    console.error('Error in GET /api/groups/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify group ownership
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('teacher_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (group.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. Only group owner can update.' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = UpdateGroupSchema.parse(body);

    // Check for name conflicts if name is being updated
    if (validatedData.name) {
      const { data: existingGroup } = await supabase
        .from('groups')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('name', validatedData.name)
        .neq('id', groupId)
        .single();

      if (existingGroup) {
        return NextResponse.json(
          { error: 'You already have another group with this name' },
          { status: 409 }
        );
      }
    }

    // Update group
    const updateData: { name?: string; description?: string; max_members?: number } = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.maxMembers !== undefined) updateData.max_members = validatedData.maxMembers;

    const { data: updatedGroup, error: updateError } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating group:', updateError);
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      group: updatedGroup,
      message: 'Group updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/groups/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify group ownership
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('teacher_id, name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (group.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. Only group owner can delete.' },
        { status: 403 }
      );
    }

    // Check if group has active assignments
    const { data: activeAssignments, error: assignmentError } = await supabase
      .from('group_assignments')
      .select('id')
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (assignmentError) {
      console.error('Error checking assignments:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to check group assignments' },
        { status: 500 }
      );
    }

    if (activeAssignments && activeAssignments.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete group with active assignments. Please complete or deactivate all assignments first.',
          activeAssignments: activeAssignments.length
        },
        { status: 409 }
      );
    }

    // Delete group (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      console.error('Error deleting group:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Group "${group.name}" deleted successfully`
    });

  } catch (error) {
    console.error('Error in DELETE /api/groups/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}