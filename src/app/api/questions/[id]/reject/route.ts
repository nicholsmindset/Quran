import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// T013: Create approval workflow API endpoints - Reject question
const RejectSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = RejectSchema.parse(body);
    
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication required', 401);
    }

    if (!hasRole(authResult.user, 'scholar')) {
      return createErrorResponse('Scholar role required', 403);
    }
    
    // Check if question exists and is not already processed
    const { data: existingQuestion, error: existingError } = await supabase
      .from('questions')
      .select('id, approved_at, rejected_at, status')
      .eq('id', id)
      .single();
    
    if (existingError || !existingQuestion) {
      return createErrorResponse('Question not found', 404);
    }
    
    if (existingQuestion.approved_at) {
      return createErrorResponse('Cannot reject an approved question', 400);
    }

    if (existingQuestion.rejected_at) {
      return createErrorResponse('Question has already been rejected', 400);
    }
    
    // Update question status to rejected instead of deleting
    const { data: rejectedQuestion, error: rejectError } = await supabase
      .from('questions')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        moderated_by: authResult.user.id,
        moderation_notes: validatedData.reason
      })
      .eq('id', id)
      .select(`
        id,
        prompt,
        status,
        rejected_at,
        moderated_by,
        moderation_notes,
        verse_id,
        verses (
          surah,
          ayah
        )
      `)
      .single();
    
    if (rejectError) {
      console.error('Question rejection error:', rejectError);
      return createErrorResponse('Failed to reject question', 500);
    }
    
    // Log the moderation action
    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        question_id: id,
        scholar_id: authResult.user.id,
        action: 'reject',
        notes: validatedData.reason,
        created_at: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Moderation log error:', logError);
      // Don't fail the request for logging errors
    }
    
    return createSuccessResponse({
      question: rejectedQuestion,
      message: 'Question rejected successfully',
      reason: validatedData.reason,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', 400);
    }
    
    console.error('Reject question error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}