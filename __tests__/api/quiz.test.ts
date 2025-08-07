import { describe, test, expect, beforeEach, afterEach } from '@jest/test-runner'
import { testApiHandler } from 'next-test-api-route-handler'
import * as dailyQuizHandler from '@/app/api/quiz/daily/route'
import * as startSessionHandler from '@/app/api/quiz/session/start/route'
import * as sessionHandler from '@/app/api/quiz/session/[id]/route'
import * as completeSessionHandler from '@/app/api/quiz/session/[id]/complete/route'
import { createServerSupabaseClient } from '@/lib/supabase'

// Mock the quiz engine
jest.mock('@/lib/quiz-engine', () => ({
  getCurrentDailyQuiz: jest.fn(),
  getUserQuizStatus: jest.fn(),
  startQuizSession: jest.fn(),
  getQuizSession: jest.fn(),
  saveQuizAnswer: jest.fn(),
  completeQuizSession: jest.fn(),
  hasCompletedDailyQuiz: jest.fn()
}))

// Mock auth utilities
jest.mock('@/lib/auth', () => ({
  verifyAuthToken: jest.fn(),
  extractBearerToken: jest.fn(),
  createErrorResponse: (error: string, status: number = 400) => 
    Response.json({ success: false, error }, { status }),
  createSuccessResponse: (data: any, message?: string) => 
    Response.json({ success: true, data, ...(message && { message }) })
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: jest.fn()
}))

describe('Quiz API Endpoints', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'learner' as const,
    createdAt: new Date()
  }

  const mockAuthToken = 'Bearer test-token'
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup default auth success
    const { verifyAuthToken, extractBearerToken } = require('@/lib/auth')
    extractBearerToken.mockReturnValue('test-token')
    verifyAuthToken.mockResolvedValue({ success: true, user: mockUser })
    
    // Mock Supabase client
    const mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    }
    
    ;(createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/quiz/daily', () => {
    test('returns daily quiz with user status', async () => {
      const { getUserQuizStatus } = require('@/lib/quiz-engine')
      
      const mockQuizStatus = {
        hasCompletedToday: false,
        currentSession: null,
        todaysQuiz: {
          id: 'quiz-id',
          date: '2024-01-15',
          questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
          createdAt: new Date()
        },
        streakInfo: { current: 5, longest: 10 }
      }

      getUserQuizStatus.mockResolvedValue(mockQuizStatus)

      // Mock questions data
      const mockSupabaseClient = createServerSupabaseClient()
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null })
      mockSupabaseClient.select.mockResolvedValue({
        data: [
          {
            id: 'q1',
            verse_id: 'v1',
            prompt: 'Test question 1',
            choices: ['A', 'B', 'C', 'D'],
            difficulty: 'easy',
            verses: { id: 'v1', surah: 1, ayah: 1, arabic_text: 'Arabic', translation_en: 'English' }
          }
        ],
        error: null
      })

      await testApiHandler({
        appHandler: dailyQuizHandler,
        url: '/api/quiz/daily?timezone=UTC',
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: { authorization: mockAuthToken }
          })

          expect(response.status).toBe(200)
          const data = await response.json()
          expect(data.success).toBe(true)
          expect(data.data.quiz).toBeDefined()
          expect(data.data.status).toBeDefined()
          expect(data.data.status.hasCompletedToday).toBe(false)
          expect(data.data.status.streakInfo).toEqual({ current: 5, longest: 10 })
        }
      })
    })

    test('returns 401 without authentication', async () => {
      const { verifyAuthToken } = require('@/lib/auth')
      verifyAuthToken.mockResolvedValue({ success: false, error: 'No token' })

      await testApiHandler({
        appHandler: dailyQuizHandler,
        url: '/api/quiz/daily',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' })
          expect(response.status).toBe(401)
        }
      })
    })
  })

  describe('POST /api/quiz/session/start', () => {
    test('starts new quiz session successfully', async () => {
      const { startQuizSession, hasCompletedDailyQuiz, getCurrentDailyQuiz } = require('@/lib/quiz-engine')
      
      hasCompletedDailyQuiz.mockResolvedValue(false)
      getCurrentDailyQuiz.mockResolvedValue({
        id: 'daily-quiz-id',
        date: '2024-01-15',
        questionIds: ['q1', 'q2', 'q3', 'q4', 'q5']
      })
      
      startQuizSession.mockResolvedValue({
        id: 'session-id',
        userId: mockUser.id,
        dailyQuizId: 'daily-quiz-id',
        currentQuestionIndex: 0,
        answers: {},
        status: 'in_progress',
        startedAt: new Date(),
        lastActivityAt: new Date(),
        timezone: 'UTC'
      })

      // Mock questions fetch
      const mockSupabaseClient = createServerSupabaseClient()
      mockSupabaseClient.select.mockResolvedValue({
        data: [
          {
            id: 'q1',
            verse_id: 'v1',
            prompt: 'Test question 1',
            choices: ['A', 'B', 'C', 'D'],
            difficulty: 'easy',
            verses: { id: 'v1', surah: 1, ayah: 1, arabic_text: 'Arabic', translation_en: 'English' }
          }
        ],
        error: null
      })

      await testApiHandler({
        appHandler: startSessionHandler,
        url: '/api/quiz/session/start',
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 
              authorization: mockAuthToken,
              'content-type': 'application/json'
            },
            body: JSON.stringify({ timezone: 'UTC' })
          })

          expect(response.status).toBe(200)
          const data = await response.json()
          expect(data.success).toBe(true)
          expect(data.data.session.id).toBe('session-id')
          expect(data.data.quiz.questions).toBeDefined()
        }
      })
    })

    test('returns 409 if quiz already completed', async () => {
      const { hasCompletedDailyQuiz } = require('@/lib/quiz-engine')
      hasCompletedDailyQuiz.mockResolvedValue(true)

      await testApiHandler({
        appHandler: startSessionHandler,
        url: '/api/quiz/session/start',
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 
              authorization: mockAuthToken,
              'content-type': 'application/json'
            },
            body: JSON.stringify({ timezone: 'UTC' })
          })

          expect(response.status).toBe(409)
          const data = await response.json()
          expect(data.success).toBe(false)
          expect(data.error).toContain('already completed')
        }
      })
    })
  })

  describe('GET /api/quiz/session/[id]', () => {
    test('returns session state with questions', async () => {
      const { getQuizSession } = require('@/lib/quiz-engine')
      
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        dailyQuizId: 'daily-quiz-id',
        currentQuestionIndex: 2,
        answers: { 'q1': 'A', 'q2': 'B' },
        status: 'in_progress',
        startedAt: new Date('2024-01-15T10:00:00Z'),
        lastActivityAt: new Date('2024-01-15T10:15:00Z'),
        timezone: 'UTC'
      }

      getQuizSession.mockResolvedValue(mockSession)

      // Mock database calls
      const mockSupabaseClient = createServerSupabaseClient()
      mockSupabaseClient.single.mockResolvedValue({
        data: { question_ids: ['q1', 'q2', 'q3', 'q4', 'q5'] },
        error: null
      })
      mockSupabaseClient.select.mockResolvedValue({
        data: [
          {
            id: 'q1',
            verse_id: 'v1',
            prompt: 'Test question 1',
            choices: ['A', 'B', 'C', 'D'],
            difficulty: 'easy',
            verses: { id: 'v1', surah: 1, ayah: 1, arabic_text: 'Arabic', translation_en: 'English' }
          }
        ],
        error: null
      })

      await testApiHandler({
        appHandler: sessionHandler,
        url: '/api/quiz/session/session-id',
        params: { id: 'session-id' },
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: { authorization: mockAuthToken }
          })

          expect(response.status).toBe(200)
          const data = await response.json()
          expect(data.success).toBe(true)
          expect(data.data.session.id).toBe('session-id')
          expect(data.data.session.currentQuestionIndex).toBe(2)
          expect(data.data.progress.current).toBe(2) // 2 questions answered
          expect(data.data.progress.total).toBe(1) // Based on mock questions length
        }
      })
    })

    test('returns 403 for unauthorized access', async () => {
      const { getQuizSession } = require('@/lib/quiz-engine')
      
      getQuizSession.mockResolvedValue({
        id: 'session-id',
        userId: 'other-user-id', // Different user
        dailyQuizId: 'daily-quiz-id',
        currentQuestionIndex: 0,
        answers: {},
        status: 'in_progress',
        startedAt: new Date(),
        lastActivityAt: new Date(),
        timezone: 'UTC'
      })

      await testApiHandler({
        appHandler: sessionHandler,
        url: '/api/quiz/session/session-id',
        params: { id: 'session-id' },
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: { authorization: mockAuthToken }
          })

          expect(response.status).toBe(403)
        }
      })
    })
  })

  describe('PUT /api/quiz/session/[id]/answer', () => {
    test('saves answer and updates session', async () => {
      const { getQuizSession, saveQuizAnswer } = require('@/lib/quiz-engine')
      
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        dailyQuizId: 'daily-quiz-id',
        currentQuestionIndex: 1,
        answers: { 'q1': 'A' },
        status: 'in_progress',
        startedAt: new Date('2024-01-15T10:00:00Z'),
        lastActivityAt: new Date(),
        timezone: 'UTC'
      }

      getQuizSession.mockResolvedValue(mockSession)
      saveQuizAnswer.mockResolvedValue({
        ...mockSession,
        currentQuestionIndex: 2,
        answers: { 'q1': 'A', 'q2': 'B' },
        lastActivityAt: new Date()
      })

      // Mock quiz data fetch
      const mockSupabaseClient = createServerSupabaseClient()
      mockSupabaseClient.single.mockResolvedValue({
        data: { question_ids: ['q1', 'q2', 'q3', 'q4', 'q5'] },
        error: null
      })

      await testApiHandler({
        appHandler: sessionHandler,
        url: '/api/quiz/session/session-id/answer',
        params: { id: 'session-id' },
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'PUT',
            headers: { 
              authorization: mockAuthToken,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              question_id: 'q2',
              answer: 'B',
              move_to_next: true,
              time_spent: 15000
            })
          })

          expect(response.status).toBe(200)
          const data = await response.json()
          expect(data.success).toBe(true)
          expect(data.data.session.currentQuestionIndex).toBe(2)
          expect(data.data.progress.current).toBe(2) // 2 answers saved
          expect(data.data.metadata.answerSaved).toBe(true)
        }
      })
    })
  })

  describe('POST /api/quiz/session/[id]/complete', () => {
    test('completes session and returns results', async () => {
      const { getQuizSession, completeQuizSession } = require('@/lib/quiz-engine')
      
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        dailyQuizId: 'daily-quiz-id',
        currentQuestionIndex: 5,
        answers: { 'q1': 'A', 'q2': 'B', 'q3': 'C', 'q4': 'D', 'q5': 'A' },
        status: 'in_progress',
        startedAt: new Date('2024-01-15T10:00:00Z'),
        lastActivityAt: new Date(),
        timezone: 'UTC'
      }

      const mockResults = {
        sessionId: 'session-id',
        score: 80,
        totalQuestions: 5,
        correctAnswers: 4,
        timeSpent: 300000, // 5 minutes
        answers: [
          { questionId: 'q1', selectedAnswer: 'A', isCorrect: true, timeSpent: 60000 },
          { questionId: 'q2', selectedAnswer: 'B', isCorrect: true, timeSpent: 45000 },
          { questionId: 'q3', selectedAnswer: 'C', isCorrect: false, timeSpent: 75000 },
          { questionId: 'q4', selectedAnswer: 'D', isCorrect: true, timeSpent: 50000 },
          { questionId: 'q5', selectedAnswer: 'A', isCorrect: true, timeSpent: 70000 }
        ],
        streakUpdated: false
      }

      getQuizSession.mockResolvedValue(mockSession)
      completeQuizSession.mockResolvedValue(mockResults)

      // Mock database calls for completion
      const mockSupabaseClient = createServerSupabaseClient()
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { question_ids: ['q1', 'q2', 'q3', 'q4', 'q5'] },
        error: null
      }).mockResolvedValueOnce({
        data: { current_streak: 0, longest_streak: 10 },
        error: null
      })

      mockSupabaseClient.select.mockResolvedValue({
        data: [
          { id: 'q1', difficulty: 'easy' },
          { id: 'q2', difficulty: 'easy' },
          { id: 'q3', difficulty: 'medium' },
          { id: 'q4', difficulty: 'medium' },
          { id: 'q5', difficulty: 'hard' }
        ],
        error: null
      })

      await testApiHandler({
        appHandler: completeSessionHandler,
        url: '/api/quiz/session/session-id/complete',
        params: { id: 'session-id' },
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 
              authorization: mockAuthToken,
              'content-type': 'application/json'
            },
            body: JSON.stringify({ force_complete: false })
          })

          expect(response.status).toBe(200)
          const data = await response.json()
          expect(data.success).toBe(true)
          expect(data.data.results.score).toBe(80)
          expect(data.data.results.correctAnswers).toBe(4)
          expect(data.data.results.accuracy).toBe(80)
          expect(data.data.results.performanceLevel).toBe('good')
          expect(data.data.streakInfo.current).toBe(0)
          expect(data.data.breakdown.answers).toHaveLength(5)
        }
      })
    })

    test('returns 422 for incomplete quiz without force flag', async () => {
      const { getQuizSession } = require('@/lib/quiz-engine')
      
      const mockSession = {
        id: 'session-id',
        userId: mockUser.id,
        dailyQuizId: 'daily-quiz-id',
        currentQuestionIndex: 3,
        answers: { 'q1': 'A', 'q2': 'B' }, // Only 2 out of 5 answered
        status: 'in_progress',
        startedAt: new Date('2024-01-15T10:00:00Z'),
        lastActivityAt: new Date(),
        timezone: 'UTC'
      }

      getQuizSession.mockResolvedValue(mockSession)

      const mockSupabaseClient = createServerSupabaseClient()
      mockSupabaseClient.single.mockResolvedValue({
        data: { question_ids: ['q1', 'q2', 'q3', 'q4', 'q5'] },
        error: null
      })

      await testApiHandler({
        appHandler: completeSessionHandler,
        url: '/api/quiz/session/session-id/complete',
        params: { id: 'session-id' },
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 
              authorization: mockAuthToken,
              'content-type': 'application/json'
            },
            body: JSON.stringify({ force_complete: false })
          })

          expect(response.status).toBe(422)
          const data = await response.json()
          expect(data.success).toBe(false)
          expect(data.error).toContain('incomplete')
        }
      })
    })
  })
})