#!/usr/bin/env tsx

/**
 * Test script for AI Question Generation System
 * Run with: npx tsx scripts/test-ai-generation.ts
 */

import { config } from 'dotenv';
import { AIQuestionGenerator } from '../src/lib/ai-question-generator';
import { BatchProcessor } from '../src/lib/batch-processor';
import { createServerSupabaseClient } from '../src/lib/supabase';

// Load environment variables
config({ path: '.env.local' });

const supabase = createServerSupabaseClient();

async function testSingleVerseGeneration() {
  console.log('\n=== Testing Single Verse Question Generation ===');
  
  try {
    // Get Al-Fatiha first verse for testing
    const { data: verse, error } = await supabase
      .from('verses')
      .select('*')
      .eq('surah', 1)
      .eq('ayah', 1)
      .single();

    if (error || !verse) {
      console.error('Error getting test verse:', error);
      return;
    }

    console.log(`Testing with: Surah ${verse.surah}, Ayah ${verse.ayah}`);
    console.log(`Arabic: ${verse.arabic_text}`);
    console.log(`English: ${verse.translation_en}`);

    const generator = new AIQuestionGenerator();
    const questions = await generator.generateQuestionsForVerse(verse, 2);

    console.log(`\nGenerated ${questions.length} questions:`);
    questions.forEach((q, i) => {
      console.log(`\n--- Question ${i + 1} ---`);
      console.log(`Prompt: ${q.prompt}`);
      console.log(`Choices: ${q.choices.join(' | ')}`);
      console.log(`Answer: ${q.answer}`);
      console.log(`Difficulty: ${q.difficulty}`);
      console.log(`Topics: ${q.topics.join(', ')}`);
      console.log(`Explanation: ${q.explanation}`);
    });

    // Test embeddings
    console.log('\n--- Testing Embeddings ---');
    const embeddings = await generator.generateEmbeddings(questions);
    console.log(`Generated ${embeddings.length} embeddings`);
    console.log(`First embedding dimension: ${embeddings[0]?.length}`);

    // Test saving to moderation queue
    console.log('\n--- Testing Save to Moderation Queue ---');
    const questionIds = await generator.saveQuestionsToModerationQueue(
      questions,
      verse,
      embeddings,
      'test-script'
    );
    console.log(`Saved ${questionIds.length} questions with IDs: ${questionIds.join(', ')}`);

  } catch (error) {
    console.error('Error in single verse generation test:', error);
  }
}

async function testBatchProcessing() {
  console.log('\n=== Testing Batch Processing ===');
  
  try {
    const processor = new BatchProcessor();
    
    // Test getting verses for processing
    console.log('Getting verses for processing...');
    const verses = await processor.getVersesForProcessing(5); // Small test batch
    console.log(`Found ${verses.length} verses for processing`);

    if (verses.length > 0) {
      console.log('Sample verses:');
      verses.slice(0, 3).forEach(v => {
        console.log(`- Surah ${v.surah}:${v.ayah}`);
      });

      // Test manual generation for specific surah
      console.log('\n--- Testing Manual Generation for Surah 112 (Al-Ikhlas) ---');
      const result = await processor.generateQuestionsForSpecificVerses(112);
      console.log(`Result: ${result.message}`);
      console.log(`Questions generated: ${result.questionsGenerated}`);
    }

  } catch (error) {
    console.error('Error in batch processing test:', error);
  }
}

async function testBatchStats() {
  console.log('\n=== Testing Batch Statistics ===');
  
  try {
    const processor = new BatchProcessor();
    const stats = await processor.getBatchStats(30); // Last 30 days
    
    console.log('Batch Statistics:');
    console.log(`- Total runs: ${stats.totalRuns}`);
    console.log(`- Successful runs: ${stats.successfulRuns}`);
    console.log(`- Total questions generated: ${stats.totalQuestionsGenerated}`);
    console.log(`- Average duration: ${stats.averageDuration}s`);
    console.log(`- Recent errors: ${stats.recentErrors.length}`);
    
    if (stats.recentErrors.length > 0) {
      console.log('Recent errors:');
      stats.recentErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error('Error getting batch stats:', error);
  }
}

async function testModerationQueue() {
  console.log('\n=== Testing Moderation Queue ===');
  
  try {
    // Get pending questions
    const { data: pendingQuestions, error } = await supabase
      .from('questions')
      .select(`
        *,
        verses (surah, ayah, arabic_text, translation_en)
      `)
      .is('approved_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error getting pending questions:', error);
      return;
    }

    console.log(`Found ${pendingQuestions?.length || 0} pending questions in moderation queue`);
    
    if (pendingQuestions && pendingQuestions.length > 0) {
      console.log('\nSample pending questions:');
      pendingQuestions.slice(0, 2).forEach((q, i) => {
        console.log(`\n--- Pending Question ${i + 1} ---`);
        console.log(`Verse: Surah ${(q.verses as any)?.surah}:${(q.verses as any)?.ayah}`);
        console.log(`Prompt: ${q.prompt}`);
        console.log(`Choices: ${q.choices?.join(' | ')}`);
        console.log(`Difficulty: ${q.difficulty}`);
        console.log(`Created: ${q.created_at}`);
      });
    }

  } catch (error) {
    console.error('Error testing moderation queue:', error);
  }
}

async function verifyEnvironmentSetup() {
  console.log('=== Verifying Environment Setup ===');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];

  let allPresent = true;
  requiredEnvVars.forEach(envVar => {
    const present = !!process.env[envVar];
    console.log(`${envVar}: ${present ? '✅ Present' : '❌ Missing'}`);
    if (!present) allPresent = false;
  });

  if (!allPresent) {
    console.log('\n❌ Some required environment variables are missing. Please check your .env.local file.');
    return false;
  }

  // Test Supabase connection
  try {
    const { data, error } = await supabase
      .from('verses')
      .select('count(*)')
      .single();

    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    console.log(`📊 Database contains ${(data as any)?.count || 0} verses`);
    
  } catch (error) {
    console.log('❌ Database connection error:', error);
    return false;
  }

  return true;
}

async function main() {
  console.log('🚀 AI Question Generation System Test');
  console.log('=====================================');

  // Verify environment setup first
  const setupOk = await verifyEnvironmentSetup();
  if (!setupOk) {
    console.log('\n❌ Environment setup issues detected. Please fix them before proceeding.');
    process.exit(1);
  }

  // Run tests
  await testModerationQueue();
  await testSingleVerseGeneration();
  await testBatchProcessing();
  await testBatchStats();

  console.log('\n✅ Test completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Set up cron job to call /api/cron/question-generation every 4 hours');
  console.log('2. Configure scholar accounts for question approval');
  console.log('3. Monitor batch processing logs');
  console.log('4. Review generated questions in the moderation queue');
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}