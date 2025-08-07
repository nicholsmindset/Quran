import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Get filtered questions for scholar review
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication required', 401);
    }

    if (!hasRole(authResult.user, 'scholar')) {
      return createErrorResponse('Scholar role required', 403);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filter parameters
    const status = searchParams.get('status') || 'pending';
    const difficulty = searchParams.get('difficulty');
    const priority = searchParams.get('priority');
    const surah = searchParams.get('surah');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('questions')
      .select(`
        id,
        prompt,
        choices,
        answer,
        difficulty,
        priority,
        status,
        category_tags,
        arabic_accuracy,
        created_at,
        created_by,
        moderated_by,
        moderation_notes,
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
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status !== 'all') {
      if (status === 'pending') {
        query = query.in('status', ['pending', 'flagged']);
      } else {
        query = query.eq('status', status);
      }
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (surah) {
      query = query.eq('verses.surah', parseInt(surah));
    }

    if (search) {
      query = query.textSearch('prompt', search);
    }

    const { data: questions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Questions query error:', questionsError);
      return createErrorResponse('Failed to fetch questions', 500);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    // Apply same filters to count query
    if (status !== 'all') {
      if (status === 'pending') {
        countQuery = countQuery.in('status', ['pending', 'flagged']);
      } else {
        countQuery = countQuery.eq('status', status);
      }
    }

    if (difficulty && difficulty !== 'all') {
      countQuery = countQuery.eq('difficulty', difficulty);
    }

    if (priority && priority !== 'all') {
      countQuery = countQuery.eq('priority', priority);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count query error:', countError);
      return createErrorResponse('Failed to get question count', 500);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return createSuccessResponse({
      questions: questions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });

  } catch (error) {
    console.error('Scholar questions API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}