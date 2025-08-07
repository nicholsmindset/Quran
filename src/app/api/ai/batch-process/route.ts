import { NextRequest, NextResponse } from 'next/server';
import { BatchProcessor } from '../../../../lib/batch-processor';
import { verifyAuth } from '../../../../lib/auth';

/**
 * API endpoint for AI question batch processing
 * POST /api/ai/batch-process - Start batch processing
 * GET /api/ai/batch-process - Get batch processing stats
 */

export async function POST(request: NextRequest) {
  try {
    // Verify authentication - only scholars or system can trigger
    const authResult = await verifyAuth(request);
    if (!authResult.success || !['scholar', 'admin'].includes(authResult.user?.role || '')) {
      return NextResponse.json(
        { error: 'Unauthorized - Scholar access required' },
        { status: 401 }
      );
    }

    console.log('Starting manual batch processing...');
    
    const processor = new BatchProcessor();
    const result = await processor.processBatch();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      stats: result.stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Batch process API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during batch processing',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication - any authenticated user can view stats
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const processor = new BatchProcessor();
    const stats = await processor.getBatchStats(7); // Last 7 days

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Batch stats API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error getting batch stats',
        details: String(error)
      },
      { status: 500 }
    );
  }
}