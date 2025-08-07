import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// T004: Implement login/logout flow - Logout endpoint
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      )
    }
    
    // Set the session using the token
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // We'll handle refresh separately if needed
    })
    
    if (sessionError) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      return NextResponse.json(
        { success: false, error: signOutError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Logout successful',
      },
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Alternative logout method that doesn't require token
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Global sign out (invalidates all sessions for this user)
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Global logout successful',
      },
    })
    
  } catch (error) {
    console.error('Global logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}