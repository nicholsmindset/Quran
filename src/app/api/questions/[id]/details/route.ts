import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Get detailed question information for review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication required', 401);
    }

    if (!hasRole(authResult.user, 'scholar')) {
      return createErrorResponse('Scholar role required', 403);
    }

    // Fetch question with verse details
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        id,
        prompt,
        choices,
        answer,
        difficulty,
        priority,
        status,
        category_tags,
        arabic_accuracy,
        created_at,
        created_by,
        moderated_by,
        moderation_notes,
        approved_at,
        rejected_at,
        verse_id,
        verses (
          id,
          surah,
          ayah,
          arabic_text,
          translation_en
        ),
        users!questions_created_by_fkey (
          id,
          email,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (questionError || !question) {
      console.error('Question query error:', questionError);
      return createErrorResponse('Question not found', 404);
    }

    // Check if question is available for review
    if (question.status === 'approved' && question.approved_at) {
      return createErrorResponse('Question has already been approved', 400);
    }

    if (question.status === 'rejected' && question.rejected_at) {
      return createErrorResponse('Question has already been rejected', 400);
    }

    // Get any existing moderation history
    const { data: moderationHistory, error: historyError } = await supabase
      .from('moderation_actions')
      .select(`
        id,
        action,
        notes,
        changes,
        created_at,
        users!moderation_actions_scholar_id_fkey (
          id,
          email,
          role
        )
      `)
      .eq('question_id', id)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Moderation history error:', historyError);
      // Don't fail the request, just log the error
    }

    return createSuccessResponse({
      question: {
        ...question,
        createdAt: question.created_at,
        approvedAt: question.approved_at,
        rejectedAt: question.rejected_at
      },
      verse: question.verses,
      moderationHistory: moderationHistory || []
    });

  } catch (error) {
    console.error('Question details API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}