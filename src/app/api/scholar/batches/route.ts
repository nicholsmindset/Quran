import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Create a new moderation batch
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication required', 401);
    }

    if (!hasRole(authResult.user, 'scholar')) {
      return createErrorResponse('Scholar role required', 403);
    }

    const { questionIds, scholarId, deadline } = await request.json();

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return createErrorResponse('Question IDs are required', 400);
    }

    if (scholarId !== authResult.user.id) {
      return createErrorResponse('Can only create batches for yourself', 403);
    }

    // Set default deadline to 24 hours from now
    const batchDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Verify all questions exist and are pending
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, status')
      .in('id', questionIds)
      .in('status', ['pending', 'flagged']);

    if (questionsError) {
      console.error('Questions verification error:', questionsError);
      return createErrorResponse('Failed to verify questions', 500);
    }

    if (questions?.length !== questionIds.length) {
      return createErrorResponse('Some questions are not available for batching', 400);
    }

    // Create the batch
    const { data: batch, error: batchError } = await supabase
      .from('moderation_batches')
      .insert({
        scholar_id: scholarId,
        question_ids: questionIds,
        status: 'pending',
        deadline: batchDeadline.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (batchError) {
      console.error('Batch creation error:', batchError);
      return createErrorResponse('Failed to create batch', 500);
    }

    // Update questions to reference the batch
    const { error: updateError } = await supabase
      .from('questions')
      .update({ 
        batch_id: batch.id,
        status: 'pending' // Ensure status is consistent
      })
      .in('id', questionIds);

    if (updateError) {
      console.error('Questions batch update error:', updateError);
      // Don't return error here as batch is already created
    }

    return createSuccessResponse({
      batch,
      message: `Batch created with ${questionIds.length} questions`
    });

  } catch (error) {
    console.error('Create batch API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}