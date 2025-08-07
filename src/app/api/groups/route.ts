import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schemas
const CreateGroupSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  maxMembers: z.number().min(1).max(200).optional().default(50)
});

// GET /api/groups - Get teacher's groups
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

    // Verify user is teacher or scholar
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userData || !['teacher', 'scholar'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Access denied. Teacher role required.' },
        { status: 403 }
      );
    }

    // Get teacher's groups with statistics
    const { data: groups, error: groupsError } = await supabase
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
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    // Calculate statistics for each group
    const groupsWithStats = groups?.map(group => ({
      ...group,
      statistics: {
        totalMembers: group.group_memberships?.length || 0,
        activeAssignments: group.group_assignments?.filter((a: any) => a.is_active).length || 0,
        totalAssignments: group.group_assignments?.length || 0
      }
    })) || [];

    return NextResponse.json({
      groups: groupsWithStats,
      total: groupsWithStats.length
    });

  } catch (error) {
    console.error('Error in GET /api/groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
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

    // Verify user is teacher or scholar
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userData || !['teacher', 'scholar'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Access denied. Teacher role required.' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = CreateGroupSchema.parse(body);

    // Check if teacher already has a group with this name
    const { data: existingGroup } = await supabase
      .from('groups')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('name', validatedData.name)
      .single();

    if (existingGroup) {
      return NextResponse.json(
        { error: 'You already have a group with this name' },
        { status: 409 }
      );
    }

    // Create new group
    const { data: newGroup, error: createError } = await supabase
      .from('groups')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        teacher_id: user.id,
        max_members: validatedData.maxMembers
      })
      .select(`
        *,
        group_memberships (
          id,
          user_id,
          role,
          joined_at
        ),
        group_assignments (
          id,
          title,
          is_active
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating group:', createError);
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      );
    }

    // Add statistics
    const groupWithStats = {
      ...newGroup,
      statistics: {
        totalMembers: 0,
        activeAssignments: 0,
        totalAssignments: 0
      }
    };

    return NextResponse.json({
      group: groupWithStats,
      message: 'Group created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}