import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/ai-enhancement-service';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

/**
 * POST /api/ai/quiz/adaptive
 * Generate adaptive quiz questions based on user performance and learning patterns
 */

const adaptiveQuizSchema = z.object({
  questionCount: z.number().min(1).max(20).default(5),
  focusTopics: z.array(z.string()).optional(),
  excludeRecent: z.boolean().default(true),
  includeReview: z.boolean().default(true), // Include spaced repetition questions
  maxDifficulty: z.enum(['easy', 'medium', 'hard']).optional()
});

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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = adaptiveQuizSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { 
      questionCount, 
      focusTopics, 
      excludeRecent, 
      includeReview, 
      maxDifficulty 
    } = validationResult.data;

    const userId = authResult.user.id;
    const supabase = createServerSupabaseClient();
    const aiService = new AIEnhancementService();

    // Get user performance pattern
    const performancePattern = await aiService.analyzeUserPerformance(userId);
    
    // Get spaced repetition questions if requested
    let reviewQuestions: any[] = [];
    if (includeReview) {
      const spacedRepetition = await aiService.getSpacedRepetitionSchedule(userId);
      if (spacedRepetition.length > 0) {
        const reviewQuestionIds = spacedRepetition.slice(0, Math.floor(questionCount / 2)).map(sr => sr.questionId);
        
        const { data: reviewQuestionsData } = await supabase
          .from('questions')
          .select(`
            id,
            prompt,
            choices,
            answer,
            difficulty,
            category_tags,
            verses (
              id,
              surah,
              ayah,
              arabic_text,
              translation_en
            )
          `)
          .in('id', reviewQuestionIds)
          .eq('status', 'approved');
          
        reviewQuestions = reviewQuestionsData || [];
      }
    }

    // Calculate adaptive difficulty based on performance
    const adaptiveDifficulty = calculateAdaptiveDifficulty(performancePattern, maxDifficulty);
    
    // Calculate topic priorities based on weaknesses and focus topics
    const topicPriorities = calculateTopicPriorities(performancePattern, focusTopics);

    // Get recently answered questions to exclude
    let recentQuestionIds: string[] = [];
    if (excludeRecent) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentAttempts } = await supabase
        .from('quiz_attempts')
        .select('question_id')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());
        
      recentQuestionIds = recentAttempts?.map(a => a.question_id) || [];
    }

    // Build dynamic query for new questions
    let query = supabase
      .from('questions')
      .select(`
        id,
        prompt,
        choices,
        answer,
        difficulty,
        category_tags,
        verses (
          id,
          surah,
          ayah,
          arabic_text,
          translation_en
        )
      `)
      .eq('status', 'approved');

    // Apply difficulty filter
    if (adaptiveDifficulty.length > 0) {
      query = query.in('difficulty', adaptiveDifficulty);
    }

    // Exclude recent questions
    if (recentQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${recentQuestionIds.join(',')})`);
    }

    // Exclude review questions
    const reviewQuestionIds = reviewQuestions.map(q => q.id);
    if (reviewQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${reviewQuestionIds.join(',')})`);
    }

    const { data: availableQuestions, error } = await query.limit(questionCount * 3); // Get more to allow selection

    if (error) {
      throw error;
    }

    // Apply intelligent question selection based on topic priorities
    const selectedNewQuestions = selectQuestionsByPriority(
      availableQuestions || [],
      topicPriorities,
      questionCount - reviewQuestions.length
    );

    // Combine review and new questions
    const finalQuestions = [...reviewQuestions, ...selectedNewQuestions];

    // Shuffle questions for varied experience
    const shuffledQuestions = shuffleArray(finalQuestions);

    // Log adaptive quiz generation for analytics
    await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        interaction_type: 'adaptive_quiz_generated',
        metadata: {
          question_count: shuffledQuestions.length,
          review_questions: reviewQuestions.length,
          new_questions: selectedNewQuestions.length,
          adaptive_difficulty: adaptiveDifficulty,
          focus_topics: focusTopics,
          topic_priorities: topicPriorities
        }
      });

    return NextResponse.json({
      success: true,
      data: {
        questions: shuffledQuestions,
        metadata: {
          totalQuestions: shuffledQuestions.length,
          reviewQuestions: reviewQuestions.length,
          newQuestions: selectedNewQuestions.length,
          adaptiveDifficulty: adaptiveDifficulty,
          topicPriorities: topicPriorities,
          userPerformance: performancePattern ? {
            accuracyRate: performancePattern.retentionRate,
            learningVelocity: performancePattern.learningVelocity,
            consistencyScore: performancePattern.consistencyScore
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Adaptive quiz API error:', error);
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

// Helper functions

function calculateAdaptiveDifficulty(
  performancePattern: any,
  maxDifficulty?: string
): string[] {
  if (!performancePattern) {
    return ['easy', 'medium']; // Default for new users
  }

  const { retentionRate, difficultyProgression } = performancePattern;
  const difficulties: string[] = [];

  // Base difficulty selection on overall performance
  if (retentionRate >= 0.8) {
    difficulties.push('medium', 'hard');
    if (!maxDifficulty || maxDifficulty === 'hard') {
      difficulties.push('hard');
    }
  } else if (retentionRate >= 0.6) {
    difficulties.push('easy', 'medium');
    if (!maxDifficulty || ['medium', 'hard'].includes(maxDifficulty)) {
      difficulties.push('medium');
    }
  } else {
    difficulties.push('easy');
    if (retentionRate >= 0.4) {
      difficulties.push('medium');
    }
  }

  // Adjust based on recent difficulty performance
  const easyRate = difficultyProgression.easy / (difficultyProgression.easy + 1);
  const mediumRate = difficultyProgression.medium / (difficultyProgression.medium + 1);
  const hardRate = difficultyProgression.hard / (difficultyProgression.hard + 1);

  if (easyRate > 0.9 && !difficulties.includes('medium')) {
    difficulties.push('medium');
  }
  if (mediumRate > 0.8 && !difficulties.includes('hard') && (!maxDifficulty || maxDifficulty === 'hard')) {
    difficulties.push('hard');
  }

  return [...new Set(difficulties)]; // Remove duplicates
}

function calculateTopicPriorities(
  performancePattern: any,
  focusTopics?: string[]
): Record<string, number> {
  const priorities: Record<string, number> = {};

  // If focus topics specified, prioritize them
  if (focusTopics && focusTopics.length > 0) {
    focusTopics.forEach(topic => {
      priorities[topic] = 1.0; // High priority
    });
  }

  if (performancePattern) {
    // Prioritize weak topics for improvement
    Object.entries(performancePattern.topicWeaknesses || {}).forEach(([topic, weakness]: [string, any]) => {
      if (!priorities[topic]) {
        priorities[topic] = Math.min(weakness / 10, 0.9); // Scale weakness to priority
      }
    });

    // Lower priority for mastered topics (but don't exclude completely for maintenance)
    Object.entries(performancePattern.topicStrengths || {}).forEach(([topic, strength]: [string, any]) => {
      if (!priorities[topic] && strength > 0.8) {
        priorities[topic] = 0.2; // Low priority for review
      }
    });
  }

  return priorities;
}

function selectQuestionsByPriority(
  questions: any[],
  topicPriorities: Record<string, number>,
  count: number
): any[] {
  if (questions.length <= count) {
    return questions;
  }

  // Score questions based on topic priorities
  const scoredQuestions = questions.map(question => {
    let score = 0.5; // Base score
    
    if (question.category_tags && Array.isArray(question.category_tags)) {
      question.category_tags.forEach((tag: string) => {
        if (topicPriorities[tag]) {
          score += topicPriorities[tag];
        }
      });
    }

    return {
      ...question,
      priority_score: score
    };
  });

  // Sort by priority score and select top questions
  scoredQuestions.sort((a, b) => b.priority_score - a.priority_score);
  
  return scoredQuestions.slice(0, count);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}