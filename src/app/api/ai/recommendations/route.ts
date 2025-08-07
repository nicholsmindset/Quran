import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/ai-enhancement-service';
import { verifyAuth } from '@/lib/auth';

/**
 * POST /api/ai/recommendations
 * Generate personalized learning recommendations based on user performance
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // Generate personalized recommendations using AI Enhancement Service
    const aiService = new AIEnhancementService();
    const recommendations = await aiService.generatePersonalizedRecommendations(userId);

    if (recommendations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          recommendations: [],
          message: 'Complete more quizzes to receive personalized recommendations'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI recommendations API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/recommendations
 * Get existing personalized recommendations for the user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // Get existing recommendations that haven't expired
    const aiService = new AIEnhancementService();
    // We'll need to add a method to get existing recommendations
    // For now, let's generate fresh recommendations

    const recommendations = await aiService.generatePersonalizedRecommendations(userId);

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        retrievedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get recommendations API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: String(error)
      },
      { status: 500 }
    );
  }
}