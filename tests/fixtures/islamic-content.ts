// Test fixtures for Islamic content validation and testing

export const VALID_QURAN_VERSES = [
  {
    id: 1,
    surah: 1,
    verse: 1,
    arabic_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    transliteration: 'Bismillahir-Rahmanir-Raheem',
    surah_name: 'Al-Fatiha',
    surah_name_arabic: 'الفاتحة',
    revelation_type: 'Meccan'
  },
  {
    id: 2,
    surah: 1,
    verse: 2,
    arabic_text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    translation: 'All praise is due to Allah, Lord of the worlds',
    transliteration: 'Alhamdulillahi rabbil-alameen',
    surah_name: 'Al-Fatiha',
    surah_name_arabic: 'الفاتحة',
    revelation_type: 'Meccan'
  },
  {
    id: 3,
    surah: 2,
    verse: 255,
    arabic_text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    translation: 'Allah - there is no deity except Him, the Ever-Living, the Self-Sustaining. Neither drowsiness overtakes Him nor sleep.',
    transliteration: 'Allahu la ilaha illa huwal-hayyul-qayyum. La ta\'khuduhu sinatun wa la nawm',
    surah_name: 'Al-Baqarah',
    surah_name_arabic: 'البقرة',
    revelation_type: 'Medinan'
  }
]

export const SAMPLE_QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question_text: 'What is the opening verse of the Quran?',
    question_type: 'multiple_choice',
    options: [
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      'الرَّحْمَٰنِ الرَّحِيمِ',
      'مَالِكِ يَوْمِ الدِّينِ'
    ],
    correct_answer: 0,
    explanation: 'Bismillah is the opening of the Quran and most chapters.',
    arabic_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    surah: 1,
    verse: 1,
    difficulty_level: 'beginner',
    topic: 'Al-Fatiha',
    status: 'approved'
  },
  {
    id: 'q2',
    question_text: 'Complete this verse: "وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ..."',
    question_type: 'completion',
    correct_answer: 'وَحَمَلْنَاهُمْ فِي الْبَرِّ وَالْبَحْرِ',
    explanation: 'This verse speaks about honoring the children of Adam.',
    arabic_text: 'وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ وَحَمَلْنَاهُمْ فِي الْبَرِّ وَالْبَحْرِ',
    translation: 'And We have certainly honored the children of Adam and carried them on the land and sea',
    surah: 17,
    verse: 70,
    difficulty_level: 'intermediate',
    topic: 'Human Dignity',
    status: 'approved'
  },
  {
    id: 'q3',
    question_text: 'Which chapter is known as the "Heart of the Quran"?',
    question_type: 'multiple_choice',
    options: ['Al-Fatiha', 'Ya-Sin', 'Al-Baqarah', 'Al-Ikhlas'],
    correct_answer: 1,
    explanation: 'Surah Ya-Sin is traditionally known as the heart of the Quran.',
    arabic_text: 'يس',
    translation: 'Ya-Sin',
    surah: 36,
    verse: 1,
    difficulty_level: 'intermediate',
    topic: 'Quranic Knowledge',
    status: 'approved'
  }
]

export const SAMPLE_USER_DATA = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      display_name: 'Test User',
      preferred_language: 'en',
      study_level: 'beginner',
      daily_goal: 5,
      streak_count: 0,
      total_questions_answered: 0,
      correct_answers: 0
    }
  },
  moderator: {
    id: 'mod-user-id',
    email: 'moderator@example.com',
    role: 'moderator',
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      display_name: 'Moderator User',
      preferred_language: 'en',
      study_level: 'advanced',
      daily_goal: 10,
      streak_count: 0,
      total_questions_answered: 0,
      correct_answers: 0
    }
  },
  admin: {
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      display_name: 'Admin User',
      preferred_language: 'en',
      study_level: 'expert',
      daily_goal: 15,
      streak_count: 0,
      total_questions_answered: 0,
      correct_answers: 0
    }
  }
}

export const SAMPLE_ATTEMPTS = [
  {
    id: 'attempt-1',
    user_id: 'test-user-id',
    question_id: 'q1',
    answer: 0,
    is_correct: true,
    time_taken: 5000, // 5 seconds
    created_at: '2024-01-01T12:00:00Z'
  },
  {
    id: 'attempt-2',
    user_id: 'test-user-id',
    question_id: 'q2',
    answer: 'incorrect answer',
    is_correct: false,
    time_taken: 10000, // 10 seconds
    created_at: '2024-01-01T12:05:00Z'
  },
  {
    id: 'attempt-3',
    user_id: 'test-user-id',
    question_id: 'q3',
    answer: 1,
    is_correct: true,
    time_taken: 3000, // 3 seconds
    created_at: '2024-01-01T12:10:00Z'
  }
]

export const ARABIC_TEXT_SAMPLES = {
  valid: [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
    'قُلْ هُوَ اللَّهُ أَحَدٌ'
  ],
  invalid: [
    'Hello World',
    '123456',
    'Bismillah',
    ''
  ],
  mixed: [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (In the name of Allah)',
    'Verse: الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    '1:1 بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
  ]
}

export const SURAH_DATA = [
  { number: 1, name: 'Al-Fatiha', arabic_name: 'الفاتحة', verses: 7, revelation: 'Meccan' },
  { number: 2, name: 'Al-Baqarah', arabic_name: 'البقرة', verses: 286, revelation: 'Medinan' },
  { number: 36, name: 'Ya-Sin', arabic_name: 'يس', verses: 83, revelation: 'Meccan' },
  { number: 112, name: 'Al-Ikhlas', arabic_name: 'الإخلاص', verses: 4, revelation: 'Meccan' },
  { number: 114, name: 'An-Nas', arabic_name: 'الناس', verses: 6, revelation: 'Meccan' }
]

// Utility functions for test data
export function createMockQuestion(overrides: Partial<typeof SAMPLE_QUIZ_QUESTIONS[0]> = {}) {
  return {
    ...SAMPLE_QUIZ_QUESTIONS[0],
    id: `q-${Date.now()}`,
    ...overrides
  }
}

export function createMockUser(role: 'user' | 'moderator' | 'admin' = 'user', overrides: any = {}) {
  return {
    ...SAMPLE_USER_DATA[role],
    id: `user-${Date.now()}`,
    ...overrides
  }
}

export function createMockAttempt(overrides: Partial<typeof SAMPLE_ATTEMPTS[0]> = {}) {
  return {
    ...SAMPLE_ATTEMPTS[0],
    id: `attempt-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...overrides
  }
}