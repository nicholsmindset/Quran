import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth, hasRole, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Get scholar statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return createErrorResponse(authResult.error || 'Authentication required', 401);
    }

    if (!hasRole(authResult.user, 'scholar')) {
      return createErrorResponse('Scholar role required', 403);
    }

    // Verify scholar can access their own stats or is admin
    if (authResult.user.id !== id && authResult.user.role !== 'admin') {
      return createErrorResponse('Access denied', 403);
    }

    // Get date range for current period (today)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get moderation actions for today
    const { data: todayActions, error: todayError } = await supabase
      .from('moderation_actions')
      .select('action, created_at')
      .eq('scholar_id', id)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    if (todayError) {
      console.error('Today actions query error:', todayError);
      return createErrorResponse('Failed to fetch daily statistics', 500);
    }

    // Calculate today's stats
    const approved = todayActions?.filter(a => a.action === 'approve').length || 0;
    const rejected = todayActions?.filter(a => a.action === 'reject').length || 0;
    const edited = todayActions?.filter(a => a.action === 'edit').length || 0;
    const flagged = todayActions?.filter(a => a.action === 'flag').length || 0;

    // Get last 7 days for SLA calculation
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weekActions, error: weekError } = await supabase
      .from('moderation_actions')
      .select(`
        action,
        created_at,
        questions!inner (
          created_at
        )
      `)
      .eq('scholar_id', id)
      .gte('created_at', weekAgo.toISOString())
      .in('action', ['approve', 'reject', 'edit']);

    if (weekError) {
      console.error('Week actions query error:', weekError);
      return createErrorResponse('Failed to fetch weekly statistics', 500);
    }

    // Calculate SLA compliance (processed within 24 hours)
    let onTimeActions = 0;
    let totalActions = 0;
    let totalProcessingTime = 0;

    weekActions?.forEach(action => {
      const questionCreated = new Date(action.questions.created_at);
      const actionTaken = new Date(action.created_at);
      const processingTime = actionTaken.getTime() - questionCreated.getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      totalActions++;
      totalProcessingTime += processingTime;

      if (processingTime <= twentyFourHours) {
        onTimeActions++;
      }
    });

    const currentSLA = totalActions > 0 ? Math.round((onTimeActions / totalActions) * 100) : 100;
    const avgProcessingTime = totalActions > 0 ? totalProcessingTime / totalActions : 0;

    // Get pending questions assigned to this scholar
    const { data: pendingQuestions, error: pendingError } = await supabase
      .from('questions')
      .select('id, created_at, priority')
      .in('status', ['pending', 'flagged'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (pendingError) {
      console.error('Pending questions query error:', pendingError);
      return createErrorResponse('Failed to fetch pending questions', 500);
    }

    // Calculate queue metrics
    const queueSize = pendingQuestions?.length || 0;
    const urgentQuestions = pendingQuestions?.filter(q => {
      const created = new Date(q.created_at);
      const elapsed = Date.now() - created.getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return elapsed > (twentyFourHours * 0.75); // 75% of 24 hours
    }).length || 0;

    const stats = {
      id,
      scholarId: id,
      totalReviewed: approved + rejected + edited,
      approved,
      rejected,
      edited,
      flagged,
      avgProcessingTime: Math.round(avgProcessingTime / (1000 * 60 * 60)), // Convert to hours
      currentSLA,
      queueSize,
      urgentQuestions,
      period: 'daily' as const,
      lastUpdated: new Date().toISOString()
    };

    return createSuccessResponse(stats);

  } catch (error) {
    console.error('Scholar stats API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}