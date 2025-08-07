import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/assignments/student - Get student's assignments
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's groups first
    const { data: memberships } = await supabase
      .from('group_memberships')
      .select('group_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({
        assignments: [],
        upcomingDeadlines: [],
        total: 0
      });
    }

    const groupIds = memberships.map(m => m.group_id);

    // Get assignments from user's groups
    const { data: assignments, error: assignmentError } = await supabase
      .from('group_assignments')
      .select(`
        *,
        groups (
          id,
          name,
          teacher_id
        )
      `)
      .in('group_id', groupIds)
      .order('created_at', { ascending: false });

    if (assignmentError) {
      console.error('Error fetching student assignments:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    // Get user's assignment results
    const { data: results } = await supabase
      .from('assignment_results')
      .select('assignment_id, score, completed_at')
      .eq('user_id', user.id)
      .in('assignment_id', assignments?.map(a => a.id) || []);

    // Enhance assignments with completion status
    const now = new Date();
    const enhancedAssignments = assignments?.map(assignment => {
      const result = results?.find(r => r.assignment_id === assignment.id);
      const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
      
      return {
        ...assignment,
        completed: !!result,
        score: result?.score,
        completedAt: result?.completed_at,
        overdue: dueDate && dueDate < now && !result,
        daysUntilDue: dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
      };
    }) || [];

    // Get upcoming deadlines (within next 7 days)
    const upcomingDeadlines = enhancedAssignments.filter(assignment => {
      if (!assignment.due_date || assignment.completed) return false;
      const dueDate = new Date(assignment.due_date);
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    return NextResponse.json({
      assignments: enhancedAssignments,
      upcomingDeadlines,
      total: enhancedAssignments.length
    });

  } catch (error) {
    console.error('Error in GET /api/assignments/student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}