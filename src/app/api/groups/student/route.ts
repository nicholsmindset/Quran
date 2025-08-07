import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET /api/groups/student - Get student's groups
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

    // Get groups where user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from('group_memberships')
      .select(`
        *,
        groups (
          *,
          users!groups_teacher_id_fkey (
            id,
            email
          ),
          group_assignments (
            id,
            title,
            is_active,
            due_date,
            created_at
          )
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (membershipError) {
      console.error('Error fetching student groups:', membershipError);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    // Transform data to include group statistics
    const groups = memberships?.map(membership => ({
      ...membership.groups,
      teacher: membership.groups?.users,
      membership: {
        role: membership.role,
        joinedAt: membership.joined_at
      },
      statistics: {
        totalAssignments: membership.groups?.group_assignments?.length || 0,
        activeAssignments: membership.groups?.group_assignments?.filter((a: any) => a.is_active).length || 0
      }
    })) || [];

    return NextResponse.json({
      groups,
      total: groups.length
    });

  } catch (error) {
    console.error('Error in GET /api/groups/student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}