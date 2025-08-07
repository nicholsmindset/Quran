import OpenAI from 'openai';
import { createServerSupabaseClient } from './supabase';
import type { 
  QuestionContext, 
  VerseContext, 
  AIHint, 
  AIExplanation, 
  PersonalizedRecommendation,
  UserPerformancePattern,
  SpacedRepetitionSchedule,
  LearningAnalytics,
  Question,
  Verse,
  TafsirReference 
} from '@/types';

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Enhancement Service for Sprint 2
 * Provides intelligent features for the quiz interface including:
 * - Rich question context and explanations
 * - Progressive hint systems
 * - Personalized learning recommendations
 * - Performance analytics and adaptive learning
 */
export class AIEnhancementService {
  private supabase = createServerSupabaseClient();

  /**
   * Generate rich context for a question including historical background
   * and thematic connections
   */
  async generateQuestionContext(
    questionId: string, 
    question: Question, 
    verse: Verse
  ): Promise<QuestionContext | null> {
    try {
      // Check if context already exists
      const { data: existingContext } = await this.supabase
        .from('question_contexts')
        .select('*')
        .eq('question_id', questionId)
        .single();

      if (existingContext) {
        return this.formatQuestionContext(existingContext);
      }

      // Generate new context using AI
      const contextData = await this.generateContextWithAI(question, verse);
      
      // Save to database
      const { data, error } = await this.supabase
        .from('question_contexts')
        .insert({
          question_id: questionId,
          verse_context: contextData.verseContext,
          tafsir_references: contextData.tafsirReferences,
          historical_background: contextData.historicalBackground,
          thematic_connections: contextData.thematicConnections,
          difficulty_factors: contextData.difficultyFactors
        })
        .select()
        .single();

      if (error) throw error;

      return this.formatQuestionContext(data);
    } catch (error) {
      console.error('Error generating question context:', error);
      return null;
    }
  }

  /**
   * Generate progressive hints for fill-in-blank questions
   */
  async generateProgressiveHints(questionId: string, question: Question): Promise<AIHint[]> {
    try {
      // Check if hints already exist
      const { data: existingHints } = await this.supabase
        .from('ai_hints')
        .select('*')
        .eq('question_id', questionId)
        .order('level');

      if (existingHints && existingHints.length > 0) {
        return existingHints.map(this.formatHint);
      }

      // Generate hints using AI
      const hints = await this.generateHintsWithAI(question);
      
      // Save hints to database
      const hintsData = hints.map((hint, index) => ({
        question_id: questionId,
        level: (index + 1) as 1 | 2 | 3,
        content: hint.content,
        type: hint.type,
        is_revealing: hint.isRevealing
      }));

      const { data, error } = await this.supabase
        .from('ai_hints')
        .insert(hintsData)
        .select();

      if (error) throw error;

      return data.map(this.formatHint);
    } catch (error) {
      console.error('Error generating progressive hints:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered explanation based on user's answer
   */
  async generateExplanation(
    questionId: string,
    question: Question,
    verse: Verse,
    userAnswer: string,
    isCorrect: boolean
  ): Promise<AIExplanation | null> {
    try {
      const explanationData = await this.generateExplanationWithAI(
        question, 
        verse, 
        userAnswer, 
        isCorrect
      );

      // Save explanation
      const { data, error } = await this.supabase
        .from('ai_explanations')
        .insert({
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          explanation: explanationData.explanation,
          additional_context: explanationData.additionalContext,
          related_concepts: explanationData.relatedConcepts,
          further_reading: explanationData.furtherReading
        })
        .select()
        .single();

      if (error) throw error;

      return this.formatExplanation(data);
    } catch (error) {
      console.error('Error generating explanation:', error);
      return null;
    }
  }

  /**
   * Analyze user performance and generate personalized recommendations
   */
  async generatePersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    try {
      // Get user performance data
      const performancePattern = await this.analyzeUserPerformance(userId);
      if (!performancePattern) return [];

      // Generate recommendations using AI
      const recommendations = await this.generateRecommendationsWithAI(performancePattern);

      // Save recommendations
      const recommendationsData = recommendations.map(rec => ({
        user_id: userId,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        action_items: rec.actionItems,
        priority: rec.priority,
        estimated_time: rec.estimatedTime,
        expires_at: rec.expiresAt
      }));

      const { data, error } = await this.supabase
        .from('personalized_recommendations')
        .insert(recommendationsData)
        .select();

      if (error) throw error;

      return data.map(this.formatRecommendation);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Analyze user performance patterns for adaptive learning
   */
  async analyzeUserPerformance(userId: string): Promise<UserPerformancePattern | null> {
    try {
      // Get user's quiz attempts
      const { data: attempts } = await this.supabase
        .from('quiz_attempts')
        .select(`
          *,
          questions (
            difficulty,
            category_tags
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!attempts || attempts.length === 0) return null;

      // Analyze patterns
      const topicStrengths: Record<string, number> = {};
      const topicWeaknesses: Record<string, number> = {};
      const difficultyProgression = { easy: 0, medium: 0, hard: 0 };
      
      let totalCorrect = 0;
      let totalTime = 0;

      attempts.forEach(attempt => {
        const question = attempt.questions;
        if (!question) return;

        // Track difficulty performance
        if (attempt.is_correct) {
          difficultyProgression[question.difficulty]++;
          totalCorrect++;
        }

        // Track topic performance
        question.category_tags?.forEach((topic: string) => {
          if (attempt.is_correct) {
            topicStrengths[topic] = (topicStrengths[topic] || 0) + 1;
          } else {
            topicWeaknesses[topic] = (topicWeaknesses[topic] || 0) + 1;
          }
        });

        totalTime += attempt.time_spent || 0;
      });

      const accuracyRate = totalCorrect / attempts.length;
      const averageTime = totalTime / attempts.length;

      // Calculate learning velocity (questions per day over last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentAttempts = attempts.filter(a => new Date(a.created_at) > thirtyDaysAgo);
      const learningVelocity = recentAttempts.length / 30;

      const pattern: UserPerformancePattern = {
        userId,
        topicStrengths,
        topicWeaknesses,
        difficultyProgression,
        learningVelocity,
        retentionRate: accuracyRate,
        consistencyScore: this.calculateConsistencyScore(attempts),
        updatedAt: new Date()
      };

      // Save pattern to database
      await this.supabase
        .from('user_performance_patterns')
        .upsert(pattern);

      return pattern;
    } catch (error) {
      console.error('Error analyzing user performance:', error);
      return null;
    }
  }

  /**
   * Get spaced repetition schedule for a user
   */
  async getSpacedRepetitionSchedule(userId: string): Promise<SpacedRepetitionSchedule[]> {
    try {
      const { data, error } = await this.supabase
        .from('spaced_repetition_schedules')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_date', new Date().toISOString())
        .order('next_review_date');

      if (error) throw error;

      return data.map(this.formatSpacedRepetition);
    } catch (error) {
      console.error('Error getting spaced repetition schedule:', error);
      return [];
    }
  }

  /**
   * Update spaced repetition schedule based on performance
   */
  async updateSpacedRepetition(
    userId: string, 
    questionId: string, 
    performance: 'again' | 'hard' | 'good' | 'easy'
  ): Promise<void> {
    try {
      const { data: existing } = await this.supabase
        .from('spaced_repetition_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .single();

      let interval: number;
      let easeFactor: number;
      let repetitions: number;

      if (existing) {
        // Update existing schedule using spaced repetition algorithm
        const result = this.calculateNextInterval(
          existing.interval,
          existing.ease_factor,
          existing.repetitions,
          performance
        );
        interval = result.interval;
        easeFactor = result.easeFactor;
        repetitions = result.repetitions;
      } else {
        // Create new schedule
        ({ interval, easeFactor, repetitions } = this.getInitialSpacedRepetitionValues(performance));
      }

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      await this.supabase
        .from('spaced_repetition_schedules')
        .upsert({
          user_id: userId,
          question_id: questionId,
          interval,
          ease_factor: easeFactor,
          repetitions,
          next_review_date: nextReviewDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
          last_performance: performance
        });

    } catch (error) {
      console.error('Error updating spaced repetition:', error);
    }
  }

  // Private helper methods

  private async generateContextWithAI(question: Question, verse: Verse): Promise<any> {
    const prompt = `Generate educational context for this Quranic question:

Verse: Surah ${verse.surah}:${verse.ayah}
Arabic: ${verse.arabicText}
English: ${verse.translationEn}

Question: ${question.prompt}

Provide:
1. Historical background of the verse
2. Main themes and concepts
3. Connection to other verses
4. Why this question tests understanding

Return JSON format with fields: historicalBackground, thematicConnections, difficultyFactors`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an Islamic education expert. Provide authentic, educational context for Quranic learning. Be accurate and respectful.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  }

  private async generateHintsWithAI(question: Question): Promise<any[]> {
    const prompt = `Create 3 progressive hints for this question:
Question: ${question.prompt}
Correct Answer: ${question.answer}

Generate hints that:
1. Level 1: Give vocabulary/theme guidance
2. Level 2: Provide more specific context
3. Level 3: Almost reveal the answer (last resort)

Return JSON array with fields: content, type, isRevealing`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Generate progressive educational hints that guide learning without giving away answers immediately.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{"hints": []}');
    return response.hints || [];
  }

  private async generateExplanationWithAI(
    question: Question,
    verse: Verse,
    userAnswer: string,
    isCorrect: boolean
  ): Promise<any> {
    const prompt = `Explain why this answer is ${isCorrect ? 'correct' : 'incorrect'}:

Question: ${question.prompt}
User Answer: ${userAnswer}
Correct Answer: ${question.answer}
Verse Context: ${verse.translationEn}

Provide educational explanation and related concepts for learning.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Provide educational explanations that help students understand Islamic concepts and Quranic knowledge.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  }

  private async generateRecommendationsWithAI(pattern: UserPerformancePattern): Promise<any[]> {
    const prompt = `Based on this learning pattern, generate personalized study recommendations:

Strengths: ${Object.keys(pattern.topicStrengths).join(', ')}
Weaknesses: ${Object.keys(pattern.topicWeaknesses).join(', ')}
Accuracy: ${(pattern.retentionRate * 100).toFixed(1)}%
Learning Velocity: ${pattern.learningVelocity.toFixed(1)} questions/day

Generate 2-3 actionable recommendations with specific study plans.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Create personalized Islamic study recommendations based on learning analytics. Be specific and actionable.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{"recommendations": []}');
    return response.recommendations || [];
  }

  private calculateConsistencyScore(attempts: any[]): number {
    // Calculate consistency based on regular study patterns
    if (attempts.length < 7) return 0.5; // Not enough data

    const dailyActivity = new Map<string, number>();
    attempts.forEach(attempt => {
      const date = new Date(attempt.created_at).toDateString();
      dailyActivity.set(date, (dailyActivity.get(date) || 0) + 1);
    });

    // Score based on how many days out of last 30 had activity
    const activeDays = dailyActivity.size;
    return Math.min(activeDays / 30, 1);
  }

  private calculateNextInterval(
    currentInterval: number,
    easeFactor: number,
    repetitions: number,
    performance: string
  ): { interval: number; easeFactor: number; repetitions: number } {
    // Simplified spaced repetition algorithm (similar to Anki)
    let newEaseFactor = easeFactor;
    let newRepetitions = repetitions;
    let newInterval: number;

    switch (performance) {
      case 'again':
        newRepetitions = 0;
        newInterval = 1;
        newEaseFactor = Math.max(1.3, easeFactor - 0.2);
        break;
      case 'hard':
        newRepetitions++;
        newInterval = Math.max(1, Math.floor(currentInterval * 1.2));
        newEaseFactor = Math.max(1.3, easeFactor - 0.15);
        break;
      case 'good':
        newRepetitions++;
        if (newRepetitions === 1) {
          newInterval = 1;
        } else if (newRepetitions === 2) {
          newInterval = 6;
        } else {
          newInterval = Math.floor(currentInterval * easeFactor);
        }
        break;
      case 'easy':
        newRepetitions++;
        newInterval = Math.floor(currentInterval * easeFactor * 1.3);
        newEaseFactor = easeFactor + 0.15;
        break;
    }

    return {
      interval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions
    };
  }

  private getInitialSpacedRepetitionValues(performance: string): {
    interval: number;
    easeFactor: number;
    repetitions: number;
  } {
    switch (performance) {
      case 'again':
        return { interval: 1, easeFactor: 2.5, repetitions: 0 };
      case 'hard':
        return { interval: 1, easeFactor: 2.36, repetitions: 1 };
      case 'good':
        return { interval: 1, easeFactor: 2.5, repetitions: 1 };
      case 'easy':
        return { interval: 4, easeFactor: 2.6, repetitions: 1 };
      default:
        return { interval: 1, easeFactor: 2.5, repetitions: 1 };
    }
  }

  // Formatter methods
  private formatQuestionContext(data: any): QuestionContext {
    return {
      id: data.id,
      questionId: data.question_id,
      verseContext: data.verse_context,
      tafsirReferences: data.tafsir_references || [],
      historicalBackground: data.historical_background,
      thematicConnections: data.thematic_connections || [],
      difficultyFactors: data.difficulty_factors || [],
      createdAt: new Date(data.created_at)
    };
  }

  private formatHint(data: any): AIHint {
    return {
      id: data.id,
      questionId: data.question_id,
      level: data.level,
      content: data.content,
      type: data.type,
      isRevealing: data.is_revealing
    };
  }

  private formatExplanation(data: any): AIExplanation {
    return {
      id: data.id,
      questionId: data.question_id,
      userAnswer: data.user_answer,
      isCorrect: data.is_correct,
      explanation: data.explanation,
      additionalContext: data.additional_context,
      relatedConcepts: data.related_concepts || [],
      furtherReading: data.further_reading || []
    };
  }

  private formatRecommendation(data: any): PersonalizedRecommendation {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      description: data.description,
      actionItems: data.action_items || [],
      priority: data.priority,
      estimatedTime: data.estimated_time,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined
    };
  }

  private formatSpacedRepetition(data: any): SpacedRepetitionSchedule {
    return {
      id: data.id,
      userId: data.user_id,
      questionId: data.question_id,
      interval: data.interval,
      easeFactor: data.ease_factor,
      repetitions: data.repetitions,
      nextReviewDate: new Date(data.next_review_date),
      lastReviewedAt: new Date(data.last_reviewed_at),
      lastPerformance: data.last_performance
    };
  }
}