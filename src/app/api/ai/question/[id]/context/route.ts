import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/ai-enhancement-service';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/ai/question/[id]/context
 * Get rich context for a question including historical background and explanations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const questionId = params.id;
    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

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

    // Generate context using AI Enhancement Service
    const aiService = new AIEnhancementService();
    const context = await aiService.generateQuestionContext(
      questionId,
      question,
      question.verses
    );

    if (!context) {
      return NextResponse.json(
        { error: 'Failed to generate question context' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        context,
        question: {
          id: question.id,
          prompt: question.prompt,
          difficulty: question.difficulty,
          topics: question.category_tags || []
        },
        verse: {
          id: question.verses.id,
          surah: question.verses.surah,
          ayah: question.verses.ayah,
          arabicText: question.verses.arabic_text,
          translationEn: question.verses.translation_en
        }
      }
    });

  } catch (error) {
    console.error('Question context API error:', error);
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