import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// POST /api/groups/join/[code] - Join group with invitation code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = createClient();
    const resolvedParams = await params;
    const invitationCode = resolvedParams.code.toUpperCase();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user role (only learners and teachers can join groups as students)
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (roleError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!['learner', 'teacher'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Only learners and teachers can join groups' },
        { status: 403 }
      );
    }

    // Find group by invitation code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        teacher_id,
        max_members,
        invitation_expires_at,
        group_memberships (
          id,
          user_id
        )
      `)
      .eq('invitation_code', invitationCode)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(group.invitation_expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Invitation code has expired' },
        { status: 410 }
      );
    }

    // Check if user is trying to join their own group
    if (group.teacher_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot join your own group' },
        { status: 409 }
      );
    }

    // Check if user is already a member
    const existingMembership = group.group_memberships?.find(
      (membership: any) => membership.user_id === user.id
    );

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 409 }
      );
    }

    // Check if group is at capacity
    const currentMemberCount = group.group_memberships?.length || 0;
    if (currentMemberCount >= group.max_members) {
      return NextResponse.json(
        { error: 'Group is at maximum capacity' },
        { status: 409 }
      );
    }

    // Add user to group
    const { data: membership, error: membershipError } = await supabase
      .from('group_memberships')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'student'
      })
      .select(`
        id,
        role,
        joined_at,
        groups (
          id,
          name,
          description
        )
      `)
      .single();

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      return NextResponse.json(
        { error: 'Failed to join group' },
        { status: 500 }
      );
    }

    // Log the join activity (handled by trigger)

    return NextResponse.json({
      membership,
      group: {
        id: group.id,
        name: group.name
      },
      message: `Successfully joined group "${group.name}"`
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/groups/join/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/groups/join/[code] - Preview group before joining
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = createClient();
    const resolvedParams = await params;
    const invitationCode = resolvedParams.code.toUpperCase();

    // Find group by invitation code (public info only)
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        max_members,
        invitation_expires_at,
        created_at,
        group_memberships (
          id
        ),
        users!groups_teacher_id_fkey (
          email
        )
      `)
      .eq('invitation_code', invitationCode)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(group.invitation_expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Invitation code has expired' },
        { status: 410 }
      );
    }

    // Return public group information
    const publicGroupInfo = {
      id: group.id,
      name: group.name,
      description: group.description,
      teacherEmail: group.users?.email || 'Unknown',
      memberCount: group.group_memberships?.length || 0,
      maxMembers: group.max_members,
      createdAt: group.created_at,
      expiresAt: group.invitation_expires_at,
      isExpired: now > expiresAt,
      isFull: (group.group_memberships?.length || 0) >= group.max_members
    };

    return NextResponse.json({
      group: publicGroupInfo,
      canJoin: !publicGroupInfo.isExpired && !publicGroupInfo.isFull
    });

  } catch (error) {
    console.error('Error in GET /api/groups/join/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}