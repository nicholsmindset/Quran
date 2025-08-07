import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { getQuizSession, saveQuizAnswer } from '@/lib/quiz-engine'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

// Schema for updating session
const UpdateSessionSchema = z.object({
  question_id: z.string().uuid('Invalid question ID format'),
  answer: z.string().min(1, 'Answer cannot be empty'),
  move_to_next: z.boolean().optional().default(true),
  time_spent: z.number().min(0).optional() // Time spent on this question in milliseconds
})

/**
 * GET /api/quiz/session/[id] - Get quiz session state
 * Returns current session state with questions and progress
 */
export async function GET(
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

    // Get quiz session
    const session = await getQuizSession(sessionId)
    if (!session) {
      return createErrorResponse('Quiz session not found', 404)
    }

    // Verify user owns this session
    if (session.userId !== authResult.user.id) {
      return createErrorResponse('Access denied', 403)
    }

    // Get quiz and questions data
    const supabase = createServerSupabaseClient()
    const { data: quizData, error: quizError } = await supabase
      .from('daily_quizzes')
      .select('question_ids')
      .eq('id', session.dailyQuizId)
      .single()

    if (quizError || !quizData) {
      return createErrorResponse('Quiz not found', 404)
    }

    // Get questions
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
      .in('id', quizData.question_ids)

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError)
      return createErrorResponse('Failed to load quiz questions', 500)
    }

    // Order questions according to quiz order
    const orderedQuestions = quizData.question_ids.map((id: string) => 
      questions?.find(q => q.id === id)
    ).filter(Boolean)

    // Calculate progress
    const totalQuestions = orderedQuestions.length
    const answeredQuestions = Object.keys(session.answers).length
    const progressPercentage = Math.round((answeredQuestions / totalQuestions) * 100)

    // Check for session timeout (24 hours)
    const sessionAge = Date.now() - session.startedAt.getTime()
    const isExpired = sessionAge > 24 * 60 * 60 * 1000
    
    // Check for inactivity timeout (1 hour since last activity)
    const inactivityTime = Date.now() - session.lastActivityAt.getTime()
    const isInactive = inactivityTime > 60 * 60 * 1000

    return createSuccessResponse({
      session: {
        id: session.id,
        currentQuestionIndex: session.currentQuestionIndex,
        status: isExpired ? 'expired' : session.status,
        answers: session.answers,
        startedAt: session.startedAt,
        lastActivityAt: session.lastActivityAt,
        timezone: session.timezone
      },
      questions: orderedQuestions,
      progress: {
        current: answeredQuestions,
        total: totalQuestions,
        percentage: progressPercentage,
        currentQuestion: session.currentQuestionIndex < totalQuestions 
          ? orderedQuestions[session.currentQuestionIndex] 
          : null
      },
      metadata: {
        canContinue: !isExpired && session.status === 'in_progress',
        isExpired,
        isInactive,
        timeElapsed: sessionAge,
        timeSinceLastActivity: inactivityTime
      }
    })

  } catch (error) {
    console.error('Get quiz session error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PUT /api/quiz/session/[id]/answer - Submit answer and save state
 * Saves user's answer and optionally moves to next question
 */
export async function PUT(
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
    const body = await request.json()
    const { question_id, answer, move_to_next, time_spent } = UpdateSessionSchema.parse(body)

    // Verify user owns this session
    const session = await getQuizSession(sessionId)
    if (!session) {
      return createErrorResponse('Quiz session not found', 404)
    }

    if (session.userId !== authResult.user.id) {
      return createErrorResponse('Access denied', 403)
    }

    if (session.status !== 'in_progress') {
      return createErrorResponse('Quiz session is not active', 400)
    }

    // Check session timeout
    const sessionAge = Date.now() - session.startedAt.getTime()
    if (sessionAge > 24 * 60 * 60 * 1000) {
      return createErrorResponse('Quiz session has expired', 410)
    }

    // Save the answer
    const updatedSession = await saveQuizAnswer(
      sessionId,
      question_id,
      answer,
      move_to_next
    )

    // Get total questions for progress calculation
    const supabase = createServerSupabaseClient()
    const { data: quizData } = await supabase
      .from('daily_quizzes')
      .select('question_ids')
      .eq('id', session.dailyQuizId)
      .single()

    const totalQuestions = quizData?.question_ids.length || 5
    const answeredQuestions = Object.keys(updatedSession.answers).length
    const progressPercentage = Math.round((answeredQuestions / totalQuestions) * 100)

    return createSuccessResponse({
      session: {
        id: updatedSession.id,
        currentQuestionIndex: updatedSession.currentQuestionIndex,
        status: updatedSession.status,
        lastActivityAt: updatedSession.lastActivityAt
      },
      progress: {
        current: answeredQuestions,
        total: totalQuestions,
        percentage: progressPercentage,
        isComplete: answeredQuestions >= totalQuestions
      },
      metadata: {
        answerSaved: true,
        movedToNext: move_to_next,
        timeSpent: time_spent || 0
      }
    }, 'Answer saved successfully')

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request data', 400)
    }

    console.error('Save quiz answer error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Quiz session not found')) {
        return createErrorResponse('Quiz session not found', 404)
      }
      if (error.message.includes('not active')) {
        return createErrorResponse('Quiz session is not active', 400)
      }
    }

    return createErrorResponse('Internal server error', 500)
  }
}