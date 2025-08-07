// User and Authentication Types
export interface User {
  id: string;
  email: string;
  role: 'learner' | 'teacher' | 'scholar';
  createdAt: Date;
}

// Qur'an Verse Types
export interface Verse {
  id: string;
  surah: number;
  ayah: number;
  arabicText: string;
  translationEn: string;
}

// Quiz and Questions Types
export interface Question {
  id: string;
  verseId: string;
  prompt: string;
  choices: string[];
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  approvedAt?: Date;
}

export interface Attempt {
  id: string;
  userId: string;
  questionId: string;
  correct: boolean;
  answeredAt: Date;
}

// Progress and Streaks Types
export interface UserProgress {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component Props Types
export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export interface QuizProps {
  questions: Question[];
  onComplete: (results: Attempt[]) => void;
}
