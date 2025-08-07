import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { generateDailyQuiz } from '@/lib/quiz-engine'
import { z } from 'zod'

// Schema for quiz generation request
const GenerateQuizSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  force: z.boolean().optional().default(false) // Force regeneration even if quiz exists
})

/**
 * POST /api/quiz/daily/generate - Generate daily quiz (CRON job endpoint)
 * This endpoint is designed to be called by CRON jobs to pre-generate daily quizzes
 * Can also be used by administrators to force regenerate quizzes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication - for CRON jobs, we might use an API key
    // For now, require authentication but could be enhanced for service-to-service
    const token = extractBearerToken(request.headers.get('authorization'))
    const authResult = await verifyAuthToken(token)
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }

    // Only allow teachers and scholars to generate quizzes manually
    if (!['teacher', 'scholar'].includes(authResult.user.role)) {
      return createErrorResponse('Insufficient permissions to generate quizzes', 403)
    }

    // Parse request body
    const body = await request.json()
    const { date, force } = GenerateQuizSchema.parse(body)

    // Use provided date or default to today (UTC)
    const targetDate = date || new Date().toISOString().split('T')[0]

    // Generate the daily quiz
    const dailyQuiz = await generateDailyQuiz(targetDate)

    // Get question details for response
    const { createServerSupabaseClient } = await import('@/lib/supabase')
    const supabase = createServerSupabaseClient()

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        verse_id,
        prompt,
        difficulty,
        verses (
          surah,
          ayah,
          arabic_text
        )
      `)
      .in('id', dailyQuiz.questionIds)

    if (questionsError) {
      console.error('Error fetching generated quiz questions:', questionsError)
    }

    return createSuccessResponse({
      quiz: {
        ...dailyQuiz,
        questions: questions || []
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        questionCount: dailyQuiz.questionIds.length,
        difficulties: questions ? {
          easy: questions.filter(q => q.difficulty === 'easy').length,
          medium: questions.filter(q => q.difficulty === 'medium').length,
          hard: questions.filter(q => q.difficulty === 'hard').length
        } : null
      }
    }, `Daily quiz for ${targetDate} generated successfully`)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request data', 400)
    }

    console.error('Generate daily quiz error:', error)
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return createErrorResponse('Insufficient approved questions for balanced quiz', 422)
      }
      if (error.message.includes('Failed to create daily quiz')) {
        return createErrorResponse('Database error while creating quiz', 500)
      }
    }

    return createErrorResponse('Internal server error', 500)
  }
}