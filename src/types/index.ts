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
  rejectedAt?: Date;
  createdAt: Date;
  createdBy: string;
  moderatedBy?: string;
  moderationNotes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  priority: 'low' | 'medium' | 'high';
  categoryTags?: string[];
  arabicAccuracy?: 'verified' | 'needs_review' | 'corrected';
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

// Scholar Moderation Types
export interface ModerationAction {
  id: string;
  questionId: string;
  scholarId: string;
  action: 'approve' | 'reject' | 'edit' | 'flag';
  notes?: string;
  changes?: Record<string, any>;
  createdAt: Date;
}

export interface ModerationBatch {
  id: string;
  scholarId: string;
  questionIds: string[];
  status: 'pending' | 'in_progress' | 'completed';
  deadline: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface ScholarStats {
  id: string;
  scholarId: string;
  totalReviewed: number;
  approved: number;
  rejected: number;
  edited: number;
  avgProcessingTime: number;
  currentSLA: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface ArabicValidation {
  text: string;
  isValid: boolean;
  corrections?: string;
  diacritics: 'present' | 'partial' | 'missing';
  script: 'uthmani' | 'standard' | 'mixed';
}

export interface TafsirReference {
  source: string;
  scholar: string;
  explanation: string;
  relevantQuotes?: string[];
  isAuthentic: boolean;
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

export interface ModerationQueueProps {
  questions: Question[];
  onModerate: (questionId: string, action: ModerationAction) => void;
  scholar: User;
}

export interface QuestionReviewProps {
  question: Question;
  verse: Verse;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  onEdit: (changes: Partial<Question>, notes?: string) => void;
  onFlag: (concern: string) => void;
}
