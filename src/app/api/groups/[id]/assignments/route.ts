import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schemas
const CreateAssignmentSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  totalQuestions: z.number().min(1).max(20).default(5),
  timeLimitMinutes: z.number().min(5).max(120).default(30),
  dueDate: z.string().optional(),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(100).default(40),
    medium: z.number().min(0).max(100).default(40),
    hard: z.number().min(0).max(100).default(20)
  }).optional(),
  questionIds: z.array(z.string()).optional() // For custom question selection
});

// GET /api/groups/[id]/assignments - Get group assignments
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

    // Check if user has access to this group
    const { data: access, error: accessError } = await supabase
      .from('groups')
      .select(`
        id,
        teacher_id,
        group_memberships!inner (
          user_id
        )
      `)
      .eq('id', groupId)
      .or(`teacher_id.eq.${user.id},group_memberships.user_id.eq.${user.id}`)
      .single();

    if (accessError || !access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const isTeacher = access.teacher_id === user.id;

    // Get assignments with attempt statistics
    const { data: assignments, error: assignmentsError } = await supabase
      .from('group_assignments')
      .select(`
        id,
        title,
        description,
        total_questions,
        time_limit_minutes,
        due_date,
        is_active,
        created_at,
        updated_at,
        difficulty_distribution,
        assignment_attempts (
          id,
          user_id,
          score,
          is_completed,
          completed_at,
          time_taken_seconds,
          users (
            id,
            email
          )
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    // Calculate statistics for each assignment
    const assignmentsWithStats = assignments?.map(assignment => {
      const attempts = assignment.assignment_attempts || [];
      const completedAttempts = attempts.filter(attempt => attempt.is_completed);
      
      const statistics = {
        totalAttempts: attempts.length,
        completedAttempts: completedAttempts.length,
        averageScore: completedAttempts.length > 0
          ? Math.round(
              completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) 
              / completedAttempts.length * 100
            ) / 100
          : 0,
        averageTime: completedAttempts.length > 0
          ? Math.round(
              completedAttempts.reduce((sum, attempt) => sum + (attempt.time_taken_seconds || 0), 0)
              / completedAttempts.length
            )
          : 0,
        completionRate: attempts.length > 0 
          ? Math.round((completedAttempts.length / attempts.length) * 100)
          : 0
      };

      return {
        ...assignment,
        statistics,
        // Only show detailed attempt data to teachers
        assignment_attempts: isTeacher ? assignment.assignment_attempts : 
          assignment.assignment_attempts?.filter((attempt: any) => attempt.user_id === user.id)
      };
    }) || [];

    return NextResponse.json({
      assignments: assignmentsWithStats,
      total: assignmentsWithStats.length,
      isTeacher
    });

  } catch (error) {
    console.error('Error in GET /api/groups/[id]/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/assignments - Create new assignment
export async function POST(
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

    // Verify user is teacher of this group
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
        { error: 'Access denied. Only group teacher can create assignments.' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = CreateAssignmentSchema.parse(body);

    // Validate difficulty distribution sums to 100
    if (validatedData.difficultyDistribution) {
      const { easy, medium, hard } = validatedData.difficultyDistribution;
      if (easy + medium + hard !== 100) {
        return NextResponse.json(
          { error: 'Difficulty distribution must sum to 100%' },
          { status: 400 }
        );
      }
    }

    let questionIds = validatedData.questionIds || [];

    // If no custom questions provided, auto-select questions
    if (questionIds.length === 0) {
      const distribution = validatedData.difficultyDistribution || { easy: 40, medium: 40, hard: 20 };
      const totalQuestions = validatedData.totalQuestions;

      // Calculate questions per difficulty
      const easyCount = Math.round((distribution.easy / 100) * totalQuestions);
      const mediumCount = Math.round((distribution.medium / 100) * totalQuestions);
      const hardCount = totalQuestions - easyCount - mediumCount;

      // Select questions by difficulty
      const { data: selectedQuestions, error: questionError } = await supabase.rpc(
        'select_questions_for_assignment',
        {
          easy_count: easyCount,
          medium_count: mediumCount,
          hard_count: hardCount
        }
      );

      if (questionError || !selectedQuestions) {
        // Fallback: select any approved questions
        const { data: fallbackQuestions, error: fallbackError } = await supabase
          .from('questions')
          .select('id')
          .not('approved_at', 'is', null)
          .limit(totalQuestions);

        if (fallbackError || !fallbackQuestions || fallbackQuestions.length < totalQuestions) {
          return NextResponse.json(
            { error: 'Not enough approved questions available for assignment' },
            { status: 409 }
          );
        }

        questionIds = fallbackQuestions.map(q => q.id);
      } else {
        questionIds = selectedQuestions;
      }
    }

    // Validate that all question IDs exist and are approved
    const { data: validQuestions, error: validationError } = await supabase
      .from('questions')
      .select('id')
      .in('id', questionIds)
      .not('approved_at', 'is', null);

    if (validationError || !validQuestions || validQuestions.length !== questionIds.length) {
      return NextResponse.json(
        { error: 'Some questions are invalid or not approved' },
        { status: 400 }
      );
    }

    // Create assignment
    const assignmentData = {
      group_id: groupId,
      title: validatedData.title,
      description: validatedData.description,
      total_questions: validatedData.totalQuestions,
      time_limit_minutes: validatedData.timeLimitMinutes,
      due_date: validatedData.dueDate ? new Date(validatedData.dueDate).toISOString() : null,
      question_ids: questionIds,
      difficulty_distribution: validatedData.difficultyDistribution || { easy: 40, medium: 40, hard: 20 },
      created_by: user.id
    };

    const { data: newAssignment, error: createError } = await supabase
      .from('group_assignments')
      .insert(assignmentData)
      .select(`
        id,
        title,
        description,
        total_questions,
        time_limit_minutes,
        due_date,
        is_active,
        created_at,
        difficulty_distribution,
        question_ids
      `)
      .single();

    if (createError) {
      console.error('Error creating assignment:', createError);
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }

    // Add empty statistics for new assignment
    const assignmentWithStats = {
      ...newAssignment,
      statistics: {
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        averageTime: 0,
        completionRate: 0
      },
      assignment_attempts: []
    };

    return NextResponse.json({
      assignment: assignmentWithStats,
      message: 'Assignment created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/groups/[id]/assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}