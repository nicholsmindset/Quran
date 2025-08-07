import { createServerSupabaseClient } from './supabase'
import { User } from '@/types'

// Authentication utilities for API routes
export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

// Verify authentication token and get user data
export async function verifyAuthToken(token: string | null): Promise<AuthResult> {
  if (!token) {
    return { success: false, error: 'No authentication token provided' }
  }

  try {
    const supabase = createServerSupabaseClient()
    
    // Set the session using the token
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    })
    
    if (sessionError || !sessionData.user) {
      return { success: false, error: 'Invalid authentication token' }
    }
    
    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user.id)
      .single()
    
    if (userError) {
      return { success: false, error: 'Failed to fetch user profile' }
    }
    
    return {
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        createdAt: new Date(userData.created_at),
      }
    }
    
  } catch (error) {
    console.error('Auth verification error:', error)
    return { success: false, error: 'Authentication verification failed' }
  }
}

// Check if user has required role
export function hasRole(user: User, requiredRole: 'learner' | 'teacher' | 'scholar'): boolean {
  const roleHierarchy = {
    'learner': 0,
    'teacher': 1,
    'scholar': 2,
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

// Extract bearer token from Authorization header
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.replace('Bearer ', '')
}

// Create standardized API error responses
export function createErrorResponse(error: string, status: number = 400) {
  return Response.json(
    { success: false, error },
    { status }
  )
}

// Create standardized API success responses
export function createSuccessResponse<T>(data: T, message?: string) {
  return Response.json({
    success: true,
    data,
    ...(message && { message }),
  })
}

// Verify authentication from Next.js request object
export async function verifyAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')
  const token = extractBearerToken(authHeader)
  return verifyAuthToken(token)
}