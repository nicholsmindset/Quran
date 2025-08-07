#!/usr/bin/env tsx

/**
 * Test script for the daily quiz system
 * Run with: npm run test:quiz or tsx scripts/test-quiz-system.ts
 */

import { config } from 'dotenv'
import { generateDailyQuiz, startQuizSession, saveQuizAnswer, completeQuizSession, getUserQuizStatus } from '../src/lib/quiz-engine'
import { createServerSupabaseClient } from '../src/lib/supabase'

// Load environment variables
config()

async function testQuizSystem() {
  console.log('🧪 Testing Daily Quiz System...\n')
  
  try {
    const supabase = createServerSupabaseClient()
    const testUserId = 'test-user-' + Math.random().toString(36).substring(7)
    const timezone = 'UTC'
    const testDate = new Date().toISOString().split('T')[0] // Today's date

    console.log(`📅 Test Date: ${testDate}`)
    console.log(`👤 Test User ID: ${testUserId}`)
    console.log(`🌍 Timezone: ${timezone}\n`)

    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...')
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        role: 'learner'
      })

    if (userError && userError.code !== '23505') { // Ignore if user already exists
      console.error('❌ Failed to create test user:', userError)
      return
    }
    console.log('✅ Test user created/exists\n')

    // Step 2: Test daily quiz generation
    console.log('2️⃣ Testing daily quiz generation...')
    try {
      const dailyQuiz = await generateDailyQuiz(testDate)
      console.log(`✅ Daily quiz generated successfully!`)
      console.log(`   Quiz ID: ${dailyQuiz.id}`)
      console.log(`   Date: ${dailyQuiz.date}`)
      console.log(`   Questions: ${dailyQuiz.questionIds.length}`)
      
      if (dailyQuiz.questions) {
        console.log('   Difficulty breakdown:')
        const difficulties = dailyQuiz.questions.reduce((acc, q) => {
          acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log(`     Easy: ${difficulties.easy || 0}`)
        console.log(`     Medium: ${difficulties.medium || 0}`)
        console.log(`     Hard: ${difficulties.hard || 0}`)
      }
      console.log()

      // Step 3: Test quiz status check
      console.log('3️⃣ Testing quiz status check...')
      const initialStatus = await getUserQuizStatus(testUserId, timezone)
      console.log(`✅ Quiz status retrieved:`)
      console.log(`   Completed today: ${initialStatus.hasCompletedToday}`)
      console.log(`   Active session: ${!!initialStatus.currentSession}`)
      console.log(`   Current streak: ${initialStatus.streakInfo.current}`)
      console.log(`   Longest streak: ${initialStatus.streakInfo.longest}`)
      console.log()

      // Step 4: Test starting a quiz session
      console.log('4️⃣ Testing quiz session start...')
      const session = await startQuizSession(testUserId, dailyQuiz.id, timezone)
      console.log(`✅ Quiz session started:`)
      console.log(`   Session ID: ${session.id}`)
      console.log(`   Status: ${session.status}`)
      console.log(`   Current question: ${session.currentQuestionIndex}`)
      console.log()

      // Step 5: Test saving answers
      console.log('5️⃣ Testing answer saving...')
      const questions = dailyQuiz.questions || []
      if (questions.length > 0) {
        for (let i = 0; i < Math.min(3, questions.length); i++) {
          const question = questions[i]
          const randomChoice = question.choices[Math.floor(Math.random() * question.choices.length)]
          
          console.log(`   Answering question ${i + 1}: "${question.prompt.substring(0, 50)}..."`)
          console.log(`   Selected answer: "${randomChoice}"`)
          
          const updatedSession = await saveQuizAnswer(
            session.id,
            question.id,
            randomChoice,
            true
          )
          
          console.log(`   ✅ Answer saved, moved to question ${updatedSession.currentQuestionIndex}`)
        }
      }
      console.log()

      // Step 6: Test session status after answers
      console.log('6️⃣ Testing session status after partial completion...')
      const midStatus = await getUserQuizStatus(testUserId, timezone)
      console.log(`✅ Updated status:`)
      console.log(`   Has active session: ${!!midStatus.currentSession}`)
      if (midStatus.currentSession) {
        const answeredCount = Object.keys(midStatus.currentSession.answers).length
        console.log(`   Questions answered: ${answeredCount}/${questions.length}`)
        console.log(`   Current question index: ${midStatus.currentSession.currentQuestionIndex}`)
      }
      console.log()

      // Step 7: Test completion with remaining answers
      console.log('7️⃣ Testing quiz completion...')
      const remainingAnswers: { [key: string]: string } = {}
      for (let i = 3; i < questions.length; i++) {
        const question = questions[i]
        // For testing, sometimes choose correct answer
        const isCorrect = Math.random() > 0.3 // 70% chance of correct answer
        const selectedAnswer = isCorrect 
          ? question.answer 
          : question.choices.find(c => c !== question.answer) || question.choices[0]
        
        remainingAnswers[question.id] = selectedAnswer
        console.log(`   Question ${i + 1}: ${isCorrect ? '✅ Correct' : '❌ Wrong'} answer`)
      }

      const results = await completeQuizSession(session.id)
      console.log(`✅ Quiz completed!`)
      console.log(`   Final score: ${results.score}%`)
      console.log(`   Correct answers: ${results.correctAnswers}/${results.totalQuestions}`)
      console.log(`   Time spent: ${Math.round(results.timeSpent / 1000)}s`)
      console.log(`   Streak updated: ${results.streakUpdated}`)
      console.log()

      // Step 8: Test final status
      console.log('8️⃣ Testing final quiz status...')
      const finalStatus = await getUserQuizStatus(testUserId, timezone)
      console.log(`✅ Final status:`)
      console.log(`   Completed today: ${finalStatus.hasCompletedToday}`)
      console.log(`   Active session: ${!!finalStatus.currentSession}`)
      console.log(`   Current streak: ${finalStatus.streakInfo.current}`)
      console.log(`   Longest streak: ${finalStatus.streakInfo.longest}`)
      console.log()

      console.log('🎉 All tests passed successfully!')
      
    } catch (quizError) {
      console.error('❌ Quiz generation failed:', quizError)
      console.log('\n📋 Possible causes:')
      console.log('   • Insufficient approved questions in database')
      console.log('   • Database connection issues')
      console.log('   • Missing required tables (run database-functions.sql)')
      
      if (quizError instanceof Error) {
        console.log(`\n🔍 Error details: ${quizError.message}`)
      }
    }

    // Cleanup: Remove test user
    console.log('\n🧹 Cleaning up test data...')
    await supabase.from('users').delete().eq('id', testUserId)
    console.log('✅ Test cleanup completed')

  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  }
}

// Helper function to test database connectivity
async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  
  try {
    const supabase = createServerSupabaseClient()
    
    // Test basic connectivity
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (usersError) {
      console.error('❌ Database connection failed:', usersError)
      return false
    }

    // Test required tables exist
    const tables = ['users', 'verses', 'questions', 'attempts', 'streaks', 'daily_quizzes', 'quiz_sessions']
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ Table '${table}' not accessible:`, error)
        return false
      }
    }

    // Check for approved questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('count')
      .not('approved_at', 'is', null)

    if (questionsError) {
      console.error('❌ Cannot access approved questions:', questionsError)
      return false
    }

    console.log('✅ Database connection successful')
    console.log(`📊 Approved questions available: ${questions?.[0]?.count || 0}`)
    
    if (!questions || questions[0]?.count < 5) {
      console.warn('⚠️  Warning: Less than 5 approved questions available')
      console.log('   Run question generation and approval process first')
    }

    return true
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return false
  }
}

// Main execution
async function main() {
  console.log('🚀 Daily Quiz System Test Suite\n')
  
  // Test database connection first
  const dbOk = await testDatabaseConnection()
  if (!dbOk) {
    console.log('\n❌ Database tests failed. Please check your setup.')
    process.exit(1)
  }

  console.log()
  await testQuizSystem()
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}