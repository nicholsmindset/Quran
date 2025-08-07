import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { getQuizSession, completeQuizSession } from '@/lib/quiz-engine'
import { z } from 'zod'

// Schema for completion request (optional final answers)
const CompleteSessionSchema = z.object({
  final_answers: z.record(z.string()).optional(), // question_id -> answer mapping
  force_complete: z.boolean().optional().default(false) // Allow completing even if not all questions answered
})

/**
 * POST /api/quiz/session/[id]/complete - Complete quiz session
 * Finalizes the quiz session, calculates results, and updates user progress
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const token = extractBearerToken(request.headers.get('authorization'))
    const authResult = await verifyAuthToken(token)
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }

    const { id: sessionId } = await params

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { final_answers, force_complete } = CompleteSessionSchema.parse(body)

    // Get and verify session
    const session = await getQuizSession(sessionId)
    if (!session) {
      return createErrorResponse('Quiz session not found', 404)
    }

    if (session.userId !== authResult.user.id) {
      return createErrorResponse('Access denied', 403)
    }

    if (session.status === 'completed') {
      return createErrorResponse('Quiz session already completed', 409)
    }

    if (session.status === 'expired') {
      return createErrorResponse('Quiz session has expired', 410)
    }

    // Check session timeout
    const sessionAge = Date.now() - session.startedAt.getTime()
    if (sessionAge > 24 * 60 * 60 * 1000) {
      return createErrorResponse('Quiz session has expired', 410)
    }

    // Add any final answers before completing
    if (final_answers) {
      const { saveQuizAnswer } = await import('@/lib/quiz-engine')
      
      for (const [questionId, answer] of Object.entries(final_answers)) {
        if (answer && answer.trim()) {
          await saveQuizAnswer(sessionId, questionId, answer, false)
        }
      }
    }

    // Get quiz data to check completion requirements
    const { createServerSupabaseClient } = await import('@/lib/supabase')
    const supabase = createServerSupabaseClient()
    
    const { data: quizData } = await supabase
      .from('daily_quizzes')
      .select('question_ids')
      .eq('id', session.dailyQuizId)
      .single()

    const totalQuestions = quizData?.question_ids.length || 5
    const answeredQuestions = Object.keys(session.answers).length + (final_answers ? Object.keys(final_answers).length : 0)

    // Check if all questions are answered (unless force completing)
    if (!force_complete && answeredQuestions < totalQuestions) {
      return createErrorResponse(
        `Quiz incomplete. ${totalQuestions - answeredQuestions} questions remain unanswered.`,
        422,
      )
    }

    // Complete the session and calculate results
    const results = await completeQuizSession(sessionId)

    // Get updated streak information
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', authResult.user.id)
      .single()

    // Calculate performance metrics
    const accuracy = Math.round((results.correctAnswers / results.totalQuestions) * 100)
    const averageTimePerQuestion = Math.round(results.timeSpent / results.totalQuestions)

    // Determine performance level
    let performanceLevel = 'needs_improvement'
    if (accuracy >= 90) performanceLevel = 'excellent'
    else if (accuracy >= 70) performanceLevel = 'good'
    else if (accuracy >= 50) performanceLevel = 'fair'

    // Get difficulty breakdown
    const difficultyBreakdown = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    }

    // Fetch question difficulties for breakdown
    const { data: questionDetails } = await supabase
      .from('questions')
      .select('id, difficulty')
      .in('id', quizData?.question_ids || [])

    if (questionDetails) {
      for (const question of questionDetails) {
        const answer = results.answers.find(a => a.questionId === question.id)
        if (answer) {
          difficultyBreakdown[question.difficulty].total++
          if (answer.isCorrect) {
            difficultyBreakdown[question.difficulty].correct++
          }
        }
      }
    }

    return createSuccessResponse({
      results: {
        sessionId: results.sessionId,
        score: results.score,
        accuracy,
        correctAnswers: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        timeSpent: results.timeSpent,
        averageTimePerQuestion,
        performanceLevel
      },
      streakInfo: {
        current: streakData?.current_streak || 0,
        longest: streakData?.longest_streak || 0,
        streakUpdated: results.streakUpdated
      },
      breakdown: {
        byDifficulty: difficultyBreakdown,
        answers: results.answers.map(answer => ({
          questionId: answer.questionId,
          isCorrect: answer.isCorrect,
          selectedAnswer: answer.selectedAnswer,
          timeSpent: answer.timeSpent
        }))
      },
      achievements: {
        perfectScore: results.score === 100,
        quickCompletion: averageTimePerQuestion < 30000, // Less than 30 seconds per question
        streakMaintained: results.streakUpdated,
        firstCompletion: (streakData?.current_streak || 0) === 1 && results.streakUpdated
      },
      metadata: {
        completedAt: new Date().toISOString(),
        totalSessionTime: results.timeSpent,
        questionsAnswered: answeredQuestions,
        forceCompleted: force_complete && answeredQuestions < totalQuestions
      }
    }, 'Quiz completed successfully!')

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request data', 400)
    }

    console.error('Complete quiz session error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Quiz session not found')) {
        return createErrorResponse('Quiz session not found', 404)
      }
      if (error.message.includes('Failed to fetch quiz questions')) {
        return createErrorResponse('Unable to calculate quiz results', 500)
      }
    }

    return createErrorResponse('Internal server error', 500)
  }
}