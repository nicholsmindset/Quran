import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Get scholar's moderation batches
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

    // Verify scholar can access their own batches
    if (authResult.user.id !== id) {
      return createErrorResponse('Access denied', 403);
    }

    // Get scholar's active batches
    const { data: batches, error: batchesError } = await supabase
      .from('moderation_batches')
      .select(`
        id,
        question_ids,
        status,
        deadline,
        created_at,
        completed_at
      `)
      .eq('scholar_id', id)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false });

    if (batchesError) {
      console.error('Batches query error:', batchesError);
      return createErrorResponse('Failed to fetch batches', 500);
    }

    // For each batch, get question details and progress
    const batchesWithDetails = await Promise.all(
      (batches || []).map(async (batch) => {
        // Get questions in this batch
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select(`
            id,
            prompt,
            difficulty,
            priority,
            status,
            verses (
              surah,
              ayah
            )
          `)
          .in('id', batch.question_ids);

        if (questionsError) {
          console.error(`Questions query error for batch ${batch.id}:`, questionsError);
          return batch; // Return batch without question details
        }

        // Calculate progress
        const totalQuestions = questions?.length || 0;
        const completedQuestions = questions?.filter(q => 
          ['approved', 'rejected'].includes(q.status)
        ).length || 0;

        const progress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

        // Calculate time remaining
        const deadline = new Date(batch.deadline);
        const now = new Date();
        const timeRemaining = deadline.getTime() - now.getTime();
        const hoursRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60)));

        return {
          ...batch,
          questions: questions || [],
          progress: Math.round(progress),
          totalQuestions,
          completedQuestions,
          hoursRemaining,
          isOverdue: timeRemaining < 0
        };
      })
    );

    return createSuccessResponse(batchesWithDetails);

  } catch (error) {
    console.error('Scholar batches API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Update batch status
export async function PATCH(
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

    const { status } = await request.json();

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return createErrorResponse('Invalid status', 400);
    }

    // Verify scholar owns this batch
    const { data: batch, error: batchError } = await supabase
      .from('moderation_batches')
      .select('scholar_id')
      .eq('id', id)
      .single();

    if (batchError || !batch) {
      return createErrorResponse('Batch not found', 404);
    }

    if (batch.scholar_id !== authResult.user.id) {
      return createErrorResponse('Access denied', 403);
    }

    // Update batch status
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedBatch, error: updateError } = await supabase
      .from('moderation_batches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Batch update error:', updateError);
      return createErrorResponse('Failed to update batch', 500);
    }

    return createSuccessResponse({
      batch: updatedBatch,
      message: `Batch status updated to ${status}`
    });

  } catch (error) {
    console.error('Update batch API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}