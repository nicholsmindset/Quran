import { NextRequest, NextResponse } from 'next/server';
import { BatchProcessor } from '../../../../lib/batch-processor';
import { verifyAuth } from '../../../../lib/auth';
import { z } from 'zod';

/**
 * API endpoint for manual question generation
 * POST /api/ai/generate-questions - Generate questions for specific verses
 */

const generateQuestionsSchema = z.object({
  surah: z.number().min(1).max(114),
  ayahRange: z.object({
    start: z.number().min(1),
    end: z.number().min(1),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication - only scholars can manually generate
    const authResult = await verifyAuth(request);
    if (!authResult.success || !['scholar', 'admin'].includes(authResult.user?.role || '')) {
      return NextResponse.json(
        { error: 'Unauthorized - Scholar access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = generateQuestionsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { surah, ayahRange } = validationResult.data;

    console.log(`Generating questions for Surah ${surah}${ayahRange ? ` (${ayahRange.start}-${ayahRange.end})` : ''}`);

    const processor = new BatchProcessor();
    const result = await processor.generateQuestionsForSpecificVerses(surah, ayahRange);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      questionsGenerated: result.questionsGenerated,
      surah,
      ayahRange,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Generate questions API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during question generation',
        details: String(error),
      },
      { status: 500 }
    );
  }
}