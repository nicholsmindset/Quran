import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Edit and approve a question
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

    const { changes, notes } = await request.json();

    if (!changes || typeof changes !== 'object') {
      return createErrorResponse('Changes are required', 400);
    }

    // Check if question exists and is not already approved
    const { data: existingQuestion, error: existingError } = await supabase
      .from('questions')
      .select('id, status, approved_at')
      .eq('id', id)
      .single();

    if (existingError || !existingQuestion) {
      return createErrorResponse('Question not found', 404);
    }

    if (existingQuestion.approved_at) {
      return createErrorResponse('Question is already approved', 400);
    }

    // Validate changes
    const allowedFields = ['prompt', 'choices', 'answer', 'difficulty', 'category_tags'];
    const updateData: any = {};
    
    for (const [key, value] of Object.entries(changes)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    // Add moderation fields
    updateData.approved_at = new Date().toISOString();
    updateData.moderated_by = authResult.user.id;
    updateData.moderation_notes = notes || 'Question edited and approved';
    updateData.status = 'approved';

    // Update the question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        prompt,
        choices,
        answer,
        difficulty,
        category_tags,
        approved_at,
        moderated_by,
        moderation_notes,
        status,
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

    if (updateError) {
      console.error('Question update error:', updateError);
      return createErrorResponse('Failed to update question', 500);
    }

    // Log the moderation action
    const { error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        question_id: id,
        scholar_id: authResult.user.id,
        action: 'edit',
        notes: notes || 'Question edited and approved',
        changes: changes,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Moderation log error:', logError);
      // Don't fail the request for logging errors
    }

    return createSuccessResponse({
      question: updatedQuestion,
      message: 'Question edited and approved successfully',
    });

  } catch (error) {
    console.error('Edit question error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}