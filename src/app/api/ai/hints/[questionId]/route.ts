import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/ai-enhancement-service';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/ai/hints/[questionId]
 * Get progressive hints for a fill-in-blank question
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const questionId = params.questionId;
    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Get question data
    const supabase = createServerSupabaseClient();
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Only provide hints for fill-in-blank questions
    if (question.choices && question.choices.length > 0) {
      return NextResponse.json(
        { error: 'Hints are only available for fill-in-blank questions' },
        { status: 400 }
      );
    }

    // Get hint level from query parameters (default to 1)
    const url = new URL(request.url);
    const requestedLevel = parseInt(url.searchParams.get('level') || '1');
    const maxLevel = Math.min(requestedLevel, 3); // Maximum 3 hint levels

    // Generate hints using AI Enhancement Service
    const aiService = new AIEnhancementService();
    const allHints = await aiService.generateProgressiveHints(questionId, question);

    // Filter hints up to requested level
    const availableHints = allHints.filter(hint => hint.level <= maxLevel);

    if (availableHints.length === 0) {
      return NextResponse.json(
        { error: 'No hints available for this question' },
        { status: 404 }
      );
    }

    // Record hint usage for analytics
    await supabase
      .from('user_interactions')
      .insert({
        user_id: authResult.user.id,
        question_id: questionId,
        interaction_type: 'hint_requested',
        metadata: { level: maxLevel }
      });

    return NextResponse.json({
      success: true,
      data: {
        hints: availableHints,
        question: {
          id: question.id,
          prompt: question.prompt,
          difficulty: question.difficulty
        },
        nextHintAvailable: allHints.some(hint => hint.level === maxLevel + 1)
      }
    });

  } catch (error) {
    console.error('AI hints API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: String(error)
      },
      { status: 500 }
    );
  }
}