import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// T013: Create approval workflow API endpoints - Get pending questions
export async function GET(request: NextRequest) {
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
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    })
    
    if (sessionError || !sessionData.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      )
    }
    
    // Check if user is a scholar
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', sessionData.user.id)
      .single()
    
    if (userError || userData?.role !== 'scholar') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Scholar role required.' },
        { status: 403 }
      )
    }
    
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
    // Fetch pending questions with verse details
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        prompt,
        choices,
        answer,
        difficulty,
        created_at,
        created_by,
        verse_id,
        verses (
          id,
          surah,
          ayah,
          arabic_text,
          translation_en
        ),
        users!questions_created_by_fkey (
          id,
          email,
          role
        )
      `)
      .is('approved_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (questionsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending questions' },
        { status: 500 }
      )
    }
    
    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .is('approved_at', null)
    
    if (countError) {
      return NextResponse.json(
        { success: false, error: 'Failed to get question count' },
        { status: 500 }
      )
    }
    
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    })
    
  } catch (error) {
    console.error('Get pending questions error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}