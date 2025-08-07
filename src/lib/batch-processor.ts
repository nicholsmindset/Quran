import { createServerSupabaseClient } from './supabase';
import { AIQuestionGenerator } from './ai-question-generator';
import type { Database } from './supabase';

type Verse = Database['public']['Tables']['verses']['Row'];

/**
 * Batch Processing Service for AI Question Generation
 * Runs every 4 hours to generate questions for unprocessed verses
 */
export class BatchProcessor {
  private supabase = createServerSupabaseClient();
  private questionGenerator: AIQuestionGenerator;

  constructor() {
    this.questionGenerator = new AIQuestionGenerator({
      batchSize: 50,
      maxQuestionsPerVerse: 2,
      difficultyDistribution: {
        easy: 0.4,
        medium: 0.4,
        hard: 0.2,
      },
    });
  }

  /**
   * Main batch processing function
   * Called by cron job every 4 hours
   */
  async processBatch(): Promise<{
    success: boolean;
    stats: {
      versesProcessed: number;
      questionsGenerated: number;
      questionsSaved: number;
      errors: number;
    };
    message: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('Starting AI question generation batch process...');

      // Get verses that need question generation
      const verses = await this.getVersesForProcessing();
      
      if (verses.length === 0) {
        return {
          success: true,
          stats: {
            versesProcessed: 0,
            questionsGenerated: 0,
            questionsSaved: 0,
            errors: 0,
          },
          message: 'No verses need processing at this time',
        };
      }

      console.log(`Found ${verses.length} verses to process`);

      // Process verses in smaller batches to manage memory and API rate limits
      const batchSize = 10;
      const totalStats = {
        versesProcessed: 0,
        questionsGenerated: 0,
        questionsSaved: 0,
        errors: 0,
      };

      for (let i = 0; i < verses.length; i += batchSize) {
        const batch = verses.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(verses.length/batchSize)}`);

        const batchStats = await this.questionGenerator.processBatch(batch);
        
        totalStats.versesProcessed += batch.length;
        totalStats.questionsGenerated += batchStats.totalGenerated;
        totalStats.questionsSaved += batchStats.saved;
        totalStats.errors += batchStats.errors;

        // Update processing status
        await this.updateProcessingStatus(batch.map(v => v.id));

        // Add delay between batches to respect rate limits
        if (i + batchSize < verses.length) {
          console.log('Waiting 30 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }

      // Log batch completion
      const duration = Math.round((Date.now() - startTime) / 1000);
      const message = `Batch completed in ${duration}s: ${totalStats.questionsGenerated} questions generated, ${totalStats.questionsSaved} saved to moderation queue`;
      
      console.log(message);

      // Log to database for monitoring
      await this.logBatchRun({
        verses_processed: totalStats.versesProcessed,
        questions_generated: totalStats.questionsGenerated,
        questions_saved: totalStats.questionsSaved,
        errors: totalStats.errors,
        duration_seconds: duration,
        success: true,
      });

      return {
        success: true,
        stats: totalStats,
        message,
      };

    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const errorMessage = `Batch process failed after ${duration}s: ${error}`;
      
      console.error(errorMessage);

      // Log failed batch run
      await this.logBatchRun({
        verses_processed: 0,
        questions_generated: 0,
        questions_saved: 0,
        errors: 1,
        duration_seconds: duration,
        success: false,
        error_message: String(error),
      });

      return {
        success: false,
        stats: {
          versesProcessed: 0,
          questionsGenerated: 0,
          questionsSaved: 0,
          errors: 1,
        },
        message: errorMessage,
      };
    }
  }

  /**
   * Get verses that need question generation
   * Prioritizes commonly memorized verses and those without questions
   */
  async getVersesForProcessing(limit: number = 50): Promise<Verse[]> {
    try {
      // Get verses that have no questions or fewer than 2 questions
      const { data: versesNeedingQuestions, error } = await this.supabase
        .from('verses')
        .select(`
          *,
          questions!inner(id)
        `)
        .having('questions', 'lt', 2)
        .order('surah', { ascending: true })
        .order('ayah', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      // If we don't have enough, get verses with no questions at all
      if (!versesNeedingQuestions || versesNeedingQuestions.length < limit) {
        const { data: versesWithoutQuestions, error: error2 } = await this.supabase
          .from('verses')
          .select(`
            *
          `)
          .not('id', 'in', 
            `(SELECT DISTINCT verse_id FROM questions WHERE verse_id IS NOT NULL)`
          )
          .order('surah', { ascending: true })
          .order('ayah', { ascending: true })
          .limit(limit - (versesNeedingQuestions?.length || 0));

        if (error2) {
          throw error2;
        }

        return [
          ...(versesNeedingQuestions || []),
          ...(versesWithoutQuestions || [])
        ];
      }

      return versesNeedingQuestions || [];
    } catch (error) {
      console.error('Error getting verses for processing:', error);
      
      // Fallback: get random verses
      const { data: fallbackVerses } = await this.supabase
        .from('verses')
        .select('*')
        .order('surah', { ascending: true })
        .order('ayah', { ascending: true })
        .limit(limit);

      return fallbackVerses || [];
    }
  }

  /**
   * Get verses prioritized for memorization (common surahs)
   */
  async getPriorityVerses(limit: number = 20): Promise<Verse[]> {
    // Common surahs for memorization (short surahs, commonly recited)
    const prioritySurahs = [
      1,   // Al-Fatiha
      2,   // Al-Baqarah (first few verses)
      112, // Al-Ikhlas
      113, // Al-Falaq
      114, // An-Nas
      110, // An-Nasr
      108, // Al-Kawthar
      107, // Al-Ma'un
      106, // Quraish
      105, // Al-Fil
      104, // Al-Humazah
      103, // Al-Asr
      102, // At-Takathur
      101, // Al-Qari'ah
      100, // Al-Adiyat
    ];

    try {
      const { data, error } = await this.supabase
        .from('verses')
        .select('*')
        .in('surah', prioritySurahs)
        .order('surah', { ascending: true })
        .order('ayah', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting priority verses:', error);
      return [];
    }
  }

  /**
   * Update processing status for verses
   */
  private async updateProcessingStatus(verseIds: string[]): Promise<void> {
    try {
      // This could be extended to track processing status in a separate table
      // For now, we rely on the existence of questions to indicate processing
      console.log(`Updated processing status for ${verseIds.length} verses`);
    } catch (error) {
      console.error('Error updating processing status:', error);
    }
  }

  /**
   * Log batch run for monitoring and analytics
   */
  private async logBatchRun(stats: {
    verses_processed: number;
    questions_generated: number;
    questions_saved: number;
    errors: number;
    duration_seconds: number;
    success: boolean;
    error_message?: string;
  }): Promise<void> {
    try {
      // Create batch_runs table if it doesn't exist (would be in migrations)
      const { error } = await this.supabase
        .from('batch_runs')
        .insert({
          ...stats,
          run_at: new Date().toISOString(),
        });

      if (error && !error.message.includes('relation "batch_runs" does not exist')) {
        console.error('Error logging batch run:', error);
      }
    } catch (error) {
      console.error('Error logging batch run:', error);
    }
  }

  /**
   * Get batch processing statistics
   */
  async getBatchStats(days: number = 7): Promise<{
    totalRuns: number;
    successfulRuns: number;
    totalQuestionsGenerated: number;
    averageDuration: number;
    recentErrors: string[];
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('batch_runs')
        .select('*')
        .gte('run_at', cutoffDate.toISOString())
        .order('run_at', { ascending: false });

      if (error) {
        throw error;
      }

      const runs = data || [];
      
      return {
        totalRuns: runs.length,
        successfulRuns: runs.filter(r => r.success).length,
        totalQuestionsGenerated: runs.reduce((sum, r) => sum + r.questions_generated, 0),
        averageDuration: runs.length > 0 
          ? Math.round(runs.reduce((sum, r) => sum + r.duration_seconds, 0) / runs.length)
          : 0,
        recentErrors: runs
          .filter(r => !r.success && r.error_message)
          .slice(0, 5)
          .map(r => r.error_message || 'Unknown error'),
      };
    } catch (error) {
      console.error('Error getting batch stats:', error);
      return {
        totalRuns: 0,
        successfulRuns: 0,
        totalQuestionsGenerated: 0,
        averageDuration: 0,
        recentErrors: [],
      };
    }
  }

  /**
   * Manual trigger for question generation
   * Useful for testing and admin operations
   */
  async generateQuestionsForSpecificVerses(
    surah: number,
    ayahRange?: { start: number; end: number }
  ): Promise<{
    success: boolean;
    questionsGenerated: number;
    message: string;
  }> {
    try {
      let query = this.supabase
        .from('verses')
        .select('*')
        .eq('surah', surah);

      if (ayahRange) {
        query = query
          .gte('ayah', ayahRange.start)
          .lte('ayah', ayahRange.end);
      }

      const { data: verses, error } = await query
        .order('ayah', { ascending: true });

      if (error) {
        throw error;
      }

      if (!verses || verses.length === 0) {
        return {
          success: false,
          questionsGenerated: 0,
          message: `No verses found for Surah ${surah}`,
        };
      }

      const stats = await this.questionGenerator.processBatch(verses);

      return {
        success: true,
        questionsGenerated: stats.totalGenerated,
        message: `Generated ${stats.totalGenerated} questions for ${verses.length} verses in Surah ${surah}`,
      };
    } catch (error) {
      return {
        success: false,
        questionsGenerated: 0,
        message: `Error: ${error}`,
      };
    }
  }
}