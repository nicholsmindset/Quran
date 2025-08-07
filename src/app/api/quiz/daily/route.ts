import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { getCurrentDailyQuiz, getUserQuizStatus } from '@/lib/quiz-engine'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

// Schema for timezone
const TimezoneSchema = z.object({
  timezone: z.string().optional().default('UTC')
})

/**
 * GET /api/quiz/daily - Get current daily quiz
 * Returns today's quiz with questions and user's completion status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractBearerToken(request.headers.get('authorization'))
    const authResult = await verifyAuthToken(token)
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }

    // Parse timezone from query params
    const { searchParams } = new URL(request.url)
    const { timezone } = TimezoneSchema.parse({
      timezone: searchParams.get('timezone')
    })

    // Get user's quiz status (includes today's quiz and completion status)
    const quizStatus = await getUserQuizStatus(authResult.user.id, timezone)
    const supabase = createServerSupabaseClient()

    // Get questions for today's quiz
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
      .in('id', quizStatus.todaysQuiz.questionIds)
      .not('approved_at', 'is', null)

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError)
      return createErrorResponse('Failed to load quiz questions', 500)
    }

    // Order questions according to quiz question order
    const orderedQuestions = quizStatus.todaysQuiz.questionIds.map(id => 
      questions?.find(q => q.id === id)
    ).filter(Boolean)

    return createSuccessResponse({
      quiz: {
        ...quizStatus.todaysQuiz,
        questions: orderedQuestions
      },
      status: {
        hasCompletedToday: quizStatus.hasCompletedToday,
        currentSession: quizStatus.currentSession,
        streakInfo: quizStatus.streakInfo
      },
      metadata: {
        timezone,
        questionCount: orderedQuestions.length,
        difficulties: {
          easy: orderedQuestions.filter(q => q.difficulty === 'easy').length,
          medium: orderedQuestions.filter(q => q.difficulty === 'medium').length,
          hard: orderedQuestions.filter(q => q.difficulty === 'hard').length
        }
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request parameters', 400)
    }

    console.error('Get daily quiz error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}