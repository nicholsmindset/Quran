import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/groups/[id]/leaderboard - Get group leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const groupId = params.id;
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this group
    const { data: membership } = await supabase
      .from('group_memberships')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    // Also check if user is the teacher
    const { data: group } = await supabase
      .from('groups')
      .select('teacher_id')
      .eq('id', groupId)
      .single();

    if (!membership && group?.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get group members with their assignment results
    const { data: members, error: memberError } = await supabase
      .from('group_memberships')
      .select(`
        user_id,
        users (
          id,
          email
        )
      `)
      .eq('group_id', groupId);

    if (memberError) {
      console.error('Error fetching group members:', memberError);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const userIds = members.map(m => m.user_id);

    // Get assignments for this group
    const { data: assignments } = await supabase
      .from('group_assignments')
      .select('id')
      .eq('group_id', groupId);

    const assignmentIds = assignments?.map(a => a.id) || [];

    // Get assignment results for all members
    const { data: results } = await supabase
      .from('assignment_results')
      .select('user_id, assignment_id, score, completed_at')
      .in('user_id', userIds)
      .in('assignment_id', assignmentIds);

    // Calculate leaderboard data
    const leaderboard = members.map(member => {
      const userResults = results?.filter(r => r.user_id === member.user_id) || [];
      const completedAssignments = userResults.length;
      const totalScore = userResults.reduce((sum, r) => sum + (r.score || 0), 0);
      const averageScore = completedAssignments > 0 ? Math.round(totalScore / completedAssignments) : 0;
      
      return {
        userId: member.user_id,
        studentName: member.users?.email?.split('@')[0] || 'Anonymous',
        assignmentsCompleted: completedAssignments,
        totalAssignments: assignmentIds.length,
        averageScore,
        lastActivity: userResults.length > 0 
          ? new Date(Math.max(...userResults.map(r => new Date(r.completed_at).getTime())))
          : null
      };
    });

    // Sort by average score (descending), then by assignments completed
    leaderboard.sort((a, b) => {
      if (a.averageScore !== b.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.assignmentsCompleted - a.assignmentsCompleted;
    });

    // Add rank
    leaderboard.forEach((student, index) => {
      student.overallRank = index + 1;
    });

    return NextResponse.json({
      data: leaderboard
    });

  } catch (error) {
    console.error('Error in GET /api/groups/[id]/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}