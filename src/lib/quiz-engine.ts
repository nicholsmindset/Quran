import { createServerSupabaseClient } from './supabase'
import { Question, DailyQuiz, QuizSession, QuizAnswer, QuizResult } from '@/types'

/**
 * Quiz Engine - Core functionality for daily quiz system
 * Handles quiz generation, session management, and progress tracking
 */

// Cache for daily quizzes to avoid regeneration
const dailyQuizCache = new Map<string, DailyQuiz>()

/**
 * Generate a daily quiz with balanced difficulty
 * 2 easy, 2 medium, 1 hard questions from different surahs
 */
export async function generateDailyQuiz(date: string): Promise<DailyQuiz> {
  const supabase = createServerSupabaseClient()
  
  // Check cache first
  if (dailyQuizCache.has(date)) {
    return dailyQuizCache.get(date)!
  }

  // Check if quiz already exists in database
  const { data: existingQuiz } = await supabase
    .from('daily_quizzes')
    .select('*')
    .eq('date', date)
    .single()

  if (existingQuiz) {
    const quiz: DailyQuiz = {
      id: existingQuiz.id,
      date: existingQuiz.date,
      questionIds: existingQuiz.question_ids,
      createdAt: new Date(existingQuiz.created_at)
    }
    dailyQuizCache.set(date, quiz)
    return quiz
  }

  // Generate new quiz with balanced difficulty
  const questions = await selectBalancedQuestions()
  
  // Create daily quiz record
  const { data: newQuiz, error } = await supabase
    .from('daily_quizzes')
    .insert({
      date,
      question_ids: questions.map(q => q.id)
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create daily quiz: ${error.message}`)
  }

  const quiz: DailyQuiz = {
    id: newQuiz.id,
    date: newQuiz.date,
    questionIds: newQuiz.question_ids,
    questions,
    createdAt: new Date(newQuiz.created_at)
  }

  // Cache the quiz
  dailyQuizCache.set(date, quiz)
  
  return quiz
}

/**
 * Select balanced questions for daily quiz
 */
async function selectBalancedQuestions(): Promise<Question[]> {
  const supabase = createServerSupabaseClient()
  
  // Get approved questions by difficulty
  const difficulties = [
    { level: 'easy', count: 2 },
    { level: 'medium', count: 2 },
    { level: 'hard', count: 1 }
  ] as const

  const selectedQuestions: Question[] = []
  const usedSurahs = new Set<number>()

  for (const { level, count } of difficulties) {
    // Get available questions for this difficulty
    const query = supabase
      .from('questions')
      .select(`
        id,
        verse_id,
        prompt,
        choices,
        answer,
        difficulty,
        approved_at,
        created_at,
        created_by,
        verses (
          id,
          surah,
          ayah,
          arabic_text,
          translation_en
        )
      `)
      .eq('difficulty', level)
      .not('approved_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(count * 5) // Get extra options for variety

    const { data: questions, error } = await query

    if (error || !questions) {
      throw new Error(`Failed to fetch ${level} questions: ${error?.message}`)
    }

    // Select questions from different surahs when possible
    const questionsFromDifferentSurahs = questions.filter(q => 
      !usedSurahs.has((q.verses as any).surah)
    )

    // Fill remaining slots with any available questions
    const availableQuestions = questionsFromDifferentSurahs.length >= count 
      ? questionsFromDifferentSurahs 
      : questions

    // Randomly select required count
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, count)

    // Track used surahs
    selected.forEach(q => usedSurahs.add((q.verses as any).surah))

    // Transform to Question type
    const transformedQuestions = selected.map(q => ({
      id: q.id,
      verseId: q.verse_id,
      prompt: q.prompt,
      choices: q.choices,
      answer: q.answer,
      difficulty: q.difficulty,
      approvedAt: q.approved_at ? new Date(q.approved_at) : undefined,
      createdAt: new Date(q.created_at),
      createdBy: q.created_by,
      status: 'approved' as const,
      priority: 'medium' as const
    }))

    selectedQuestions.push(...transformedQuestions)
  }

  // Shuffle final questions
  return selectedQuestions.sort(() => Math.random() - 0.5)
}

/**
 * Get current daily quiz for user's timezone
 */
export async function getCurrentDailyQuiz(timezone: string = 'UTC'): Promise<DailyQuiz> {
  const userDate = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
  return generateDailyQuiz(userDate)
}

/**
 * Start a new quiz session for a user
 */
export async function startQuizSession(
  userId: string, 
  dailyQuizId: string, 
  timezone: string = 'UTC'
): Promise<QuizSession> {
  const supabase = createServerSupabaseClient()

  // Check for existing active session
  const { data: existingSession } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('daily_quiz_id', dailyQuizId)
    .in('status', ['in_progress'])
    .single()

  if (existingSession) {
    // Return existing session
    return {
      id: existingSession.id,
      userId: existingSession.user_id,
      dailyQuizId: existingSession.daily_quiz_id,
      currentQuestionIndex: existingSession.current_question_index,
      answers: existingSession.answers,
      status: existingSession.status,
      startedAt: new Date(existingSession.started_at),
      completedAt: existingSession.completed_at ? new Date(existingSession.completed_at) : undefined,
      lastActivityAt: new Date(existingSession.last_activity_at),
      timezone: existingSession.timezone
    }
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      daily_quiz_id: dailyQuizId,
      current_question_index: 0,
      answers: {},
      status: 'in_progress',
      timezone,
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create quiz session: ${error.message}`)
  }

  return {
    id: newSession.id,
    userId: newSession.user_id,
    dailyQuizId: newSession.daily_quiz_id,
    currentQuestionIndex: newSession.current_question_index,
    answers: newSession.answers,
    status: newSession.status,
    startedAt: new Date(newSession.started_at),
    completedAt: newSession.completed_at ? new Date(newSession.completed_at) : undefined,
    lastActivityAt: new Date(newSession.last_activity_at),
    timezone: newSession.timezone
  }
}

/**
 * Save answer and update session state
 */
export async function saveQuizAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
  moveToNext: boolean = true
): Promise<QuizSession> {
  const supabase = createServerSupabaseClient()

  // Get current session
  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error('Quiz session not found')
  }

  if (session.status !== 'in_progress') {
    throw new Error('Quiz session is not active')
  }

  // Update answers and potentially move to next question
  const updatedAnswers = { ...session.answers, [questionId]: answer }
  const nextQuestionIndex = moveToNext 
    ? session.current_question_index + 1 
    : session.current_question_index

  const { data: updatedSession, error: updateError } = await supabase
    .from('quiz_sessions')
    .update({
      answers: updatedAnswers,
      current_question_index: nextQuestionIndex,
      last_activity_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (updateError) {
    throw new Error(`Failed to save answer: ${updateError.message}`)
  }

  return {
    id: updatedSession.id,
    userId: updatedSession.user_id,
    dailyQuizId: updatedSession.daily_quiz_id,
    currentQuestionIndex: updatedSession.current_question_index,
    answers: updatedSession.answers,
    status: updatedSession.status,
    startedAt: new Date(updatedSession.started_at),
    completedAt: updatedSession.completed_at ? new Date(updatedSession.completed_at) : undefined,
    lastActivityAt: new Date(updatedSession.last_activity_at),
    timezone: updatedSession.timezone
  }
}

/**
 * Complete quiz session and calculate results
 */
export async function completeQuizSession(sessionId: string): Promise<QuizResult> {
  const supabase = createServerSupabaseClient()

  // Get session with quiz data
  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .select(`
      *,
      daily_quizzes (
        question_ids
      )
    `)
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error('Quiz session not found')
  }

  // Get questions and correct answers
  const questionIds = (session.daily_quizzes as any).question_ids
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, answer, difficulty')
    .in('id', questionIds)

  if (questionsError || !questions) {
    throw new Error('Failed to fetch quiz questions')
  }

  // Calculate results
  const answers: QuizAnswer[] = []
  let correctCount = 0

  for (const question of questions) {
    const userAnswer = session.answers[question.id]
    const isCorrect = userAnswer === question.answer
    
    if (isCorrect) correctCount++

    answers.push({
      questionId: question.id,
      selectedAnswer: userAnswer || '',
      isCorrect,
      timeSpent: 0 // Could be enhanced to track per-question time
    })

    // Record attempt in database
    await supabase
      .from('attempts')
      .insert({
        user_id: session.user_id,
        question_id: question.id,
        correct: isCorrect
      })
  }

  // Update session as completed
  await supabase
    .from('quiz_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  // Update streak if all answers correct
  let streakUpdated = false
  if (correctCount === questions.length) {
    // Update user streak
    const { error: streakError } = await supabase.rpc('update_user_streak', {
      p_user_id: session.user_id
    })
    
    if (!streakError) {
      streakUpdated = true
    }
  } else {
    // Reset streak if not perfect score
    await supabase
      .from('streaks')
      .upsert({
        user_id: session.user_id,
        current_streak: 0,
        updated_at: new Date().toISOString()
      })
  }

  const totalTime = new Date().getTime() - new Date(session.started_at).getTime()

  return {
    sessionId,
    score: Math.round((correctCount / questions.length) * 100),
    totalQuestions: questions.length,
    correctAnswers: correctCount,
    timeSpent: totalTime,
    answers,
    streakUpdated
  }
}

/**
 * Get quiz session by ID
 */
export async function getQuizSession(sessionId: string): Promise<QuizSession | null> {
  const supabase = createServerSupabaseClient()

  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    return null
  }

  return {
    id: session.id,
    userId: session.user_id,
    dailyQuizId: session.daily_quiz_id,
    currentQuestionIndex: session.current_question_index,
    answers: session.answers,
    status: session.status,
    startedAt: new Date(session.started_at),
    completedAt: session.completed_at ? new Date(session.completed_at) : undefined,
    lastActivityAt: new Date(session.last_activity_at),
    timezone: session.timezone
  }
}

/**
 * Check if user has completed today's quiz
 */
export async function hasCompletedDailyQuiz(userId: string, timezone: string = 'UTC'): Promise<boolean> {
  const supabase = createServerSupabaseClient()
  
  const userDate = new Date().toLocaleDateString('en-CA', { timeZone: timezone })
  
  // Get today's quiz
  const { data: dailyQuiz } = await supabase
    .from('daily_quizzes')
    .select('id')
    .eq('date', userDate)
    .single()

  if (!dailyQuiz) return false

  // Check for completed session
  const { data: completedSession } = await supabase
    .from('quiz_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('daily_quiz_id', dailyQuiz.id)
    .eq('status', 'completed')
    .single()

  return !!completedSession
}

/**
 * Get user's quiz completion status for today
 */
export interface QuizStatus {
  hasCompletedToday: boolean
  currentSession?: QuizSession
  todaysQuiz: DailyQuiz
  streakInfo: {
    current: number
    longest: number
  }
}

export async function getUserQuizStatus(userId: string, timezone: string = 'UTC'): Promise<QuizStatus> {
  const supabase = createServerSupabaseClient()
  
  // Get today's quiz
  const todaysQuiz = await getCurrentDailyQuiz(timezone)
  
  // Check for existing sessions
  const { data: sessions } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('daily_quiz_id', todaysQuiz.id)
    .order('created_at', { ascending: false })

  const completedSession = sessions?.find(s => s.status === 'completed')
  const activeSession = sessions?.find(s => s.status === 'in_progress')

  // Get streak info
  const { data: streakData } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single()

  return {
    hasCompletedToday: !!completedSession,
    currentSession: activeSession ? {
      id: activeSession.id,
      userId: activeSession.user_id,
      dailyQuizId: activeSession.daily_quiz_id,
      currentQuestionIndex: activeSession.current_question_index,
      answers: activeSession.answers,
      status: activeSession.status,
      startedAt: new Date(activeSession.started_at),
      completedAt: activeSession.completed_at ? new Date(activeSession.completed_at) : undefined,
      lastActivityAt: new Date(activeSession.last_activity_at),
      timezone: activeSession.timezone
    } : undefined,
    todaysQuiz,
    streakInfo: {
      current: streakData?.current_streak || 0,
      longest: streakData?.longest_streak || 0
    }
  }
}