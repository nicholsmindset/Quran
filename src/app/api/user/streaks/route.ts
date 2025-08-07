import { NextRequest } from 'next/server'
import { verifyAuthToken, extractBearerToken, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/user/streaks - Get user's current and longest streaks
 * Returns detailed streak information and streak history
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractBearerToken(request.headers.get('authorization'))
    const authResult = await verifyAuthToken(token)
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication failed', 401)
    }

    const supabase = createServerSupabaseClient()
    const userId = authResult.user.id

    // Get streak information
    const { data: streakData, error: streakError } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak, updated_at')
      .eq('user_id', userId)
      .single()

    if (streakError && streakError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching streak data:', streakError)
      return createErrorResponse('Failed to fetch streak information', 500)
    }

    // Calculate streak status and next milestone
    const currentStreak = streakData?.current_streak || 0
    const longestStreak = streakData?.longest_streak || 0
    const lastUpdated = streakData?.updated_at ? new Date(streakData.updated_at) : null

    // Determine next milestone
    const milestones = [3, 7, 14, 30, 60, 100, 365]
    const nextMilestone = milestones.find(m => m > currentStreak) || null
    const previousMilestone = milestones.filter(m => m <= currentStreak).pop() || 0

    // Check if streak is at risk (no activity today)
    const today = new Date().toDateString()
    const lastUpdateDate = lastUpdated ? lastUpdated.toDateString() : null
    const isAtRisk = lastUpdateDate !== today && currentStreak > 0

    // Get recent quiz completion dates for streak visualization
    const { data: recentCompletions, error: completionsError } = await supabase
      .from('quiz_sessions')
      .select('completed_at, daily_quizzes(date)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(30)

    if (completionsError) {
      console.error('Error fetching recent completions:', completionsError)
    }

    // Build streak calendar (last 30 days)
    const streakCalendar = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const dateString = date.toLocaleDateString('en-CA') // YYYY-MM-DD format
      
      const hasCompleted = recentCompletions?.some(completion => {
        const quizDate = (completion.daily_quizzes as any)?.date
        return quizDate === dateString
      }) || false

      streakCalendar.push({
        date: dateString,
        completed: hasCompleted,
        dayOfWeek: date.getDay(),
        isToday: dateString === now.toLocaleDateString('en-CA'),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }

    // Calculate consistency metrics
    const completedDays = streakCalendar.filter(day => day.completed).length
    const consistencyRate = Math.round((completedDays / 30) * 100)

    // Streak statistics
    const streakStats = {
      current: currentStreak,
      longest: longestStreak,
      isActive: currentStreak > 0,
      isAtRisk,
      daysUntilNextMilestone: nextMilestone ? nextMilestone - currentStreak : null,
      lastUpdated,
      consistency: {
        rate: consistencyRate,
        completedDays,
        totalDays: 30
      }
    }

    // Milestone information
    const milestoneInfo = {
      current: previousMilestone,
      next: nextMilestone,
      progress: nextMilestone ? Math.round((currentStreak / nextMilestone) * 100) : 100,
      allMilestones: milestones.map(milestone => ({
        days: milestone,
        achieved: currentStreak >= milestone,
        isNext: milestone === nextMilestone
      }))
    }

    // Motivational messages based on streak status
    let message = 'Start your learning journey!'
    let encouragement = 'Complete today\'s quiz to begin your streak.'

    if (currentStreak === 0 && longestStreak > 0) {
      message = 'Ready for a comeback!'
      encouragement = `You've reached ${longestStreak} days before. You can do it again!`
    } else if (currentStreak === 1) {
      message = 'Great start!'
      encouragement = 'Keep going to build your learning habit.'
    } else if (currentStreak >= 2 && currentStreak < 7) {
      message = 'Building momentum!'
      encouragement = `${7 - currentStreak} more days to reach a week streak.`
    } else if (currentStreak >= 7 && currentStreak < 30) {
      message = 'Excellent consistency!'
      encouragement = `${30 - currentStreak} more days to reach a month streak.`
    } else if (currentStreak >= 30) {
      message = 'Outstanding dedication!'
      encouragement = 'You\'re developing a strong learning habit.'
    }

    if (isAtRisk && currentStreak > 0) {
      message = 'Streak at risk!'
      encouragement = 'Complete today\'s quiz to maintain your streak.'
    }

    return createSuccessResponse({
      streaks: streakStats,
      milestones: milestoneInfo,
      calendar: streakCalendar,
      motivation: {
        message,
        encouragement,
        isAtRisk
      },
      metadata: {
        timezone: 'UTC', // Could be made configurable
        period: '30days',
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Get user streaks error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}