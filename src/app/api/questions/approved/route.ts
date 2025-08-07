import { createServerSupabaseClient } from '@/lib/supabase'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// Schema for getting approved questions
const GetApprovedQuestionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  surah: z.coerce.number().min(1).max(114).optional(),
  exclude_attempted: z.coerce.boolean().default(false),
})

// GET /api/questions/approved - Get approved questions for quiz
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verify authentication
    const token = extractBearerToken(request.headers.get('authorization'))
    const authResult = await verifyAuthToken(token)
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = GetApprovedQuestionsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      difficulty: searchParams.get('difficulty'),
      surah: searchParams.get('surah'),
      exclude_attempted: searchParams.get('exclude_attempted'),
    })
    
    const offset = (queryData.page - 1) * queryData.limit
    
    // Build base query for approved questions
    let query = supabase
      .from('questions')
      .select(`
        id,
        verse_id,
        prompt,
        choices,
        answer,
        difficulty,
        approved_at,
        verses (
          id,
          surah,
          ayah,
          arabic_text,
          translation_en
        )
      `, { count: 'exact' })
      .not('approved_at', 'is', null)
    
    // Add difficulty filter
    if (queryData.difficulty) {
      query = query.eq('difficulty', queryData.difficulty)
    }
    
    // Add surah filter
    if (queryData.surah) {
      query = query.eq('verses.surah', queryData.surah)
    }
    
    // Exclude questions the user has already attempted
    if (queryData.exclude_attempted) {
      const { data: attemptedQuestions, error: attemptedError } = await supabase
        .from('attempts')
        .select('question_id')
        .eq('user_id', authResult.user.id)
      
      if (attemptedError) {
        console.error('Error fetching attempted questions:', attemptedError)
      } else if (attemptedQuestions && attemptedQuestions.length > 0) {
        const attemptedIds = attemptedQuestions.map(a => a.question_id)
        query = query.not('id', 'in', `(${attemptedIds.join(',')})`)
      }
    }
    
    // Apply pagination and ordering
    const { data: questions, error: questionsError, count } = await query
      .order('approved_at', { ascending: false })
      .range(offset, offset + queryData.limit - 1)
    
    if (questionsError) {
      console.error('Questions query error:', questionsError)
      return createErrorResponse('Failed to fetch questions', 500)
    }
    
    const totalPages = Math.ceil((count || 0) / queryData.limit)
    
    // Get user's statistics for context
    const { data: userStats, error: statsError } = await supabase
      .from('attempts')
      .select('correct')
      .eq('user_id', authResult.user.id)
    
    let correctCount = 0
    let totalAttempts = 0
    
    if (!statsError && userStats) {
      totalAttempts = userStats.length
      correctCount = userStats.filter(a => a.correct).length
    }
    
    // Get user's current streak
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', authResult.user.id)
      .single()
    
    const userProgress = {
      totalAttempts,
      correctAnswers: correctCount,
      accuracy: totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0,
      currentStreak: streakData?.current_streak || 0,
      longestStreak: streakData?.longest_streak || 0,
    }
    
    return createSuccessResponse({
      questions,
      pagination: {
        page: queryData.page,
        limit: queryData.limit,
        total: count || 0,
        totalPages,
      },
      userProgress,
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 400)
    }
    
    console.error('Get approved questions error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}