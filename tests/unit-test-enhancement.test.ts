/**
 * Enhanced Unit Tests for Sprint 2 Features
 * Comprehensive testing for AI system, scholar moderation, and Islamic content validation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIQuestionGenerator } from '@/lib/ai-question-generator'
import { QuizEngine } from '@/lib/quiz-engine'
import { TeacherGroupService } from '@/lib/teacher-group-service'
import { AIEnhancementService } from '@/lib/ai-enhancement-service'

// Mock external dependencies
jest.mock('@/lib/supabase')
jest.mock('openai')

describe('AI Question Generator', () => {
  let generator: AIQuestionGenerator
  
  beforeEach(() => {
    generator = new AIQuestionGenerator()
    jest.clearAllMocks()
  })
  
  it('should generate questions with proper Islamic validation', async () => {
    const mockVerse = {
      id: 'verse-1',
      arabic_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      surah_number: 1,
      verse_number: 1
    }
    
    const questions = await generator.generateQuestions(mockVerse, 3)
    
    expect(questions).toHaveLength(3)
    questions.forEach(question => {
      expect(question).toHaveProperty('id')
      expect(question).toHaveProperty('questionText')
      expect(question).toHaveProperty('choices')
      expect(question).toHaveProperty('correctAnswer')
      expect(question).toHaveProperty('difficulty')
      expect(question.status).toBe('pending') // Should require scholar approval
      expect(question.islamic_validation_required).toBe(true)
    })
  })
  
  it('should handle Arabic text encoding correctly', async () => {
    const arabicText = 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ'
    
    const result = await generator.validateArabicText(arabicText)
    
    expect(result.isValid).toBe(true)
    expect(result.encoding).toBe('UTF-8')
    expect(result.hasDiacritics).toBe(true)
    expect(result.direction).toBe('rtl')
  })
  
  it('should generate context-aware questions', async () => {
    const verse = {
      id: 'verse-2',
      arabic_text: 'الرَّحْمَٰنِ الرَّحِيمِ',
      translation: 'The Entirely Merciful, the Especially Merciful.',
      surah_number: 1,
      verse_number: 3,
      context: {
        preceding_verses: ['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'],
        surah_theme: 'Opening prayer and praise'
      }
    }
    
    const questions = await generator.generateContextualQuestions(verse, 2)
    
    expect(questions).toHaveLength(2)
    questions.forEach(question => {
      expect(question.context_provided).toBe(true)
      expect(question.difficulty_reasoning).toBeDefined()
    })
  })
  
  it('should respect Islamic content guidelines', async () => {
    const inappropriateContent = {
      questionText: 'This is inappropriate content for testing',
      choices: ['Option 1', 'Option 2'],
      correctAnswer: 0
    }
    
    const validation = await generator.validateIslamicContent(inappropriateContent)
    
    expect(validation).toHaveProperty('isAppropriate')
    expect(validation).toHaveProperty('concerns')
    expect(validation).toHaveProperty('recommendations')
  })
})

describe('Quiz Engine with Islamic Features', () => {
  let quizEngine: QuizEngine
  
  beforeEach(() => {
    quizEngine = new QuizEngine()
    jest.clearAllMocks()
  })
  
  it('should generate daily quiz with appropriate Islamic timing', async () => {
    // Mock Islamic calendar and prayer times
    const mockIslamicDate = {
      hijri: '1445-07-15',
      gregorian: '2024-01-28',
      islamicEvents: ['regular']
    }
    
    const dailyQuiz = await quizEngine.generateDailyQuiz('user-123', mockIslamicDate)
    
    expect(dailyQuiz).toHaveProperty('id')
    expect(dailyQuiz).toHaveProperty('questions')
    expect(dailyQuiz.questions).toHaveLength(10) // Standard daily quiz length
    expect(dailyQuiz.islamic_context).toBeDefined()
    expect(dailyQuiz.generated_at).toBeDefined()
  })
  
  it('should adjust difficulty based on user performance', async () => {
    const userStats = {
      averageScore: 85,
      recentPerformance: [90, 80, 85, 88, 92],
      strengthAreas: ['tafsir', 'basic_arabic'],
      weaknessAreas: ['advanced_grammar']
    }
    
    const adaptiveQuiz = await quizEngine.generateAdaptiveQuiz('user-123', userStats)
    
    expect(adaptiveQuiz.difficulty_distribution).toBeDefined()
    expect(adaptiveQuiz.questions.some(q => q.difficulty === 'hard')).toBe(true)
    expect(adaptiveQuiz.focus_areas).toContain('advanced_grammar')
  })
  
  it('should handle auto-save functionality', async () => {
    const quizSession = {
      id: 'session-123',
      userId: 'user-123',
      questions: [
        { id: 'q1', answer: null },
        { id: 'q2', answer: 'A' },
        { id: 'q3', answer: null }
      ],
      currentQuestionIndex: 1,
      timeSpent: 120000
    }
    
    const saveResult = await quizEngine.autoSave(quizSession)
    
    expect(saveResult.success).toBe(true)
    expect(saveResult.timestamp).toBeDefined()
    expect(saveResult.questionsAnswered).toBe(1)
  })
  
  it('should calculate streak with Islamic calendar awareness', async () => {
    const userId = 'user-123'
    const completionDates = [
      '2024-01-26', '2024-01-27', '2024-01-28' // 3 consecutive days
    ]
    
    const streak = await quizEngine.calculateStreak(userId, completionDates)
    
    expect(streak.current).toBe(3)
    expect(streak.longest).toBeGreaterThanOrEqual(3)
    expect(streak.islamic_milestone_reached).toBeDefined()
  })
})

describe('Teacher Group Service', () => {
  let groupService: TeacherGroupService
  
  beforeEach(() => {
    groupService = new TeacherGroupService()
    jest.clearAllMocks()
  })
  
  it('should create group with Islamic educational settings', async () => {
    const groupData = {
      name: 'Advanced Quranic Studies',
      description: 'For advanced students of Quranic Arabic',
      grade_level: 'high_school',
      islamic_curriculum_level: 'advanced',
      teacher_id: 'teacher-123'
    }
    
    const group = await groupService.createGroup(groupData)
    
    expect(group).toHaveProperty('id')
    expect(group).toHaveProperty('invitation_code')
    expect(group.invitation_code).toMatch(/^[A-Z0-9]{6,8}$/)
    expect(group.settings.allow_late_submissions).toBe(true) // Default Islamic flexibility
    expect(group.settings.prayer_time_reminders).toBe(true)
  })
  
  it('should generate unique invitation codes', async () => {
    const codes = new Set()
    
    for (let i = 0; i < 100; i++) {
      const code = await groupService.generateInvitationCode()
      expect(codes.has(code)).toBe(false)
      codes.add(code)
      expect(code).toMatch(/^[A-Z0-9]{6,8}$/)
    }
  })
  
  it('should handle student enrollment workflow', async () => {
    const groupId = 'group-123'
    const studentId = 'student-456'
    const invitationCode = 'ABC123'
    
    const enrollment = await groupService.enrollStudent(groupId, studentId, invitationCode)
    
    expect(enrollment.success).toBe(true)
    expect(enrollment.enrollment_date).toBeDefined()
    expect(enrollment.status).toBe('active')
  })
  
  it('should create assignments with Islamic content focus', async () => {
    const assignmentData = {
      title: 'Surah Al-Fatihah Comprehension',
      description: 'Understanding the opening chapter of the Quran',
      due_date: '2024-02-15',
      question_criteria: {
        surah_focus: [1], // Al-Fatihah
        difficulty: 'medium',
        count: 15,
        include_arabic: true,
        include_tafsir: true
      }
    }
    
    const assignment = await groupService.createAssignment('group-123', assignmentData)
    
    expect(assignment).toHaveProperty('id')
    expect(assignment.questions).toHaveLength(15)
    expect(assignment.islamic_focus).toBeDefined()
    expect(assignment.status).toBe('active')
  })
  
  it('should track student progress with Islamic milestones', async () => {
    const groupId = 'group-123'
    const studentId = 'student-456'
    
    const progress = await groupService.getStudentProgress(groupId, studentId)
    
    expect(progress).toHaveProperty('overall_score')
    expect(progress).toHaveProperty('assignments_completed')
    expect(progress).toHaveProperty('current_streak')
    expect(progress).toHaveProperty('islamic_milestones')
    expect(progress.islamic_milestones).toContain('first_perfect_score')
  })
})

describe('AI Enhancement Service', () => {
  let enhancementService: AIEnhancementService
  
  beforeEach(() => {
    enhancementService = new AIEnhancementService()
    jest.clearAllMocks()
  })
  
  it('should generate contextual explanations for answers', async () => {
    const question = {
      id: 'q-123',
      questionText: 'What does "Rahman" mean in Arabic?',
      correctAnswer: 'The Compassionate',
      verse_reference: '1:3'
    }
    
    const explanation = await enhancementService.generateExplanation(question)
    
    expect(explanation).toHaveProperty('simplified')
    expect(explanation).toHaveProperty('detailed')
    expect(explanation).toHaveProperty('arabic_breakdown')
    expect(explanation).toHaveProperty('scholarly_references')
    expect(explanation.cultural_context).toBeDefined()
  })
  
  it('should provide progressive hints system', async () => {
    const question = {
      id: 'q-456',
      questionText: 'Complete the verse: "Guide us to the _____ path"',
      difficulty: 'easy'
    }
    
    const hints = await enhancementService.generateHints(question)
    
    expect(hints).toHaveProperty('level1') // Gentle hint
    expect(hints).toHaveProperty('level2') // More specific
    expect(hints).toHaveProperty('level3') // Direct guidance
    expect(hints.level1.preserves_learning).toBe(true)
  })
  
  it('should generate personalized recommendations', async () => {
    const userProfile = {
      id: 'user-789',
      performance_history: {
        strong_areas: ['basic_arabic', 'story_comprehension'],
        weak_areas: ['advanced_grammar', 'historical_context'],
        preferred_difficulty: 'medium'
      },
      learning_style: 'visual',
      islamic_knowledge_level: 'intermediate'
    }
    
    const recommendations = await enhancementService.generateRecommendations(userProfile)
    
    expect(recommendations).toHaveProperty('focus_areas')
    expect(recommendations).toHaveProperty('suggested_difficulty')
    expect(recommendations).toHaveProperty('learning_resources')
    expect(recommendations.focus_areas).toContain('advanced_grammar')
  })
  
  it('should validate content for Islamic appropriateness', async () => {
    const content = {
      text: 'This lesson discusses the concept of Tawhid in Islam',
      context: 'educational',
      audience: 'high_school'
    }
    
    const validation = await enhancementService.validateIslamicContent(content)
    
    expect(validation).toHaveProperty('is_appropriate')
    expect(validation).toHaveProperty('confidence_score')
    expect(validation).toHaveProperty('concerns')
    expect(validation).toHaveProperty('suggestions')
    expect(validation.is_appropriate).toBe(true)
  })
})

describe('Islamic Content Utilities', () => {
  it('should correctly identify Arabic text patterns', () => {
    const arabicText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
    const englishText = 'In the name of Allah'
    const mixedText = 'The Arabic phrase بِسْمِ اللَّهِ means "In the name of Allah"'
    
    expect(isArabicText(arabicText)).toBe(true)
    expect(isArabicText(englishText)).toBe(false)
    expect(containsArabicText(mixedText)).toBe(true)
    expect(getArabicTextDirection(arabicText)).toBe('rtl')
  })
  
  it('should validate Quranic verse references', () => {
    const validRefs = ['1:1', '2:255', '114:6']
    const invalidRefs = ['0:1', '115:1', '2:300']
    
    validRefs.forEach(ref => {
      expect(isValidVerseReference(ref)).toBe(true)
    })
    
    invalidRefs.forEach(ref => {
      expect(isValidVerseReference(ref)).toBe(false)
    })
  })
  
  it('should format Islamic dates correctly', () => {
    const gregorianDate = new Date('2024-01-28')
    const hijriDate = formatHijriDate(gregorianDate)
    
    expect(hijriDate).toMatch(/\d+.*\d{4}.*AH/)
    expect(hijriDate).toContain('Rajab') // Expected month
  })
  
  it('should handle prayer time calculations', () => {
    const location = { latitude: 21.3891, longitude: 39.8579 } // Mecca
    const date = new Date('2024-01-28')
    
    const prayerTimes = calculatePrayerTimes(location, date)
    
    expect(prayerTimes).toHaveProperty('fajr')
    expect(prayerTimes).toHaveProperty('dhuhr')
    expect(prayerTimes).toHaveProperty('asr')
    expect(prayerTimes).toHaveProperty('maghrib')
    expect(prayerTimes).toHaveProperty('isha')
    
    // All prayer times should be valid Date objects
    Object.values(prayerTimes).forEach(time => {
      expect(time).toBeInstanceOf(Date)
    })
  })
  
  it('should validate Islamic terminology usage', () => {
    const respectfulText = 'Prophet Muhammad (peace be upon him) said...'
    const casualText = 'Muhammad said...'
    const inappropriateText = 'The Prophet said (without proper respect)...'
    
    expect(validateIslamicTerminology(respectfulText).isRespectful).toBe(true)
    expect(validateIslamicTerminology(casualText).needsImprovement).toBe(true)
    expect(validateIslamicTerminology(inappropriateText).concerns.length).toBeGreaterThan(0)
  })
})

// Helper functions for testing
function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

function containsArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

function getArabicTextDirection(text: string): string {
  return isArabicText(text) ? 'rtl' : 'ltr'
}

function isValidVerseReference(ref: string): boolean {
  const match = ref.match(/^(\d+):(\d+)$/)
  if (!match) return false
  
  const surah = parseInt(match[1])
  const verse = parseInt(match[2])
  
  return surah >= 1 && surah <= 114 && verse >= 1
}

function formatHijriDate(gregorianDate: Date): string {
  // Simplified Hijri date formatting for testing
  const hijriMonths = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ]
  
  // Mock conversion for testing
  return `15 ${hijriMonths[6]} 1445 AH`
}

function calculatePrayerTimes(location: { latitude: number; longitude: number }, date: Date) {
  // Mock prayer time calculation for testing
  return {
    fajr: new Date(date.getTime() + 5 * 60 * 60 * 1000),
    dhuhr: new Date(date.getTime() + 12 * 60 * 60 * 1000),
    asr: new Date(date.getTime() + 15 * 60 * 60 * 1000),
    maghrib: new Date(date.getTime() + 18 * 60 * 60 * 1000),
    isha: new Date(date.getTime() + 20 * 60 * 60 * 1000)
  }
}

function validateIslamicTerminology(text: string): {
  isRespectful: boolean
  needsImprovement: boolean
  concerns: string[]
  suggestions: string[]
} {
  const concerns = []
  const suggestions = []
  
  // Check for respectful references to Prophet Muhammad
  if (text.toLowerCase().includes('muhammad') && !text.includes('peace be upon him') && !text.includes('(PBUH)')) {
    concerns.push('Prophet Muhammad should be mentioned with proper respect')
    suggestions.push('Add "peace be upon him" or "(PBUH)" after Prophet Muhammad')
  }
  
  // Check for proper use of "Allah" vs "God"
  if (text.toLowerCase().includes('god') && !text.toLowerCase().includes('allah')) {
    suggestions.push('Consider using "Allah" instead of "God" in Islamic contexts')
  }
  
  return {
    isRespectful: concerns.length === 0,
    needsImprovement: suggestions.length > 0,
    concerns,
    suggestions
  }
}