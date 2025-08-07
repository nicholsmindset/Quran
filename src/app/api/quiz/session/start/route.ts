import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { startQuizSession, getCurrentDailyQuiz, hasCompletedDailyQuiz } from '@/lib/quiz-engine'
import { z } from 'zod'

// Schema for starting a quiz session
const StartSessionSchema = z.object({
  timezone: z.string().optional().default('UTC')
})

/**
 * POST /api/quiz/session/start - Start new quiz session
 * Creates a new quiz session for today's daily quiz
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractBearerToken(request.headers.get('authorization'))
    const authResult = await verifyAuthToken(token)
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }

    // Parse request body
    const body = await request.json()
    const { timezone } = StartSessionSchema.parse(body)

    // Check if user has already completed today's quiz
    const hasCompleted = await hasCompletedDailyQuiz(authResult.user.id, timezone)
    if (hasCompleted) {
      return createErrorResponse('Daily quiz already completed for today', 409)
    }

    // Get today's daily quiz
    const dailyQuiz = await getCurrentDailyQuiz(timezone)

    // Start quiz session
    const session = await startQuizSession(
      authResult.user.id,
      dailyQuiz.id,
      timezone
    )

    // Get the questions for the client (without answers)
    const { createServerSupabaseClient } = await import('@/lib/supabase')
    const supabase = createServerSupabaseClient()

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        verse_id,
        prompt,
        choices,
        difficulty,
        verses (
          id,
          surah,
          ayah,
          arabic_text,
          translation_en
        )
      `)
      .in('id', dailyQuiz.questionIds)

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError)
      return createErrorResponse('Failed to load quiz questions', 500)
    }

    // Order questions according to quiz order
    const orderedQuestions = dailyQuiz.questionIds.map(id => 
      questions?.find(q => q.id === id)
    ).filter(Boolean)

    return createSuccessResponse({
      session: {
        id: session.id,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: orderedQuestions.length,
        status: session.status,
        startedAt: session.startedAt,
        timezone: session.timezone
      },
      quiz: {
        id: dailyQuiz.id,
        date: dailyQuiz.date,
        questions: orderedQuestions
      },
      metadata: {
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        autoSaveInterval: 15 * 1000, // 15 seconds
        maxInactivityTime: 60 * 60 * 1000 // 1 hour
      }
    }, 'Quiz session started successfully')

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request data', 400)
    }

    console.error('Start quiz session error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to create quiz session')) {
        return createErrorResponse('Unable to start quiz session', 500)
      }
      if (error.message.includes('Failed to fetch')) {
        return createErrorResponse('Quiz questions not available', 503)
      }
    }

    return createErrorResponse('Internal server error', 500)
  }
}