import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

// Schema for recording activity
const RecordActivitySchema = z.object({
  activity_type: z.enum(['quiz_started', 'quiz_completed', 'question_answered', 'session_resumed']),
  metadata: z.object({
    session_id: z.string().uuid().optional(),
    question_id: z.string().uuid().optional(),
    time_spent: z.number().min(0).optional(),
    score: z.number().min(0).max(100).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    is_correct: z.boolean().optional()
  }).optional()
})

// Schema for getting activity
const GetActivitySchema = z.object({
  days: z.coerce.number().min(1).max(365).optional().default(30),
  activity_type: z.enum(['quiz_started', 'quiz_completed', 'question_answered', 'session_resumed']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20)
})

/**
 * POST /api/user/activity - Record learning activity
 * Tracks user engagement and learning patterns
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
    const { activity_type, metadata } = RecordActivitySchema.parse(body)

    const supabase = createServerSupabaseClient()
    const userId = authResult.user.id

    // Create activity record (using a simple approach since we don't have an activities table in schema)
    // For now, we'll use this endpoint primarily for client-side tracking and return success
    // In a full implementation, you'd want to create an activities table

    // For streak tracking specifically related to quiz completion
    if (activity_type === 'quiz_completed' && metadata?.score !== undefined) {
      // Update user activity timestamp
      const { error: updateError } = await supabase
        .from('streaks')
        .upsert({
          user_id: userId,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        console.error('Error updating activity timestamp:', updateError)
      }
    }

    // For now, we'll just acknowledge the activity was recorded
    return createSuccessResponse({
      activity: {
        type: activity_type,
        userId,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
      }
    }, 'Activity recorded successfully')

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid activity data', 400)
    }

    console.error('Record activity error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * GET /api/user/activity - Get user's learning activity history
 * Returns activity patterns and engagement metrics
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
    const { days, activity_type, page, limit } = GetActivitySchema.parse({
      days: searchParams.get('days'),
      activity_type: searchParams.get('activity_type'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    const supabase = createServerSupabaseClient()
    const userId = authResult.user.id

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get quiz sessions as activity indicators
    let query = supabase
      .from('quiz_sessions')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        last_activity_at,
        current_question_index,
        daily_quizzes (
          date
        )
      `)
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })

    const { data: sessions, error: sessionsError } = await query

    if (sessionsError) {
      console.error('Error fetching activity sessions:', sessionsError)
      return createErrorResponse('Failed to fetch activity data', 500)
    }

    // Get attempts within the period for more detailed activity
    const { data: attempts, error: attemptsError } = await supabase
      .from('attempts')
      .select(`
        id,
        correct,
        answered_at,
        questions (
          id,
          difficulty,
          prompt
        )
      `)
      .eq('user_id', userId)
      .gte('answered_at', startDate.toISOString())
      .order('answered_at', { ascending: false })

    if (attemptsError) {
      console.error('Error fetching activity attempts:', attemptsError)
    }

    // Process sessions into activity timeline
    const activities = []

    if (sessions) {
      for (const session of sessions) {
        // Quiz started activity
        activities.push({
          id: `session_start_${session.id}`,
          type: 'quiz_started',
          timestamp: session.started_at,
          metadata: {
            sessionId: session.id,
            quizDate: (session.daily_quizzes as any)?.date
          }
        })

        // Quiz completed activity (if completed)
        if (session.status === 'completed' && session.completed_at) {
          const duration = new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()
          activities.push({
            id: `session_complete_${session.id}`,
            type: 'quiz_completed',
            timestamp: session.completed_at,
            metadata: {
              sessionId: session.id,
              duration,
              quizDate: (session.daily_quizzes as any)?.date
            }
          })
        }

        // Session resumed activities (if there's a gap in activity)
        if (session.last_activity_at !== session.started_at) {
          activities.push({
            id: `session_resume_${session.id}`,
            type: 'session_resumed',
            timestamp: session.last_activity_at,
            metadata: {
              sessionId: session.id,
              currentQuestion: session.current_question_index
            }
          })
        }
      }
    }

    // Add question answered activities from attempts
    if (attempts) {
      for (const attempt of attempts) {
        activities.push({
          id: `question_${attempt.id}`,
          type: 'question_answered',
          timestamp: attempt.answered_at,
          metadata: {
            questionId: (attempt.questions as any)?.id,
            isCorrect: attempt.correct,
            difficulty: (attempt.questions as any)?.difficulty
          }
        })
      }
    }

    // Sort activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Filter by activity type if specified
    const filteredActivities = activity_type 
      ? activities.filter(a => a.type === activity_type)
      : activities

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedActivities = filteredActivities.slice(offset, offset + limit)

    // Calculate activity statistics
    const stats = {
      total: filteredActivities.length,
      byType: {
        quiz_started: activities.filter(a => a.type === 'quiz_started').length,
        quiz_completed: activities.filter(a => a.type === 'quiz_completed').length,
        question_answered: activities.filter(a => a.type === 'question_answered').length,
        session_resumed: activities.filter(a => a.type === 'session_resumed').length
      },
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
    }

    // Daily activity summary
    const dailyActivity: { [key: string]: number } = {}
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString()
      dailyActivity[date] = (dailyActivity[date] || 0) + 1
    })

    const dailySummary = Object.entries(dailyActivity)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 7) // Last 7 days
      .map(([date, count]) => ({
        date,
        activityCount: count
      }))

    return createSuccessResponse({
      activities: paginatedActivities,
      statistics: stats,
      dailySummary,
      pagination: {
        page,
        limit,
        total: filteredActivities.length,
        totalPages: Math.ceil(filteredActivities.length / limit)
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 400)
    }

    console.error('Get user activity error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}