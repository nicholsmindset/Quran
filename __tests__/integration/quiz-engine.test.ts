import { describe, test, expect, beforeEach, afterEach } from '@jest/test-runner'
import { 
  generateDailyQuiz,
  getCurrentDailyQuiz,
  startQuizSession,
  saveQuizAnswer,
  completeQuizSession,
  getQuizSession,
  hasCompletedDailyQuiz,
  getUserQuizStatus
} from '@/lib/quiz-engine'

// Integration tests for quiz engine - these would run against a test database
// Mock the database functions for testing purposes

jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    rpc: jest.fn()
  })
}))

describe('Quiz Engine Integration Tests', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient = require('@/lib/supabase').createServerSupabaseClient()
  })

  describe('generateDailyQuiz', () => {
    test('creates new daily quiz with balanced questions', async () => {
      const date = '2024-01-15'
      
      // Mock: quiz doesn't exist
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // No rows returned
      })

      // Mock: approved questions by difficulty
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [
          {
            id: 'easy1',
            verse_id: 'v1',
            prompt: 'Easy question 1',
            choices: ['A', 'B', 'C', 'D'],
            answer: 'A',
            difficulty: 'easy',
            approved_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            created_by: 'ai',
            verses: { surah: 1, ayah: 1, arabic_text: 'Arabic 1', translation_en: 'English 1' }
          },
          {
            id: 'easy2',
            verse_id: 'v2',
            prompt: 'Easy question 2',
            choices: ['A', 'B', 'C', 'D'],
            answer: 'B',
            difficulty: 'easy',
            approved_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            created_by: 'ai',
            verses: { surah: 2, ayah: 1, arabic_text: 'Arabic 2', translation_en: 'English 2' }
          }
        ],
        error: null
      }).mockResolvedValueOnce({
        data: [
          {
            id: 'med1',
            verse_id: 'v3',
            prompt: 'Medium question 1',
            choices: ['A', 'B', 'C', 'D'],
            answer: 'C',
            difficulty: 'medium',
            approved_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            created_by: 'ai',
            verses: { surah: 3, ayah: 1, arabic_text: 'Arabic 3', translation_en: 'English 3' }
          },
          {
            id: 'med2',
            verse_id: 'v4',
            prompt: 'Medium question 2',
            choices: ['A', 'B', 'C', 'D'],
            answer: 'D',
            difficulty: 'medium',
            approved_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            created_by: 'ai',
            verses: { surah: 4, ayah: 1, arabic_text: 'Arabic 4', translation_en: 'English 4' }
          }
        ],
        error: null
      }).mockResolvedValueOnce({
        data: [
          {
            id: 'hard1',
            verse_id: 'v5',
            prompt: 'Hard question 1',
            choices: ['A', 'B', 'C', 'D'],
            answer: 'A',
            difficulty: 'hard',
            approved_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            created_by: 'ai',
            verses: { surah: 5, ayah: 1, arabic_text: 'Arabic 5', translation_en: 'English 5' }
          }
        ],
        error: null
      })

      // Mock: create daily quiz
      mockSupabaseClient.insert.mockResolvedValue({
        data: {
          id: 'quiz-id',
          date,
          question_ids: ['easy1', 'easy2', 'med1', 'med2', 'hard1'],
          created_at: '2024-01-15T04:00:00Z'
        },
        error: null
      })

      const quiz = await generateDailyQuiz(date)

      expect(quiz.id).toBe('quiz-id')
      expect(quiz.date).toBe(date)
      expect(quiz.questionIds).toHaveLength(5)
      expect(quiz.questions).toBeDefined()
      expect(quiz.questions?.filter(q => q.difficulty === 'easy')).toHaveLength(2)
      expect(quiz.questions?.filter(q => q.difficulty === 'medium')).toHaveLength(2)
      expect(quiz.questions?.filter(q => q.difficulty === 'hard')).toHaveLength(1)
    })

    test('returns existing quiz from cache', async () => {
      const date = '2024-01-15'
      
      // Mock: quiz already exists
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'existing-quiz-id',
          date,
          question_ids: ['q1', 'q2', 'q3', 'q4', 'q5'],
          created_at: '2024-01-15T04:00:00Z'
        },
        error: null
      })

      const quiz = await generateDailyQuiz(date)

      expect(quiz.id).toBe('existing-quiz-id')
      expect(quiz.date).toBe(date)
      expect(quiz.questionIds).toEqual(['q1', 'q2', 'q3', 'q4', 'q5'])
    })
  })

  describe('startQuizSession', () => {
    test('creates new session when none exists', async () => {
      const userId = 'test-user-id'
      const dailyQuizId = 'quiz-id'
      const timezone = 'America/New_York'

      // Mock: no existing session
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Mock: create new session
      mockSupabaseClient.insert.mockResolvedValue({
        data: {
          id: 'session-id',
          user_id: userId,
          daily_quiz_id: dailyQuizId,
          current_question_index: 0,
          answers: {},
          status: 'in_progress',
          started_at: '2024-01-15T15:00:00Z',
          completed_at: null,
          last_activity_at: '2024-01-15T15:00:00Z',
          timezone
        },
        error: null
      })

      const session = await startQuizSession(userId, dailyQuizId, timezone)

      expect(session.id).toBe('session-id')
      expect(session.userId).toBe(userId)
      expect(session.dailyQuizId).toBe(dailyQuizId)
      expect(session.currentQuestionIndex).toBe(0)
      expect(session.status).toBe('in_progress')
      expect(session.timezone).toBe(timezone)
    })

    test('returns existing active session', async () => {
      const userId = 'test-user-id'
      const dailyQuizId = 'quiz-id'
      const timezone = 'UTC'

      // Mock: existing session found
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'existing-session-id',
          user_id: userId,
          daily_quiz_id: dailyQuizId,
          current_question_index: 2,
          answers: { 'q1': 'A', 'q2': 'B' },
          status: 'in_progress',
          started_at: '2024-01-15T10:00:00Z',
          completed_at: null,
          last_activity_at: '2024-01-15T10:30:00Z',
          timezone
        },
        error: null
      })

      const session = await startQuizSession(userId, dailyQuizId, timezone)

      expect(session.id).toBe('existing-session-id')
      expect(session.currentQuestionIndex).toBe(2)
      expect(Object.keys(session.answers)).toHaveLength(2)
    })
  })

  describe('saveQuizAnswer', () => {
    test('saves answer and updates session state', async () => {
      const sessionId = 'session-id'
      const questionId = 'q3'
      const answer = 'C'

      // Mock: get current session
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: {
          id: sessionId,
          user_id: 'user-id',
          daily_quiz_id: 'quiz-id',
          current_question_index: 2,
          answers: { 'q1': 'A', 'q2': 'B' },
          status: 'in_progress',
          started_at: '2024-01-15T10:00:00Z',
          last_activity_at: '2024-01-15T10:30:00Z',
          timezone: 'UTC'
        },
        error: null
      })

      // Mock: update session
      mockSupabaseClient.update.mockResolvedValue({
        data: {
          id: sessionId,
          user_id: 'user-id',
          daily_quiz_id: 'quiz-id',
          current_question_index: 3,
          answers: { 'q1': 'A', 'q2': 'B', 'q3': 'C' },
          status: 'in_progress',
          started_at: '2024-01-15T10:00:00Z',
          last_activity_at: '2024-01-15T10:35:00Z',
          timezone: 'UTC'
        },
        error: null
      })

      const updatedSession = await saveQuizAnswer(sessionId, questionId, answer, true)

      expect(updatedSession.currentQuestionIndex).toBe(3)
      expect(updatedSession.answers[questionId]).toBe(answer)
      expect(Object.keys(updatedSession.answers)).toHaveLength(3)
    })

    test('throws error for non-existent session', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      await expect(saveQuizAnswer('invalid-id', 'q1', 'A'))
        .rejects
        .toThrow('Quiz session not found')
    })
  })

  describe('completeQuizSession', () => {
    test('completes session and calculates results', async () => {
      const sessionId = 'session-id'

      // Mock: get session with quiz data
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: {
          id: sessionId,
          user_id: 'user-id',
          daily_quiz_id: 'quiz-id',
          current_question_index: 5,
          answers: { 'q1': 'A', 'q2': 'B', 'q3': 'C', 'q4': 'D', 'q5': 'A' },
          status: 'in_progress',
          started_at: '2024-01-15T10:00:00Z',
          last_activity_at: '2024-01-15T10:30:00Z',
          timezone: 'UTC',
          daily_quizzes: {
            question_ids: ['q1', 'q2', 'q3', 'q4', 'q5']
          }
        },
        error: null
      })

      // Mock: get questions with correct answers
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [
          { id: 'q1', answer: 'A', difficulty: 'easy' },
          { id: 'q2', answer: 'B', difficulty: 'easy' },
          { id: 'q3', answer: 'C', difficulty: 'medium' },
          { id: 'q4', answer: 'A', difficulty: 'medium' }, // User answered 'D' - incorrect
          { id: 'q5', answer: 'A', difficulty: 'hard' }
        ],
        error: null
      })

      // Mock: insert attempts
      mockSupabaseClient.insert.mockResolvedValue({
        data: {},
        error: null
      })

      // Mock: update session as completed
      mockSupabaseClient.update.mockResolvedValue({
        data: {},
        error: null
      })

      // Mock: streak update (not perfect score)
      mockSupabaseClient.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      })

      const results = await completeQuizSession(sessionId)

      expect(results.sessionId).toBe(sessionId)
      expect(results.totalQuestions).toBe(5)
      expect(results.correctAnswers).toBe(4) // q1, q2, q3, q5 correct; q4 incorrect
      expect(results.score).toBe(80) // 4/5 * 100
      expect(results.answers).toHaveLength(5)
      expect(results.answers.find(a => a.questionId === 'q4')?.isCorrect).toBe(false)
      expect(results.streakUpdated).toBe(false) // Not perfect score
    })

    test('updates streak for perfect score', async () => {
      const sessionId = 'session-id'

      // Mock: get session with perfect answers
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: {
          id: sessionId,
          user_id: 'user-id',
          daily_quiz_id: 'quiz-id',
          current_question_index: 5,
          answers: { 'q1': 'A', 'q2': 'B', 'q3': 'C', 'q4': 'A', 'q5': 'A' },
          status: 'in_progress',
          started_at: '2024-01-15T10:00:00Z',
          last_activity_at: '2024-01-15T10:30:00Z',
          timezone: 'UTC',
          daily_quizzes: {
            question_ids: ['q1', 'q2', 'q3', 'q4', 'q5']
          }
        },
        error: null
      })

      // Mock: get questions with correct answers (all match user answers)
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [
          { id: 'q1', answer: 'A', difficulty: 'easy' },
          { id: 'q2', answer: 'B', difficulty: 'easy' },
          { id: 'q3', answer: 'C', difficulty: 'medium' },
          { id: 'q4', answer: 'A', difficulty: 'medium' },
          { id: 'q5', answer: 'A', difficulty: 'hard' }
        ],
        error: null
      })

      // Mock successful operations
      mockSupabaseClient.insert.mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.update.mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.rpc.mockResolvedValue({ error: null }) // Streak update function

      const results = await completeQuizSession(sessionId)

      expect(results.score).toBe(100)
      expect(results.correctAnswers).toBe(5)
      expect(results.streakUpdated).toBe(true)
    })
  })

  describe('getUserQuizStatus', () => {
    test('returns comprehensive quiz status', async () => {
      const userId = 'test-user-id'
      const timezone = 'UTC'

      // Mock: get today's quiz (from generateDailyQuiz)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'todays-quiz-id',
          date: '2024-01-15',
          question_ids: ['q1', 'q2', 'q3', 'q4', 'q5'],
          created_at: '2024-01-15T04:00:00Z'
        },
        error: null
      })

      // Mock: check for sessions
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [
          {
            id: 'active-session-id',
            user_id: userId,
            daily_quiz_id: 'todays-quiz-id',
            current_question_index: 3,
            answers: { 'q1': 'A', 'q2': 'B', 'q3': 'C' },
            status: 'in_progress',
            started_at: '2024-01-15T15:00:00Z',
            completed_at: null,
            last_activity_at: '2024-01-15T15:30:00Z',
            timezone
          }
        ],
        error: null
      })

      // Mock: get streak info
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          current_streak: 5,
          longest_streak: 12
        },
        error: null
      })

      const status = await getUserQuizStatus(userId, timezone)

      expect(status.hasCompletedToday).toBe(false)
      expect(status.currentSession).toBeDefined()
      expect(status.currentSession?.id).toBe('active-session-id')
      expect(status.currentSession?.currentQuestionIndex).toBe(3)
      expect(status.todaysQuiz.id).toBe('todays-quiz-id')
      expect(status.streakInfo.current).toBe(5)
      expect(status.streakInfo.longest).toBe(12)
    })
  })
})