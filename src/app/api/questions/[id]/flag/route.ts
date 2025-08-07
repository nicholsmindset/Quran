import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Flag a question for senior scholar review
export async function POST(
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

    const { concern } = await request.json();

    if (!concern || typeof concern !== 'string') {
      return createErrorResponse('Concern description is required', 400);
    }

    // Check if question exists and is not already processed
    const { data: existingQuestion, error: existingError } = await supabase
      .from('questions')
      .select('id, status, approved_at, rejected_at')
      .eq('id', id)
      .single();

    if (existingError || !existingQuestion) {
      return createErrorResponse('Question not found', 404);
    }

    if (existingQuestion.approved_at || existingQuestion.rejected_at) {
      return createErrorResponse('Question has already been processed', 400);
    }

    // Update question status to flagged
    const { data: flaggedQuestion, error: flagError } = await supabase
      .from('questions')
      .update({
        status: 'flagged',
        moderated_by: authResult.user.id,
        moderation_notes: `Flagged for senior review: ${concern}`,
        priority: 'high' // Escalate priority for flagged questions
      })
      .eq('id', id)
      .select(`
        id,
        prompt,
        choices,
        answer,
        difficulty,
        status,
        priority,
        moderated_by,
        moderation_notes,
        created_at,
        verse_id,
        verses (
          id,
          surah,
          ayah,
          arabic_text,
          translation_en
        )
      `)
      .single();

    if (flagError) {
      console.error('Question flag error:', flagError);
      return createErrorResponse('Failed to flag question', 500);
    }

    // Log the moderation action
    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        question_id: id,
        scholar_id: authResult.user.id,
        action: 'flag',
        notes: concern,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Moderation log error:', logError);
      // Don't fail the request for logging errors
    }

    // Create notification for senior scholars (if notification system exists)
    // This could be expanded to send actual notifications
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type: 'question_flagged',
        title: 'Question Flagged for Review',
        message: `Question for Surah ${flaggedQuestion.verses?.surah}:${flaggedQuestion.verses?.ayah} has been flagged: ${concern}`,
        question_id: id,
        flagged_by: authResult.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Don't fail if notifications table doesn't exist
    if (notificationError && !notificationError.message.includes('relation "notifications" does not exist')) {
      console.error('Notification creation error:', notificationError);
    }

    return createSuccessResponse({
      question: flaggedQuestion,
      message: 'Question flagged for senior scholar review',
    });

  } catch (error) {
    console.error('Flag question error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}