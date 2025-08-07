import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { getUserQuizStatus } from '@/lib/quiz-engine'
import { z } from 'zod'

// Schema for timezone
const StatusQuerySchema = z.object({
  timezone: z.string().optional().default('UTC'),
  include_details: z.coerce.boolean().optional().default(false)
})

/**
 * GET /api/quiz/daily/status - Check user's daily quiz completion status
 * Returns whether user has completed today's quiz and current progress
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractBearerToken(request.headers.get('authorization'))
    const authResult = await verifyAuthToken(token)
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const { timezone, include_details } = StatusQuerySchema.parse({
      timezone: searchParams.get('timezone'),
      include_details: searchParams.get('include_details')
    })

    // Get user's quiz status
    const quizStatus = await getUserQuizStatus(authResult.user.id, timezone)

    // Prepare response data
    const responseData: any = {
      hasCompletedToday: quizStatus.hasCompletedToday,
      hasActiveSession: !!quizStatus.currentSession,
      streakInfo: quizStatus.streakInfo,
      metadata: {
        timezone,
        date: quizStatus.todaysQuiz.date,
        quizId: quizStatus.todaysQuiz.id
      }
    }

    // Include detailed information if requested
    if (include_details) {
      responseData.currentSession = quizStatus.currentSession ? {
        id: quizStatus.currentSession.id,
        currentQuestionIndex: quizStatus.currentSession.currentQuestionIndex,
        totalQuestions: quizStatus.todaysQuiz.questionIds.length,
        answeredQuestions: Object.keys(quizStatus.currentSession.answers).length,
        status: quizStatus.currentSession.status,
        startedAt: quizStatus.currentSession.startedAt,
        lastActivityAt: quizStatus.currentSession.lastActivityAt,
        timeElapsed: Date.now() - quizStatus.currentSession.startedAt.getTime()
      } : null

      // Add progress percentage
      if (quizStatus.currentSession) {
        const totalQuestions = quizStatus.todaysQuiz.questionIds.length
        const answeredQuestions = Object.keys(quizStatus.currentSession.answers).length
        responseData.progress = {
          completed: answeredQuestions,
          total: totalQuestions,
          percentage: Math.round((answeredQuestions / totalQuestions) * 100)
        }
      }
    }

    // Add session timeout warning if applicable
    if (quizStatus.currentSession) {
      const timeSinceLastActivity = Date.now() - quizStatus.currentSession.lastActivityAt.getTime()
      const timeoutWarning = timeSinceLastActivity > 20 * 60 * 1000 // 20 minutes
      
      if (timeoutWarning) {
        responseData.warnings = ['Session has been inactive for more than 20 minutes']
      }
    }

    return createSuccessResponse(responseData)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 400)
    }

    console.error('Get quiz status error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}