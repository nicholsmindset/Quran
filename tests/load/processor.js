// Artillery processor for custom load testing logic
// Handles Islamic content specific load testing scenarios

const { faker } = require('@faker-js/faker');

// Islamic names and content for realistic test data
const islamicNames = [
  'Muhammad', 'Ahmed', 'Ali', 'Omar', 'Fatima', 'Aisha', 'Khadija', 'Zainab',
  'Abdullah', 'Ibrahim', 'Yusuf', 'Maryam', 'Sarah', 'Hakim', 'Amina', 'Layla'
];

const arabicPhrases = [
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
  'اللَّهُ أَكْبَر',
  'لا إِلَٰهَ إِلَّا ٱللَّٰهُ',
  'سُبْحَانَ ٱللَّٰهِ',
  'ٱلْحَمْدُ لِلَّهِ'
];

const studyTopics = [
  'Al-Fatiha', 'Al-Baqarah', 'Ayat al-Kursi', 'Prayer', 'Charity', 
  'Fasting', 'Pilgrimage', 'Faith', 'Patience', 'Forgiveness'
];

module.exports = {
  // Set up test data before scenarios run
  setupTestData: function(context, events, done) {
    context.vars.islamicName = islamicNames[Math.floor(Math.random() * islamicNames.length)];
    context.vars.arabicPhrase = arabicPhrases[Math.floor(Math.random() * arabicPhrases.length)];
    context.vars.studyTopic = studyTopics[Math.floor(Math.random() * studyTopics.length)];
    
    // Generate realistic user email
    const name = context.vars.islamicName.toLowerCase();
    context.vars.testEmail = `${name}.loadtest@example.com`;
    
    return done();
  },

  // Validate API responses contain expected Islamic content
  validateIslamicContent: function(requestParams, response, context, events, done) {
    if (response.body && response.body.data) {
      const data = JSON.parse(response.body);
      
      // Check for Arabic text in questions
      if (data.data && Array.isArray(data.data)) {
        const hasArabicContent = data.data.some(item => 
          item.arabic_text && /[\u0600-\u06FF]/.test(item.arabic_text)
        );
        
        if (!hasArabicContent) {
          events.emit('error', 'No Arabic content found in response');
        }
      }

      // Validate question structure for Islamic content
      if (data.data && data.data.questions) {
        const questions = data.data.questions;
        questions.forEach(question => {
          if (!question.verse_reference || !question.arabic_text) {
            events.emit('error', 'Invalid Islamic question structure');
          }
        });
      }
    }

    return done();
  },

  // Simulate realistic quiz-taking patterns
  simulateQuizSession: function(context, events, done) {
    // Simulate thinking time between questions (2-10 seconds)
    const thinkingTime = 2000 + Math.random() * 8000;
    context.vars.thinkingTime = Math.floor(thinkingTime);
    
    // Simulate accuracy based on difficulty
    const difficulty = context.vars.difficulty || 'medium';
    let accuracyRate = 0.7; // Default 70% accuracy
    
    switch (difficulty) {
      case 'easy':
        accuracyRate = 0.85;
        break;
      case 'medium':
        accuracyRate = 0.70;
        break;
      case 'hard':
        accuracyRate = 0.55;
        break;
    }
    
    context.vars.isCorrectAnswer = Math.random() < accuracyRate;
    
    return done();
  },

  // Generate realistic Islamic quiz answers
  generateQuizAnswer: function(context, events, done) {
    const questionType = context.vars.questionType || 'multiple_choice';
    
    if (questionType === 'multiple_choice') {
      // Random choice A-D
      const choices = ['A', 'B', 'C', 'D'];
      context.vars.selectedAnswer = choices[Math.floor(Math.random() * choices.length)];
    } else if (questionType === 'fill_blank') {
      // Use Arabic phrases for fill-in-the-blank
      context.vars.selectedAnswer = context.vars.arabicPhrase;
    } else {
      context.vars.selectedAnswer = 'Default answer';
    }
    
    return done();
  },

  // Monitor performance metrics specific to Islamic content
  trackIslamicPerformance: function(requestParams, response, context, events, done) {
    const startTime = Date.now();
    
    if (response.body) {
      try {
        const data = JSON.parse(response.body);
        
        // Track Arabic text rendering performance
        if (data.data && data.data.some && data.data.some(item => item.arabic_text)) {
          const arabicProcessingTime = Date.now() - startTime;
          events.emit('customStat', {
            name: 'arabic_text_processing_time',
            value: arabicProcessingTime
          });
        }

        // Track embedding generation performance
        if (requestParams.url && requestParams.url.includes('embeddings')) {
          const embeddingTime = Date.now() - startTime;
          events.emit('customStat', {
            name: 'embedding_generation_time',
            value: embeddingTime
          });
        }

        // Track question generation performance
        if (requestParams.url && requestParams.url.includes('generate-questions')) {
          const questionGenTime = Date.now() - startTime;
          events.emit('customStat', {
            name: 'ai_question_generation_time',
            value: questionGenTime
          });
        }

      } catch (error) {
        events.emit('error', `Error tracking Islamic performance: ${error.message}`);
      }
    }
    
    return done();
  },

  // Simulate different user study patterns
  simulateStudyPattern: function(context, events, done) {
    const patterns = ['casual', 'intensive', 'review', 'memorization'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    context.vars.studyPattern = pattern;
    
    switch (pattern) {
      case 'casual':
        context.vars.sessionDuration = 300000; // 5 minutes
        context.vars.questionsPerSession = 5;
        break;
      case 'intensive':
        context.vars.sessionDuration = 1800000; // 30 minutes
        context.vars.questionsPerSession = 20;
        break;
      case 'review':
        context.vars.sessionDuration = 600000; // 10 minutes
        context.vars.questionsPerSession = 10;
        break;
      case 'memorization':
        context.vars.sessionDuration = 900000; // 15 minutes
        context.vars.questionsPerSession = 8;
        break;
    }
    
    return done();
  },

  // Generate realistic progress tracking data
  generateProgressData: function(context, events, done) {
    context.vars.dailyStreak = Math.floor(Math.random() * 30) + 1;
    context.vars.totalQuestions = Math.floor(Math.random() * 500) + 50;
    context.vars.correctAnswers = Math.floor(context.vars.totalQuestions * 0.75);
    context.vars.studyTimeMinutes = Math.floor(Math.random() * 120) + 30;
    
    return done();
  },

  // Custom error handling for Islamic content
  handleIslamicContentErrors: function(requestParams, response, context, events, done) {
    if (response.statusCode >= 400) {
      // Log specific errors related to Islamic content
      if (requestParams.url.includes('questions') && response.statusCode === 422) {
        events.emit('customStat', {
          name: 'islamic_content_validation_errors',
          value: 1
        });
      }
      
      if (requestParams.url.includes('ai/generate') && response.statusCode === 500) {
        events.emit('customStat', {
          name: 'ai_generation_failures',
          value: 1
        });
      }
    }
    
    return done();
  },

  // Cleanup after test scenarios
  cleanup: function(context, events, done) {
    // Log test session summary
    if (context.vars.questionsAnswered) {
      events.emit('customStat', {
        name: 'questions_answered_per_session',
        value: context.vars.questionsAnswered
      });
    }
    
    return done();
  }
};

// Helper functions for generating test data
function generateRealisticEmail(name) {
  return `${name.toLowerCase().replace(/\s+/g, '.')}.test${Math.floor(Math.random() * 1000)}@loadtest.local`;
}

function generateArabicTestData() {
  return {
    text: arabicPhrases[Math.floor(Math.random() * arabicPhrases.length)],
    translation: 'Test translation for load testing',
    surah: Math.floor(Math.random() * 114) + 1,
    verse: Math.floor(Math.random() * 50) + 1
  };
}

// Export helper functions for use in test scenarios
module.exports.helpers = {
  generateRealisticEmail,
  generateArabicTestData,
  islamicNames,
  arabicPhrases,
  studyTopics
};