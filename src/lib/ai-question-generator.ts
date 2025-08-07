import OpenAI from 'openai';
import { createServerSupabaseClient } from './supabase';
import type { Database } from './supabase';

type Verse = Database['public']['Tables']['verses']['Row'];
type QuestionInsert = Database['public']['Tables']['questions']['Insert'];

// Configure OpenAI client - handle missing API key gracefully during build
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface GeneratedQuestion {
  prompt: string;
  choices: string[];
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  explanation: string;
}

export interface QuestionGenerationConfig {
  batchSize: number;
  maxQuestionsPerVerse: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypes: ('mcq' | 'fill_blank')[];
}

const DEFAULT_CONFIG: QuestionGenerationConfig = {
  batchSize: 50,
  maxQuestionsPerVerse: 2,
  difficultyDistribution: {
    easy: 0.4,
    medium: 0.4,
    hard: 0.2,
  },
  questionTypes: ['mcq', 'fill_blank'],
};

/**
 * Comprehensive AI Question Generator for Quranic verses
 * Generates MCQ and fill-in-the-blank questions with embeddings
 */
export class AIQuestionGenerator {
  private config: QuestionGenerationConfig;
  private supabase = createServerSupabaseClient();

  constructor(config: Partial<QuestionGenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate questions from a single verse
   */
  async generateQuestionsForVerse(
    verse: Verse,
    count: number = 2
  ): Promise<GeneratedQuestion[]> {
    try {
      const questions: GeneratedQuestion[] = [];
      
      // Generate MCQ questions
      const mcqQuestions = await this.generateMCQQuestions(verse, Math.ceil(count / 2));
      questions.push(...mcqQuestions);

      // Generate fill-in-the-blank questions
      const fillBlankQuestions = await this.generateFillBlankQuestions(
        verse,
        Math.floor(count / 2)
      );
      questions.push(...fillBlankQuestions);

      return questions.slice(0, count);
    } catch (error) {
      console.error(`Error generating questions for verse ${verse.surah}:${verse.ayah}:`, error);
      return [];
    }
  }

  /**
   * Generate Multiple Choice Questions using GPT-4o
   */
  private async generateMCQQuestions(verse: Verse, count: number): Promise<GeneratedQuestion[]> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    const prompt = this.createMCQPrompt(verse);
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an Islamic education expert specializing in Quranic studies. Generate high-quality multiple choice questions that test understanding of Quranic verses. 

CRITICAL REQUIREMENTS:
1. Questions must be factually accurate - no hallucinations
2. Respect Islamic terminology and context
3. Create meaningful distractors that test understanding
4. Include topics/themes for categorization
5. Provide brief explanations for answers
6. Maintain educational value and Islamic respect

Response format must be valid JSON array.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for accuracy
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response);
      return this.validateAndProcessQuestions(parsed.questions || [], verse);
    } catch (error) {
      console.error('Error generating MCQ questions:', error);
      return [];
    }
  }

  /**
   * Generate Fill-in-the-blank Questions
   */
  private async generateFillBlankQuestions(verse: Verse, count: number): Promise<GeneratedQuestion[]> {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    const prompt = this.createFillBlankPrompt(verse);
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an Islamic education expert creating fill-in-the-blank questions for Quranic memorization. Generate questions that test Arabic word recognition and verse memorization.

CRITICAL REQUIREMENTS:
1. Remove key Arabic words from the original text
2. Provide 4 choice options including the correct word
3. Focus on meaningful words (not particles)
4. Include Arabic diacritics correctly
5. Test memorization accuracy
6. Maintain Uthmani script integrity

Response format must be valid JSON array.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response);
      return this.validateAndProcessQuestions(parsed.questions || [], verse);
    } catch (error) {
      console.error('Error generating fill-blank questions:', error);
      return [];
    }
  }

  /**
   * Create MCQ generation prompt
   */
  private createMCQPrompt(verse: Verse): string {
    return `Generate 2 multiple choice questions for this Quranic verse:

**Surah ${verse.surah}, Ayah ${verse.ayah}**
Arabic: ${verse.arabic_text}
English: ${verse.translation_en}

Generate questions that test:
1. Understanding of the verse meaning
2. Context and themes
3. Key concepts and vocabulary

For each question, provide:
- A clear question prompt
- 4 answer choices (A, B, C, D)
- The correct answer
- Difficulty level (easy/medium/hard)
- Topics/themes (array of strings)
- Brief explanation of the correct answer

Return JSON format:
{
  "questions": [
    {
      "prompt": "Question text here?",
      "choices": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "answer": "A. Option 1",
      "difficulty": "easy",
      "topics": ["theme1", "theme2"],
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}`;
  }

  /**
   * Create fill-in-the-blank generation prompt
   */
  private createFillBlankPrompt(verse: Verse): string {
    return `Generate 1 fill-in-the-blank question for this Quranic verse:

**Surah ${verse.surah}, Ayah ${verse.ayah}**
Arabic: ${verse.arabic_text}
English: ${verse.translation_en}

Instructions:
1. Remove one key Arabic word from the verse (not particles like و، في، إلى)
2. Create the prompt with a blank: "Complete the verse: [verse with _____ blank]"
3. Provide 4 Arabic word options including the correct one
4. Focus on meaningful words that test memorization

Return JSON format:
{
  "questions": [
    {
      "prompt": "Complete the verse: [verse with blank]",
      "choices": ["A. Arabic word 1", "B. Arabic word 2", "C. Arabic word 3", "D. Arabic word 4"],
      "answer": "A. Arabic word 1",
      "difficulty": "medium",
      "topics": ["memorization", "arabic_vocabulary"],
      "explanation": "This word means X and fits the context because Y"
    }
  ]
}`;
  }

  /**
   * Validate and process generated questions
   */
  private validateAndProcessQuestions(questions: any[], verse: Verse): GeneratedQuestion[] {
    return questions
      .filter(q => this.isValidQuestion(q))
      .map(q => ({
        prompt: q.prompt,
        choices: Array.isArray(q.choices) ? q.choices : [],
        answer: q.answer,
        difficulty: this.validateDifficulty(q.difficulty),
        topics: Array.isArray(q.topics) ? q.topics : [],
        explanation: q.explanation || ''
      }));
  }

  /**
   * Validate question structure
   */
  private isValidQuestion(question: any): boolean {
    return (
      typeof question.prompt === 'string' &&
      Array.isArray(question.choices) &&
      question.choices.length === 4 &&
      typeof question.answer === 'string' &&
      typeof question.difficulty === 'string'
    );
  }

  /**
   * Validate difficulty level
   */
  private validateDifficulty(difficulty: string): 'easy' | 'medium' | 'hard' {
    if (['easy', 'medium', 'hard'].includes(difficulty)) {
      return difficulty as 'easy' | 'medium' | 'hard';
    }
    return 'medium';
  }

  /**
   * Generate embeddings for questions
   */
  async generateEmbeddings(questions: GeneratedQuestion[]): Promise<number[][]> {
    if (!openai) {
      console.warn('OpenAI API key not configured - returning zero embeddings');
      return questions.map(() => new Array(1536).fill(0));
    }
    
    try {
      const texts = questions.map(q => `${q.prompt} ${q.choices.join(' ')} ${q.topics.join(' ')}`);
      
      const embeddings: number[][] = [];
      
      // Process in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        });

        const batchEmbeddings = response.data.map(item => item.embedding);
        embeddings.push(...batchEmbeddings);
      }

      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      // Return zero vectors as fallback
      return questions.map(() => new Array(1536).fill(0));
    }
  }

  /**
   * Save questions to moderation queue
   */
  async saveQuestionsToModerationQueue(
    questions: GeneratedQuestion[],
    verse: Verse,
    embeddings: number[][],
    createdBy: string = 'ai-generator'
  ): Promise<string[]> {
    try {
      const questionInserts: (QuestionInsert & { topics?: string[], explanation?: string, embedding?: number[] })[] = 
        questions.map((q, index) => ({
          verse_id: verse.id,
          prompt: q.prompt,
          choices: q.choices,
          answer: q.answer,
          difficulty: q.difficulty,
          created_by: createdBy,
          topics: q.topics,
          explanation: q.explanation,
          embedding: embeddings[index] || new Array(1536).fill(0),
          approved_at: null, // Sent to moderation queue
        }));

      const { data, error } = await this.supabase
        .from('questions')
        .insert(questionInserts)
        .select('id');

      if (error) {
        throw error;
      }

      return data?.map(q => q.id) || [];
    } catch (error) {
      console.error('Error saving questions to moderation queue:', error);
      return [];
    }
  }

  /**
   * Topic classification using embeddings similarity
   */
  async classifyTopics(questions: GeneratedQuestion[]): Promise<GeneratedQuestion[]> {
    const commonTopics = [
      'faith', 'prayer', 'charity', 'fasting', 'pilgrimage',
      'forgiveness', 'guidance', 'creation', 'afterlife', 'prophets',
      'worship', 'morality', 'justice', 'mercy', 'patience'
    ];

    return questions.map(question => {
      // Extract topics from content using simple keyword matching
      // This could be enhanced with more sophisticated NLP
      const contentLower = `${question.prompt} ${question.explanation}`.toLowerCase();
      const detectedTopics = commonTopics.filter(topic => 
        contentLower.includes(topic) || 
        question.topics.some(t => t.toLowerCase().includes(topic))
      );

      return {
        ...question,
        topics: [...new Set([...question.topics, ...detectedTopics])]
      };
    });
  }

  /**
   * Batch process verses for question generation
   */
  async processBatch(verses: Verse[]): Promise<{
    totalGenerated: number;
    saved: number;
    errors: number;
  }> {
    let totalGenerated = 0;
    let saved = 0;
    let errors = 0;

    for (const verse of verses) {
      try {
        console.log(`Processing verse ${verse.surah}:${verse.ayah}`);
        
        const questions = await this.generateQuestionsForVerse(
          verse,
          this.config.maxQuestionsPerVerse
        );

        if (questions.length === 0) {
          errors++;
          continue;
        }

        // Classify topics
        const classifiedQuestions = await this.classifyTopics(questions);
        
        // Generate embeddings
        const embeddings = await this.generateEmbeddings(classifiedQuestions);
        
        // Save to moderation queue
        const questionIds = await this.saveQuestionsToModerationQueue(
          classifiedQuestions,
          verse,
          embeddings
        );

        totalGenerated += questions.length;
        saved += questionIds.length;

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing verse ${verse.surah}:${verse.ayah}:`, error);
        errors++;
      }
    }

    return { totalGenerated, saved, errors };
  }
}