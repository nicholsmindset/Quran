import { AIQuestionGenerator, GeneratedQuestion, QuestionGenerationConfig } from '@/lib/ai-question-generator'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase'
import { VALID_QURAN_VERSES, SAMPLE_QUIZ_QUESTIONS } from '../../fixtures/islamic-content'

// Mock dependencies
jest.mock('openai')
jest.mock('@/lib/supabase')

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
  embeddings: {
    create: jest.fn(),
  },
}

const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  })),
}

const mockCreateServerSupabaseClient = createServerSupabaseClient as jest.MockedFunction<typeof createServerSupabaseClient>

describe('AIQuestionGenerator', () => {
  let generator: AIQuestionGenerator
  const mockVerse = {
    id: 'verse-1',
    surah: 1,
    ayah: 1,
    arabic_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation_en: 'In the name of Allah, the Most Gracious, the Most Merciful',
    created_at: new Date().toISOString()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateServerSupabaseClient.mockReturnValue(mockSupabase as any)
    ;(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI as any)
    
    generator = new AIQuestionGenerator()
  })

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultGenerator = new AIQuestionGenerator()
      expect(defaultGenerator).toBeInstanceOf(AIQuestionGenerator)
    })

    it('should accept custom configuration', () => {
      const customConfig: Partial<QuestionGenerationConfig> = {
        batchSize: 25,
        maxQuestionsPerVerse: 3,
        difficultyDistribution: {
          easy: 0.5,
          medium: 0.3,
          hard: 0.2,
        },
      }
      
      const customGenerator = new AIQuestionGenerator(customConfig)
      expect(customGenerator).toBeInstanceOf(AIQuestionGenerator)
    })
  })

  describe('generateQuestionsForVerse', () => {
    it('should generate questions for a verse', async () => {
      const mockMCQResponse = {
        questions: [
          {
            prompt: 'What is the opening of the Quran?',
            choices: ['A. Bismillah', 'B. Alhamdulillah', 'C. Allahu Akbar', 'D. La ilaha illa Allah'],
            answer: 'A. Bismillah',
            difficulty: 'easy',
            topics: ['Opening', 'Basmala'],
            explanation: 'Bismillah is the opening phrase of the Quran.'
          }
        ]
      }

      const mockFillBlankResponse = {
        questions: [
          {
            prompt: 'Complete: بِسْمِ _____ الرَّحْمَٰنِ الرَّحِيمِ',
            choices: ['A. اللَّهِ', 'B. الرَّحْمَٰنِ', 'C. الرَّحِيمِ', 'D. العَالَمِينَ'],
            answer: 'A. اللَّهِ',
            difficulty: 'medium',
            topics: ['memorization', 'arabic_vocabulary'],
            explanation: 'Allah is the name of God in Arabic.'
          }
        ]
      }

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(mockMCQResponse) } }]
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(mockFillBlankResponse) } }]
        })

      const questions = await generator.generateQuestionsForVerse(mockVerse, 2)

      expect(questions).toHaveLength(2)
      expect(questions[0]).toHaveValidIslamicContent
      expect(questions[0].prompt).toContain('opening')
      expect(questions[1].prompt).toContain('Complete')
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2)
    })

    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const questions = await generator.generateQuestionsForVerse(mockVerse, 2)

      expect(questions).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error generating questions for verse'),
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle invalid JSON responses', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'invalid json' } }]
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const questions = await generator.generateQuestionsForVerse(mockVerse, 2)

      expect(questions).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should limit questions to requested count', async () => {
      const mockResponse = {
        questions: Array(5).fill(null).map((_, i) => ({
          prompt: `Question ${i + 1}`,
          choices: [`A. Option 1`, `B. Option 2`, `C. Option 3`, `D. Option 4`],
          answer: 'A. Option 1',
          difficulty: 'easy',
          topics: ['topic1'],
          explanation: 'Explanation'
        }))
      }

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      })

      const questions = await generator.generateQuestionsForVerse(mockVerse, 3)
      expect(questions.length).toBeLessThanOrEqual(3)
    })
  })

  describe('generateEmbeddings', () => {
    it('should generate embeddings for questions', async () => {
      const mockQuestions: GeneratedQuestion[] = [
        {
          prompt: 'Test question',
          choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
          answer: 'A. Option 1',
          difficulty: 'easy',
          topics: ['test'],
          explanation: 'Test explanation'
        }
      ]

      const mockEmbeddingResponse = {
        data: [
          {
            embedding: new Array(1536).fill(0.1)
          }
        ]
      }

      mockOpenAI.embeddings.create.mockResolvedValue(mockEmbeddingResponse)

      const embeddings = await generator.generateEmbeddings(mockQuestions)

      expect(embeddings).toHaveLength(1)
      expect(embeddings[0]).toHaveLength(1536)
      expect(embeddings[0].every(val => val === 0.1)).toBe(true)
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['Test question A. Option 1 B. Option 2 C. Option 3 D. Option 4 test']
      })
    })

    it('should handle embedding API errors with fallback', async () => {
      const mockQuestions: GeneratedQuestion[] = [
        {
          prompt: 'Test question',
          choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
          answer: 'A. Option 1',
          difficulty: 'easy',
          topics: ['test'],
          explanation: 'Test explanation'
        }
      ]

      mockOpenAI.embeddings.create.mockRejectedValue(new Error('Embedding API Error'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const embeddings = await generator.generateEmbeddings(mockQuestions)

      expect(embeddings).toHaveLength(1)
      expect(embeddings[0]).toHaveLength(1536)
      expect(embeddings[0].every(val => val === 0)).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('Error generating embeddings:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should process questions in batches', async () => {
      const mockQuestions: GeneratedQuestion[] = Array(15).fill(null).map((_, i) => ({
        prompt: `Question ${i + 1}`,
        choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
        answer: 'A. Option 1',
        difficulty: 'easy',
        topics: ['test'],
        explanation: 'Explanation'
      }))

      const mockEmbeddingResponse = {
        data: Array(10).fill(null).map(() => ({
          embedding: new Array(1536).fill(0.1)
        }))
      }

      mockOpenAI.embeddings.create.mockResolvedValue(mockEmbeddingResponse)

      const embeddings = await generator.generateEmbeddings(mockQuestions)

      expect(embeddings).toHaveLength(15)
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2) // 15 questions, batch size 10
    })
  })

  describe('saveQuestionsToModerationQueue', () => {
    it('should save questions to moderation queue', async () => {
      const mockQuestions: GeneratedQuestion[] = [
        {
          prompt: 'Test question',
          choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
          answer: 'A. Option 1',
          difficulty: 'easy',
          topics: ['test'],
          explanation: 'Test explanation'
        }
      ]

      const mockEmbeddings = [[0.1, 0.2, 0.3]]
      const mockInsertResponse = {
        data: [{ id: 'question-1' }],
        error: null
      }

      const mockFromChain = mockSupabase.from()
      mockFromChain.select.mockResolvedValue(mockInsertResponse)

      const questionIds = await generator.saveQuestionsToModerationQueue(
        mockQuestions,
        mockVerse,
        mockEmbeddings,
        'test-user'
      )

      expect(questionIds).toEqual(['question-1'])
      expect(mockSupabase.from).toHaveBeenCalledWith('questions')
      expect(mockFromChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          verse_id: 'verse-1',
          prompt: 'Test question',
          choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
          answer: 'A. Option 1',
          difficulty: 'easy',
          created_by: 'test-user',
          topics: ['test'],
          explanation: 'Test explanation',
          embedding: [0.1, 0.2, 0.3],
          approved_at: null
        })
      ])
    })

    it('should handle database errors', async () => {
      const mockQuestions: GeneratedQuestion[] = [
        {
          prompt: 'Test question',
          choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
          answer: 'A. Option 1',
          difficulty: 'easy',
          topics: ['test'],
          explanation: 'Test explanation'
        }
      ]

      const mockEmbeddings = [[0.1, 0.2, 0.3]]
      const mockFromChain = mockSupabase.from()
      mockFromChain.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const questionIds = await generator.saveQuestionsToModerationQueue(
        mockQuestions,
        mockVerse,
        mockEmbeddings
      )

      expect(questionIds).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving questions to moderation queue:',
        expect.objectContaining({ message: 'Database error' })
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('classifyTopics', () => {
    it('should classify topics based on content', async () => {
      const mockQuestions: GeneratedQuestion[] = [
        {
          prompt: 'What is the importance of prayer in Islam?',
          choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
          answer: 'A. Option 1',
          difficulty: 'easy',
          topics: ['worship'],
          explanation: 'Prayer is one of the five pillars of faith'
        }
      ]

      const classifiedQuestions = await generator.classifyTopics(mockQuestions)

      expect(classifiedQuestions).toHaveLength(1)
      expect(classifiedQuestions[0].topics).toContain('worship')
      expect(classifiedQuestions[0].topics).toContain('prayer')
      expect(classifiedQuestions[0].topics).toContain('faith')
    })

    it('should not duplicate existing topics', async () => {
      const mockQuestions: GeneratedQuestion[] = [
        {
          prompt: 'About prayer',
          choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
          answer: 'A. Option 1',
          difficulty: 'easy',
          topics: ['prayer', 'worship'],
          explanation: 'About prayer and worship'
        }
      ]

      const classifiedQuestions = await generator.classifyTopics(mockQuestions)

      const prayerCount = classifiedQuestions[0].topics.filter(t => t === 'prayer').length
      const worshipCount = classifiedQuestions[0].topics.filter(t => t === 'worship').length
      
      expect(prayerCount).toBe(1)
      expect(worshipCount).toBe(1)
    })
  })

  describe('processBatch', () => {
    it('should process multiple verses successfully', async () => {
      const mockVerses = [mockVerse, { ...mockVerse, id: 'verse-2', ayah: 2 }]
      
      const mockResponse = {
        questions: [
          {
            prompt: 'Test question',
            choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
            answer: 'A. Option 1',
            difficulty: 'easy',
            topics: ['test'],
            explanation: 'Test explanation'
          }
        ]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      })

      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })

      const mockFromChain = mockSupabase.from()
      mockFromChain.select.mockResolvedValue({
        data: [{ id: 'question-1' }],
        error: null
      })

      const result = await generator.processBatch(mockVerses)

      expect(result.totalGenerated).toBe(2) // 1 question per verse
      expect(result.saved).toBe(2)
      expect(result.errors).toBe(0)
    })

    it('should handle errors during batch processing', async () => {
      const mockVerses = [mockVerse]
      
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const result = await generator.processBatch(mockVerses)

      expect(result.totalGenerated).toBe(0)
      expect(result.saved).toBe(0)
      expect(result.errors).toBe(1)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should respect rate limits with delays', async () => {
      const mockVerses = [mockVerse, { ...mockVerse, id: 'verse-2', ayah: 2 }]
      
      const mockResponse = {
        questions: [
          {
            prompt: 'Test question',
            choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
            answer: 'A. Option 1',
            difficulty: 'easy',
            topics: ['test'],
            explanation: 'Test explanation'
          }
        ]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      })

      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })

      const mockFromChain = mockSupabase.from()
      mockFromChain.select.mockResolvedValue({
        data: [{ id: 'question-1' }],
        error: null
      })

      const startTime = Date.now()
      const result = await generator.processBatch(mockVerses)
      const endTime = Date.now()

      expect(result.totalGenerated).toBe(2)
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000) // At least 1 second delay
    })
  })

  describe('Question validation', () => {
    it('should validate question structure', () => {
      const generator = new AIQuestionGenerator()
      
      // Access private method for testing
      const isValidQuestion = (generator as any).isValidQuestion.bind(generator)
      
      const validQuestion = {
        prompt: 'Test question?',
        choices: ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'],
        answer: 'A. Option 1',
        difficulty: 'easy'
      }
      
      expect(isValidQuestion(validQuestion)).toBe(true)
      
      const invalidQuestions = [
        { ...validQuestion, prompt: null },
        { ...validQuestion, choices: ['A. Only one'] },
        { ...validQuestion, answer: null },
        { ...validQuestion, difficulty: null }
      ]
      
      invalidQuestions.forEach(invalid => {
        expect(isValidQuestion(invalid)).toBe(false)
      })
    })

    it('should validate and normalize difficulty levels', () => {
      const generator = new AIQuestionGenerator()
      
      // Access private method for testing
      const validateDifficulty = (generator as any).validateDifficulty.bind(generator)
      
      expect(validateDifficulty('easy')).toBe('easy')
      expect(validateDifficulty('medium')).toBe('medium')
      expect(validateDifficulty('hard')).toBe('hard')
      expect(validateDifficulty('invalid')).toBe('medium')
      expect(validateDifficulty(null)).toBe('medium')
    })
  })

  describe('Islamic content validation', () => {
    it('should generate contextually appropriate questions for Islamic content', async () => {
      const mockResponse = {
        questions: [
          {
            prompt: 'What is the meaning of Bismillah?',
            choices: [
              'A. In the name of Allah',
              'B. Praise be to Allah', 
              'C. Allah is Great',
              'D. There is no God but Allah'
            ],
            answer: 'A. In the name of Allah',
            difficulty: 'easy',
            topics: ['Basmala', 'Islamic_phrases'],
            explanation: 'Bismillah means "In the name of Allah" and is the opening of most Quranic chapters.'
          }
        ]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      })

      const questions = await generator.generateQuestionsForVerse(mockVerse, 1)

      expect(questions).toHaveLength(1)
      expect(questions[0].prompt).toContain('Bismillah')
      expect(questions[0].answer).toContain('Allah')
      expect(questions[0].topics).toContain('Basmala')
      expect(questions[0].explanation).toContain('Allah')
    })

    it('should handle Arabic text in questions correctly', async () => {
      const mockResponse = {
        questions: [
          {
            prompt: 'Complete: بِسْمِ _____ الرَّحْمَٰنِ الرَّحِيمِ',
            choices: ['A. اللَّهِ', 'B. الرَّحْمَٰنِ', 'C. الرَّحِيمِ', 'D. العَالَمِينَ'],
            answer: 'A. اللَّهِ',
            difficulty: 'medium',
            topics: ['memorization', 'arabic_vocabulary'],
            explanation: 'The complete verse is Bismillah ar-Rahman ar-Raheem'
          }
        ]
      }

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }]
      })

      const questions = await generator.generateQuestionsForVerse(mockVerse, 1)

      expect(questions[0].prompt).toBeValidArabicText()
      expect(questions[0].choices[0]).toBeValidArabicText()
      expect(questions[0].answer).toBeValidArabicText()
    })
  })
})