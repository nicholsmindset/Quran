import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/ai-enhancement-service';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

/**
 * POST /api/ai/explain
 * Generate AI-powered explanation for user's answer
 */

const explainSchema = z.object({
  questionId: z.string().uuid(),
  userAnswer: z.string().min(1),
  isCorrect: z.boolean()
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = explainSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { questionId, userAnswer, isCorrect } = validationResult.data;

    // Get question and verse data
    const supabase = createServerSupabaseClient();
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        *,
        verses (
          id,
          surah,
          ayah,
          arabic_text,
          translation_en
        )
      `)
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Generate explanation using AI Enhancement Service
    const aiService = new AIEnhancementService();
    const explanation = await aiService.generateExplanation(
      questionId,
      question,
      question.verses,
      userAnswer,
      isCorrect
    );

    if (!explanation) {
      return NextResponse.json(
        { error: 'Failed to generate explanation' },
        { status: 500 }
      );
    }

    // Record user interaction for analytics
    await supabase
      .from('user_interactions')
      .insert({
        user_id: authResult.user.id,
        question_id: questionId,
        interaction_type: 'explanation_requested',
        user_answer: userAnswer,
        is_correct: isCorrect
      });

    return NextResponse.json({
      success: true,
      data: {
        explanation,
        question: {
          id: question.id,
          prompt: question.prompt,
          correctAnswer: question.answer,
          difficulty: question.difficulty
        }
      }
    });

  } catch (error) {
    console.error('AI explanation API error:', error);
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