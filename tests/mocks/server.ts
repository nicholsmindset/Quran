import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock handlers for API routes
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      }
    })
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      }
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  // Questions endpoints
  http.get('/api/questions/approved', () => {
    return HttpResponse.json([
      {
        id: 'q1',
        question_text: 'What is the first verse of Al-Fatiha?',
        question_type: 'multiple_choice',
        options: [
          'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
          'الرَّحْمَٰنِ الرَّحِيمِ',
          'مَالِكِ يَوْمِ الدِّينِ'
        ],
        correct_answer: 0,
        arabic_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
        surah: 1,
        verse: 1,
        difficulty_level: 'beginner',
        topic: 'Al-Fatiha',
        status: 'approved'
      }
    ])
  }),

  http.get('/api/questions/pending', () => {
    return HttpResponse.json([
      {
        id: 'q2',
        question_text: 'Complete this verse: "وَلَا تَقْرَبُوا..."',
        question_type: 'completion',
        arabic_text: 'وَلَا تَقْرَبُوا الزِّنَا ۖ إِنَّهُ كَانَ فَاحِشَةً وَسَاءَ سَبِيلًا',
        translation: 'And do not approach unlawful sexual intercourse. Indeed, it is ever an immorality and is evil as a way.',
        surah: 17,
        verse: 32,
        difficulty_level: 'intermediate',
        topic: 'Ethics',
        status: 'pending'
      }
    ])
  }),

  // Attempts endpoint
  http.post('/api/attempts', () => {
    return HttpResponse.json({
      id: 'attempt-1',
      user_id: 'test-user-id',
      question_id: 'q1',
      answer: 0,
      is_correct: true,
      created_at: new Date().toISOString()
    })
  }),

  // AI generation endpoints
  http.post('/api/ai/generate-questions', () => {
    return HttpResponse.json({
      questions: [
        {
          question_text: 'What does this verse teach us about patience?',
          question_type: 'multiple_choice',
          options: [
            'Patience is a virtue',
            'Patience is rewarded by Allah',
            'Patience is difficult',
            'All of the above'
          ],
          correct_answer: 3,
          arabic_text: 'وَبَشِّرِ الصَّابِرِينَ',
          translation: 'And give good tidings to the patient',
          surah: 2,
          verse: 155,
          difficulty_level: 'intermediate',
          topic: 'Patience'
        }
      ]
    })
  }),

  // OpenAI API mock
  http.post('https://api.openai.com/v1/embeddings', () => {
    return HttpResponse.json({
      data: [{
        embedding: new Array(1536).fill(0.1), // Mock embedding vector
        index: 0
      }],
      model: 'text-embedding-ada-002',
      usage: { total_tokens: 10 }
    })
  }),

  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [{
        message: {
          content: JSON.stringify([{
            question_text: 'What is the main theme of this verse?',
            question_type: 'multiple_choice',
            options: ['Faith', 'Prayer', 'Charity', 'Patience'],
            correct_answer: 0,
            explanation: 'This verse emphasizes the importance of faith.'
          }])
        }
      }],
      usage: { total_tokens: 100 }
    })
  }),
]

// Setup MSW server
export const server = setupServer(...handlers)