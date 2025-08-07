import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// T013: Create approval workflow API endpoints - Approve question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const { notes } = await request.json();
    
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
      return createErrorResponse('Question is already approved', 400);
    }

    if (existingQuestion.rejected_at) {
      return createErrorResponse('Cannot approve a rejected question', 400);
    }
    
    // Approve the question
    const { data: approvedQuestion, error: approveError } = await supabase
      .from('questions')
      .update({
        approved_at: new Date().toISOString(),
        status: 'approved',
        moderated_by: authResult.user.id,
        moderation_notes: notes || 'Question approved'
      })
      .eq('id', id)
      .select(`
        id,
        prompt,
        choices,
        answer,
        difficulty,
        status,
        approved_at,
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
    
    if (approveError) {
      console.error('Question approval error:', approveError);
      return createErrorResponse('Failed to approve question', 500);
    }
    
    // Log the moderation action
    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        question_id: id,
        scholar_id: authResult.user.id,
        action: 'approve',
        notes: notes || 'Question approved',
        created_at: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Moderation log error:', logError);
      // Don't fail the request for logging errors
    }
    
    return createSuccessResponse({
      question: approvedQuestion,
      message: 'Question approved successfully',
    });
    
  } catch (error) {
    console.error('Approve question error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}