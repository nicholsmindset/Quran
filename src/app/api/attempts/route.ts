import { createServerSupabaseClient } from '@/lib/supabase'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// Schema for creating attempt
const CreateAttemptSchema = z.object({
  question_id: z.string().uuid('Invalid question ID format'),
  correct: z.boolean(),
})

// Schema for getting attempts (query parameters)
const GetAttemptsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  question_id: z.string().uuid().optional(),
})

// POST /api/attempts - Create a new attempt
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verify authentication
    const token = extractBearerToken(request.headers.get('authorization'))
    const authResult = await verifyAuthToken(token)
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateAttemptSchema.parse(body)
    
    // Check if question exists and is approved
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, approved_at')
      .eq('id', validatedData.question_id)
      .single()
    
    if (questionError || !question) {
      return createErrorResponse('Question not found', 404)
    }
    
    if (!question.approved_at) {
      return createErrorResponse('Question is not approved for attempts', 400)
    }
    
    // Create the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        user_id: authResult.user.id,
        question_id: validatedData.question_id,
        correct: validatedData.correct,
      })
      .select(`
        id,
        user_id,
        question_id,
        correct,
        answered_at,
        questions (
          id,
          prompt,
          difficulty,
          verse_id,
          verses (
            surah,
            ayah,
            arabic_text
          )
        )
      `)
      .single()
    
    if (attemptError) {
      // Handle unique constraint violation (user already attempted this question)
      if (attemptError.code === '23505') {
        return createErrorResponse('You have already attempted this question', 409)
      }
      
      return createErrorResponse('Failed to record attempt', 500)
    }
    
    return createSuccessResponse(attempt, 'Attempt recorded successfully')
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', 400)
    }
    
    console.error('Create attempt error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// GET /api/attempts - Get user's attempts with pagination
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
    const queryData = GetAttemptsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      question_id: searchParams.get('question_id'),
    })
    
    const offset = (queryData.page - 1) * queryData.limit
    
    // Build query
    let query = supabase
      .from('attempts')
      .select(`
        id,
        user_id,
        question_id,
        correct,
        answered_at,
        questions (
          id,
          prompt,
          difficulty,
          verse_id,
          verses (
            surah,
            ayah,
            arabic_text,
            translation_en
          )
        )
      `, { count: 'exact' })
      .eq('user_id', authResult.user.id)
      .order('answered_at', { ascending: false })
    
    // Add question filter if provided
    if (queryData.question_id) {
      query = query.eq('question_id', queryData.question_id)
    }
    
    // Apply pagination
    const { data: attempts, error: attemptsError, count } = await query
      .range(offset, offset + queryData.limit - 1)
    
    if (attemptsError) {
      return createErrorResponse('Failed to fetch attempts', 500)
    }
    
    const totalPages = Math.ceil((count || 0) / queryData.limit)
    
    return createSuccessResponse({
      attempts,
      pagination: {
        page: queryData.page,
        limit: queryData.limit,
        total: count || 0,
        totalPages,
      },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 400)
    }
    
    console.error('Get attempts error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}