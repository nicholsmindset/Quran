import { NextRequest, NextResponse } from 'next/server';
import { BatchProcessor } from '../../../../lib/batch-processor';

/**
 * Cron job endpoint for automated question generation
 * This endpoint should be called every 4 hours by a cron service
 * 
 * Security: Only accept requests with valid cron secret
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const secretQuery = url.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('CRON_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Cron service not configured' },
        { status: 500 }
      );
    }

    const isAuthorized =
      (authHeader && authHeader === `Bearer ${expectedSecret}`) ||
      (secretQuery && secretQuery === expectedSecret);

    if (!isAuthorized) {
      console.error('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting automated batch processing...');
    const processor = new BatchProcessor();
    const result = await processor.processBatch();

    // Log result for monitoring
    console.log('Batch processing completed:', {
      success: result.success,
      stats: result.stats,
      message: result.message,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      stats: result.stats,
      timestamp: new Date().toISOString(),
      source: 'cron',
    });

  } catch (error) {
    console.error('Cron job error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        details: String(error),
        timestamp: new Date().toISOString(),
        source: 'cron',
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}