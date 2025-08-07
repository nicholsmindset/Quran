import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Question } from '@/types'

/**
 * GET /api/quiz/session/[id]/questions - Get questions for a quiz session
 * Returns the questions for the quiz session without the correct answers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    // Get the quiz session to find the daily quiz ID
    const supabase = createServerSupabaseClient()
    
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select(`
        id,
        daily_quiz_id,
        status,
        user_id
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return createErrorResponse('Quiz session not found', 404)
    }

    // Get the daily quiz to find question IDs
    const { data: dailyQuiz, error: quizError } = await supabase
      .from('daily_quizzes')
      .select('question_ids')
      .eq('id', session.daily_quiz_id)
      .single()

    if (quizError || !dailyQuiz) {
      return createErrorResponse('Quiz not found', 404)
    }

    // Get the questions (without correct answers for security)
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
      .in('id', dailyQuiz.question_ids)

    if (questionsError || !questions) {
      return createErrorResponse('Failed to load quiz questions', 500)
    }

    // Order questions according to quiz order and transform to client format
    const orderedQuestions: Question[] = dailyQuiz.question_ids.map((id: string) => {
      const question = questions.find(q => q.id === id)
      if (!question) return null

      return {
        id: question.id,
        verseId: question.verse_id,
        prompt: question.prompt,
        choices: question.choices || [],
        answer: '', // Don't send correct answer to client
        difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
        approvedAt: new Date(), // Mock - would come from actual approval date
        createdAt: new Date(),
        createdBy: 'system',
        moderatedBy: undefined,
        moderationNotes: undefined,
        status: 'approved' as const,
        priority: 'medium' as const,
        categoryTags: undefined,
        arabicAccuracy: undefined
      }
    }).filter(Boolean) as Question[]

    return createSuccessResponse({
      questions: orderedQuestions,
      metadata: {
        sessionId: session.id,
        totalQuestions: orderedQuestions.length,
        sessionStatus: session.status
      }
    })

  } catch (error) {
    console.error('Get session questions error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}