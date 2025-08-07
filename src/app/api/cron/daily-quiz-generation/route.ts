import { NextRequest } from 'next/server'
import { generateDailyQuiz } from '@/lib/quiz-engine'
import { createErrorResponse, createSuccessResponse } from '@/lib/auth'

/**
 * POST /api/cron/daily-quiz-generation - CRON job for generating daily quizzes
 * This endpoint should be called by a CRON service (like Vercel Cron, GitHub Actions, or external scheduler)
 * to pre-generate daily quizzes for all timezones around 4 AM local time
 */
export async function POST(request: NextRequest) {
  try {
    // Verify CRON authorization (could use API key or other service-to-service auth)
    const cronSecret = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'cron-secret-key'
    
    if (cronSecret !== `Bearer ${expectedSecret}`) {
      return createErrorResponse('Unauthorized CRON request', 401)
    }

    const results = []
    const errors = []

    // Generate quizzes for multiple days to handle timezone differences
    // This ensures users in all timezones have quizzes ready when it's 4 AM for them
    const now = new Date()
    const dates = []
    
    // Generate for yesterday, today, and tomorrow to cover all timezones
    for (let i = -1; i <= 1; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      dates.push(date.toISOString().split('T')[0]) // YYYY-MM-DD format
    }

    // Generate quizzes for each date
    for (const date of dates) {
      try {
        console.log(`Generating daily quiz for ${date}...`)
        const quiz = await generateDailyQuiz(date)
        
        results.push({
          date,
          quizId: quiz.id,
          questionsCount: quiz.questionIds.length,
          status: 'success'
        })
        
        console.log(`✅ Generated quiz for ${date}: ${quiz.id}`)
      } catch (error) {
        console.error(`❌ Failed to generate quiz for ${date}:`, error)
        errors.push({
          date,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        })
      }
    }

    // Update quiz cache and cleanup old quizzes if needed
    try {
      await cleanupOldQuizzes()
    } catch (cleanupError) {
      console.warn('Quiz cleanup failed:', cleanupError)
    }

    const successCount = results.length
    const errorCount = errors.length
    const totalAttempted = dates.length

    // Log summary
    console.log(`📊 Daily quiz generation summary:`)
    console.log(`   ✅ Success: ${successCount}/${totalAttempted}`)
    console.log(`   ❌ Errors: ${errorCount}/${totalAttempted}`)

    if (errorCount > 0) {
      console.log(`   Error details:`, errors)
    }

    return createSuccessResponse({
      summary: {
        attempted: totalAttempted,
        successful: successCount,
        failed: errorCount,
        executedAt: new Date().toISOString()
      },
      results,
      errors: errorCount > 0 ? errors : undefined
    }, `Generated ${successCount}/${totalAttempted} daily quizzes`)

  } catch (error) {
    console.error('Daily quiz generation CRON job failed:', error)
    return createErrorResponse('CRON job execution failed', 500)
  }
}

/**
 * Cleanup old quiz data to prevent database bloat
 * Removes quiz sessions older than 30 days and daily quizzes older than 7 days
 */
async function cleanupOldQuizzes(): Promise<void> {
  const { createServerSupabaseClient } = await import('@/lib/supabase')
  const supabase = createServerSupabaseClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  try {
    // Cleanup old completed quiz sessions (keep for 30 days)
    const { error: sessionsError } = await supabase
      .from('quiz_sessions')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', thirtyDaysAgo.toISOString())

    if (sessionsError) {
      console.warn('Failed to cleanup old quiz sessions:', sessionsError)
    } else {
      console.log('✅ Cleaned up old quiz sessions')
    }

    // Cleanup old daily quizzes (keep for 7 days)
    const { error: quizzesError } = await supabase
      .from('daily_quizzes')
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString())

    if (quizzesError) {
      console.warn('Failed to cleanup old daily quizzes:', quizzesError)
    } else {
      console.log('✅ Cleaned up old daily quizzes')
    }

    // Cleanup expired sessions (older than 24 hours and not completed)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { error: expiredSessionsError } = await supabase
      .from('quiz_sessions')
      .update({ status: 'expired' })
      .eq('status', 'in_progress')
      .lt('last_activity_at', oneDayAgo.toISOString())

    if (expiredSessionsError) {
      console.warn('Failed to expire old sessions:', expiredSessionsError)
    } else {
      console.log('✅ Expired old inactive sessions')
    }

  } catch (error) {
    console.error('Cleanup operation failed:', error)
    throw error
  }
}

/**
 * GET endpoint for health check and manual trigger (for development/testing)
 */
export async function GET(request: NextRequest) {
  // Simple health check for the CRON endpoint
  return createSuccessResponse({
    service: 'daily-quiz-generation',
    status: 'ready',
    timestamp: new Date().toISOString(),
    nextExecution: 'Scheduled for 4 AM local time via external CRON service',
    endpoints: {
      trigger: 'POST /api/cron/daily-quiz-generation (with Bearer auth)',
      health: 'GET /api/cron/daily-quiz-generation'
    }
  })
}