import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

// Schema for progress query parameters
const ProgressQuerySchema = z.object({
  period: z.enum(['week', 'month', '3months', 'year', 'all']).optional().default('month'),
  include_breakdown: z.coerce.boolean().optional().default(true),
  timezone: z.string().optional().default('UTC')
})

/**
 * GET /api/user/progress - Get user progress statistics
 * Returns comprehensive progress data including accuracy, streaks, and performance trends
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
    const { period, include_breakdown, timezone } = ProgressQuerySchema.parse({
      period: searchParams.get('period'),
      include_breakdown: searchParams.get('include_breakdown'),
      timezone: searchParams.get('timezone')
    })

    const supabase = createServerSupabaseClient()
    const userId = authResult.user.id

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date('2020-01-01') // Far back enough to include all data
        break
    }

    // Get user attempts within the period
    const { data: attempts, error: attemptsError } = await supabase
      .from('attempts')
      .select(`
        id,
        correct,
        answered_at,
        questions (
          id,
          difficulty,
          verses (
            surah
          )
        )
      `)
      .eq('user_id', userId)
      .gte('answered_at', startDate.toISOString())
      .order('answered_at', { ascending: true })

    if (attemptsError) {
      console.error('Error fetching user attempts:', attemptsError)
      return createErrorResponse('Failed to fetch progress data', 500)
    }

    // Get streak information
    const { data: streakData } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak, updated_at')
      .eq('user_id', userId)
      .single()

    // Calculate basic statistics
    const totalAttempts = attempts?.length || 0
    const correctAttempts = attempts?.filter(a => a.correct).length || 0
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    // Calculate daily completion rate for the period
    const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const uniqueDays = new Set(
      attempts?.map(a => new Date(a.answered_at).toDateString()) || []
    ).size
    const completionRate = Math.round((uniqueDays / daysInPeriod) * 100)

    // Build response data
    const progressData: any = {
      overview: {
        totalAttempts,
        correctAnswers: correctAttempts,
        accuracy,
        completionRate,
        activeDays: uniqueDays,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      },
      streaks: {
        current: streakData?.current_streak || 0,
        longest: streakData?.longest_streak || 0,
        lastUpdated: streakData?.updated_at || null
      }
    }

    if (include_breakdown && attempts) {
      // Difficulty breakdown
      const difficultyStats = {
        easy: { total: 0, correct: 0, accuracy: 0 },
        medium: { total: 0, correct: 0, accuracy: 0 },
        hard: { total: 0, correct: 0, accuracy: 0 }
      }

      // Surah breakdown (top 10)
      const surahStats: { [key: number]: { total: number, correct: number } } = {}

      // Daily activity (last 30 days for trending)
      const dailyActivity: { [key: string]: { total: number, correct: number } } = {}

      attempts.forEach(attempt => {
        const difficulty = (attempt.questions as any)?.difficulty
        const surah = (attempt.questions as any)?.verses?.surah
        const date = new Date(attempt.answered_at).toDateString()

        // Difficulty stats
        if (difficulty && difficultyStats[difficulty]) {
          difficultyStats[difficulty].total++
          if (attempt.correct) {
            difficultyStats[difficulty].correct++
          }
        }

        // Surah stats
        if (surah) {
          if (!surahStats[surah]) {
            surahStats[surah] = { total: 0, correct: 0 }
          }
          surahStats[surah].total++
          if (attempt.correct) {
            surahStats[surah].correct++
          }
        }

        // Daily activity
        if (!dailyActivity[date]) {
          dailyActivity[date] = { total: 0, correct: 0 }
        }
        dailyActivity[date].total++
        if (attempt.correct) {
          dailyActivity[date].correct++
        }
      })

      // Calculate accuracy for each difficulty
      Object.keys(difficultyStats).forEach(difficulty => {
        const stats = difficultyStats[difficulty]
        stats.accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      })

      // Top surahs (by total attempts)
      const topSurahs = Object.entries(surahStats)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 10)
        .map(([surah, stats]) => ({
          surah: parseInt(surah),
          total: stats.total,
          correct: stats.correct,
          accuracy: Math.round((stats.correct / stats.total) * 100)
        }))

      // Recent daily activity (last 30 days)
      const recentActivity = Object.entries(dailyActivity)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .slice(0, 30)
        .map(([date, stats]) => ({
          date,
          total: stats.total,
          correct: stats.correct,
          accuracy: Math.round((stats.correct / stats.total) * 100)
        }))

      progressData.breakdown = {
        byDifficulty: difficultyStats,
        topSurahs,
        recentActivity: recentActivity.reverse() // Oldest first for charting
      }

      // Performance trends
      if (attempts.length >= 10) {
        const recentAccuracy = attempts.slice(-10)
        const recentCorrect = recentAccuracy.filter(a => a.correct).length
        const recentAccuracyRate = Math.round((recentCorrect / 10) * 100)
        
        const olderAccuracy = attempts.slice(0, Math.min(10, attempts.length - 10))
        const olderCorrect = olderAccuracy.filter(a => a.correct).length
        const olderAccuracyRate = olderAccuracy.length > 0 
          ? Math.round((olderCorrect / olderAccuracy.length) * 100) 
          : recentAccuracyRate

        progressData.trends = {
          accuracyTrend: recentAccuracyRate - olderAccuracyRate, // Positive = improving
          recentAccuracy: recentAccuracyRate,
          isImproving: recentAccuracyRate > olderAccuracyRate
        }
      }
    }

    // Achievement flags
    progressData.achievements = {
      hasCompletedQuiz: totalAttempts > 0,
      perfectAccuracy: accuracy === 100 && totalAttempts >= 5,
      activeStreak: (streakData?.current_streak || 0) >= 7,
      longtimeUser: totalAttempts >= 100,
      consistent: completionRate >= 80
    }

    return createSuccessResponse(progressData)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid query parameters', 400)
    }

    console.error('Get user progress error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}