import { 
  verifyAuthToken, 
  hasRole, 
  extractBearerToken, 
  createErrorResponse, 
  createSuccessResponse,
  verifyAuth 
} from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { User } from '@/types'

// Mock the supabase client
jest.mock('@/lib/supabase')

const mockSupabase = {
  auth: {
    setSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.MockedFunction<typeof createServerSupabaseClient>

describe('Authentication Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateServerSupabaseClient.mockReturnValue(mockSupabase as any)
  })

  describe('verifyAuthToken', () => {
    it('should return error when no token provided', async () => {
      const result = await verifyAuthToken(null)
      
      expect(result).toEqual({
        success: false,
        error: 'No authentication token provided'
      })
    })

    it('should return error when token is empty string', async () => {
      const result = await verifyAuthToken('')
      
      expect(result).toEqual({
        success: false,
        error: 'No authentication token provided'
      })
    })

    it('should return error when session creation fails', async () => {
      mockSupabase.auth.setSession.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const result = await verifyAuthToken('invalid-token')
      
      expect(result).toEqual({
        success: false,
        error: 'Invalid authentication token'
      })
      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'invalid-token',
        refresh_token: '',
      })
    })

    it('should return error when user data fetch fails', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' }
      
      mockSupabase.auth.setSession.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })
      
      const mockFromChain = mockSupabase.from()
      mockFromChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' }
      })

      const result = await verifyAuthToken('valid-token')
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to fetch user profile'
      })
    })

    it('should return user data when authentication succeeds', async () => {
      const mockSessionUser = { id: 'user-id', email: 'test@example.com' }
      const mockUserData = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'learner',
        created_at: '2024-01-01T00:00:00Z'
      }
      
      mockSupabase.auth.setSession.mockResolvedValueOnce({
        data: { user: mockSessionUser },
        error: null
      })
      
      const mockFromChain = mockSupabase.from()
      mockFromChain.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null
      })

      const result = await verifyAuthToken('valid-token')
      
      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: 'learner',
        createdAt: new Date('2024-01-01T00:00:00Z')
      })
      expect(result.error).toBeUndefined()
    })

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.auth.setSession.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const result = await verifyAuthToken('token')
      
      expect(result).toEqual({
        success: false,
        error: 'Authentication verification failed'
      })
      expect(consoleSpy).toHaveBeenCalledWith('Auth verification error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('hasRole', () => {
    const learner: User = { id: '1', email: 'learner@example.com', role: 'learner', createdAt: new Date() }
    const teacher: User = { id: '2', email: 'teacher@example.com', role: 'teacher', createdAt: new Date() }
    const scholar: User = { id: '3', email: 'scholar@example.com', role: 'scholar', createdAt: new Date() }

    it('should return true when user has exact required role', () => {
      expect(hasRole(learner, 'learner')).toBe(true)
      expect(hasRole(teacher, 'teacher')).toBe(true)
      expect(hasRole(scholar, 'scholar')).toBe(true)
    })

    it('should return true when user has higher role than required', () => {
      expect(hasRole(teacher, 'learner')).toBe(true)
      expect(hasRole(scholar, 'learner')).toBe(true)
      expect(hasRole(scholar, 'teacher')).toBe(true)
    })

    it('should return false when user has lower role than required', () => {
      expect(hasRole(learner, 'teacher')).toBe(false)
      expect(hasRole(learner, 'scholar')).toBe(false)
      expect(hasRole(teacher, 'scholar')).toBe(false)
    })
  })

  describe('extractBearerToken', () => {
    it('should return null for null header', () => {
      expect(extractBearerToken(null)).toBeNull()
    })

    it('should return null for header without Bearer prefix', () => {
      expect(extractBearerToken('Token abc123')).toBeNull()
      expect(extractBearerToken('abc123')).toBeNull()
      expect(extractBearerToken('')).toBeNull()
    })

    it('should extract token from valid Bearer header', () => {
      expect(extractBearerToken('Bearer abc123')).toBe('abc123')
      expect(extractBearerToken('Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9')).toBe('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9')
    })

    it('should handle Bearer header with extra spaces', () => {
      expect(extractBearerToken('Bearer  abc123')).toBe(' abc123')
    })
  })

  describe('createErrorResponse', () => {
    it('should create error response with default status 400', () => {
      const response = createErrorResponse('Test error')
      
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(400)
    })

    it('should create error response with custom status', () => {
      const response = createErrorResponse('Unauthorized', 401)
      
      expect(response.status).toBe(401)
    })

    it('should contain error in JSON body', async () => {
      const response = createErrorResponse('Test error')
      const body = await response.json()
      
      expect(body).toEqual({
        success: false,
        error: 'Test error'
      })
    })
  })

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data)
      
      expect(response).toBeInstanceOf(Response)
      expect(response.status).toBe(200)
    })

    it('should contain success and data in JSON body', async () => {
      const data = { id: 1, name: 'Test' }
      const response = createSuccessResponse(data)
      const body = await response.json()
      
      expect(body).toEqual({
        success: true,
        data
      })
    })

    it('should include message when provided', async () => {
      const data = { id: 1 }
      const message = 'Operation completed'
      const response = createSuccessResponse(data, message)
      const body = await response.json()
      
      expect(body).toEqual({
        success: true,
        data,
        message
      })
    })
  })

  describe('verifyAuth', () => {
    it('should extract token from request and verify it', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as unknown as Request

      // Mock successful token verification
      const mockSessionUser = { id: 'user-id', email: 'test@example.com' }
      const mockUserData = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'learner',
        created_at: '2024-01-01T00:00:00Z'
      }
      
      mockSupabase.auth.setSession.mockResolvedValueOnce({
        data: { user: mockSessionUser },
        error: null
      })
      
      const mockFromChain = mockSupabase.from()
      mockFromChain.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null
      })

      const result = await verifyAuth(mockRequest)
      
      expect(mockRequest.headers.get).toHaveBeenCalledWith('authorization')
      expect(result.success).toBe(true)
      expect(result.user?.id).toBe('user-id')
    })

    it('should handle missing authorization header', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as Request

      const result = await verifyAuth(mockRequest)
      
      expect(result).toEqual({
        success: false,
        error: 'No authentication token provided'
      })
    })

    it('should handle invalid authorization header format', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Invalid header')
        }
      } as unknown as Request

      const result = await verifyAuth(mockRequest)
      
      expect(result).toEqual({
        success: false,
        error: 'No authentication token provided'
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete authentication flow', async () => {
      const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'
      const authHeader = `Bearer ${token}`
      
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(authHeader)
        }
      } as unknown as Request

      const mockSessionUser = { id: 'scholar-id', email: 'scholar@example.com' }
      const mockUserData = {
        id: 'scholar-id',
        email: 'scholar@example.com',
        role: 'scholar',
        created_at: '2024-01-01T00:00:00Z'
      }
      
      mockSupabase.auth.setSession.mockResolvedValueOnce({
        data: { user: mockSessionUser },
        error: null
      })
      
      const mockFromChain = mockSupabase.from()
      mockFromChain.single.mockResolvedValueOnce({
        data: mockUserData,
        error: null
      })

      // Verify authentication
      const authResult = await verifyAuth(mockRequest)
      expect(authResult.success).toBe(true)
      expect(authResult.user).toBeDefined()
      
      // Check role permissions
      if (authResult.user) {
        expect(hasRole(authResult.user, 'learner')).toBe(true)
        expect(hasRole(authResult.user, 'teacher')).toBe(true)
        expect(hasRole(authResult.user, 'scholar')).toBe(true)
      }
    })
  })
})