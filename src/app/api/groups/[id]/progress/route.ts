import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/groups/[id]/progress - Get group progress analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const groupId = params.id;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d'; // 1d, 7d, 30d, all
    const memberIds = searchParams.get('members')?.split(','); // Specific members

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check access to group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        teacher_id,
        group_memberships!inner (
          user_id
        )
      `)
      .eq('id', groupId)
      .or(`teacher_id.eq.${user.id},group_memberships.user_id.eq.${user.id}`)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const isTeacher = group.teacher_id === user.id;

    // Calculate timeframe filter
    let timeFilter = '';
    const now = new Date();
    
    switch (timeframe) {
      case '1d':
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        timeFilter = oneDayAgo.toISOString();
        break;
      case '7d':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        timeFilter = weekAgo.toISOString();
        break;
      case '30d':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        timeFilter = monthAgo.toISOString();
        break;
      default:
        timeFilter = '1970-01-01T00:00:00Z'; // All time
    }

    // Get group members with progress data
    let membersQuery = supabase
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
            longest_streak,
            updated_at
          )
        )
      `)
      .eq('group_id', groupId);

    if (memberIds && memberIds.length > 0) {
      membersQuery = membersQuery.in('user_id', memberIds);
    }

    const { data: members, error: membersError } = await membersQuery;

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch group members' },
        { status: 500 }
      );
    }

    // Get assignment attempts with time filter
    const { data: attempts, error: attemptsError } = await supabase
      .from('assignment_attempts')
      .select(`
        id,
        user_id,
        assignment_id,
        score,
        is_completed,
        completed_at,
        time_taken_seconds,
        group_assignments!inner (
          id,
          title,
          group_id
        )
      `)
      .eq('group_assignments.group_id', groupId)
      .gte('completed_at', timeFilter)
      .not('completed_at', 'is', null);

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
      return NextResponse.json(
        { error: 'Failed to fetch assignment attempts' },
        { status: 500 }
      );
    }

    // Calculate individual member progress
    const memberProgress = members?.map(member => {
      const userAttempts = attempts?.filter(attempt => attempt.user_id === member.user_id) || [];
      const completedAttempts = userAttempts.filter(attempt => attempt.is_completed);
      
      const avgScore = completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) 
            / completedAttempts.length * 100
          ) / 100
        : 0;

      const avgTime = completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce((sum, attempt) => sum + (attempt.time_taken_seconds || 0), 0)
            / completedAttempts.length
          )
        : 0;

      // Only show detailed data to teacher or for current user
      const canViewDetails = isTeacher || member.user_id === user.id;

      return {
        userId: member.user_id,
        email: canViewDetails ? member.users.email : `Student ${member.user_id.substring(0, 8)}`,
        role: member.role,
        joinedAt: member.joined_at,
        lastActivity: member.last_activity,
        currentStreak: canViewDetails ? member.users.streaks?.[0]?.current_streak || 0 : null,
        longestStreak: canViewDetails ? member.users.streaks?.[0]?.longest_streak || 0 : null,
        statistics: {
          totalAttempts: userAttempts.length,
          completedAttempts: completedAttempts.length,
          averageScore: avgScore,
          averageTime: avgTime,
          completionRate: userAttempts.length > 0 
            ? Math.round((completedAttempts.length / userAttempts.length) * 100)
            : 0
        },
        recentAttempts: canViewDetails ? completedAttempts.slice(-5).map(attempt => ({
          assignmentId: attempt.assignment_id,
          score: attempt.score,
          completedAt: attempt.completed_at,
          timeTaken: attempt.time_taken_seconds
        })) : []
      };
    }) || [];

    // Calculate group-wide statistics
    const allAttempts = attempts || [];
    const allCompletedAttempts = allAttempts.filter(attempt => attempt.is_completed);
    
    const groupStatistics = {
      totalMembers: members?.length || 0,
      activeMembers: members?.filter(member => {
        const lastActivity = new Date(member.last_activity || member.joined_at);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return lastActivity > weekAgo;
      }).length || 0,
      totalAttempts: allAttempts.length,
      completedAttempts: allCompletedAttempts.length,
      averageGroupScore: allCompletedAttempts.length > 0
        ? Math.round(
            allCompletedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) 
            / allCompletedAttempts.length * 100
          ) / 100
        : 0,
      completionRate: allAttempts.length > 0 
        ? Math.round((allCompletedAttempts.length / allAttempts.length) * 100)
        : 0,
      timeframe: {
        current: timeframe,
        from: timeFilter,
        to: now.toISOString()
      }
    };

    // Get assignment performance breakdown
    const assignmentPerformance = allCompletedAttempts.reduce((acc: any, attempt) => {
      const assignmentId = attempt.assignment_id;
      const assignmentTitle = attempt.group_assignments?.title || 'Unknown';
      
      if (!acc[assignmentId]) {
        acc[assignmentId] = {
          assignmentId,
          title: assignmentTitle,
          attempts: 0,
          averageScore: 0,
          totalScore: 0
        };
      }
      
      acc[assignmentId].attempts += 1;
      acc[assignmentId].totalScore += (attempt.score || 0);
      acc[assignmentId].averageScore = Math.round(
        (acc[assignmentId].totalScore / acc[assignmentId].attempts) * 100
      ) / 100;
      
      return acc;
    }, {});

    const response = {
      group: {
        id: group.id,
        name: group.name
      },
      statistics: groupStatistics,
      memberProgress: isTeacher ? memberProgress : 
        memberProgress.filter(member => member.userId === user.id),
      assignmentPerformance: Object.values(assignmentPerformance),
      timeframe: {
        current: timeframe,
        available: ['1d', '7d', '30d', 'all']
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/groups/[id]/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}