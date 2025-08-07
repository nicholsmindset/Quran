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

// Quiz Session Types
export interface DailyQuiz {
  id: string;
  date: string; // YYYY-MM-DD
  questionIds: string[];
  questions?: Question[];
  createdAt: Date;
}

export interface QuizSession {
  id: string;
  userId: string;
  dailyQuizId: string;
  currentQuestionIndex: number;
  answers: { [questionId: string]: string };
  status: 'in_progress' | 'completed' | 'expired';
  startedAt: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  timezone: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in milliseconds
}

export interface QuizResult {
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  answers: QuizAnswer[];
  streakUpdated: boolean;
}

// Quiz Status Types
export interface QuizStatus {
  hasCompletedToday: boolean;
  currentSession?: QuizSession;
  todaysQuiz: DailyQuiz;
  streakInfo: {
    current: number;
    longest: number;
  };
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

// AI Enhancement Types for Sprint 2
export interface QuestionContext {
  id: string;
  questionId: string;
  verseContext: VerseContext;
  tafsirReferences: TafsirReference[];
  historicalBackground: string;
  thematicConnections: string[];
  difficultyFactors: string[];
  createdAt: Date;
}

export interface VerseContext {
  id: string;
  verseId: string;
  revelationContext: string;
  historicalPeriod: 'meccan' | 'medinan';
  occasionOfRevelation?: string;
  relatedVerses: string[];
  mainThemes: string[];
  linguisticFeatures: string[];
}

export interface AIHint {
  id: string;
  questionId: string;
  level: 1 | 2 | 3; // Progressive hint levels
  content: string;
  type: 'vocabulary' | 'context' | 'grammar' | 'theme';
  isRevealing: boolean; // Whether this hint gives away the answer
}

export interface AIExplanation {
  id: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
  additionalContext?: string;
  relatedConcepts: string[];
  furtherReading: string[];
}

export interface PersonalizedRecommendation {
  id: string;
  userId: string;
  type: 'study_plan' | 'topic_focus' | 'difficulty_adjustment' | 'review_schedule';
  title: string;
  description: string;
  actionItems: string[];
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // minutes
  createdAt: Date;
  expiresAt?: Date;
}

export interface UserPerformancePattern {
  userId: string;
  topicStrengths: Record<string, number>; // topic -> proficiency (0-1)
  topicWeaknesses: Record<string, number>;
  difficultyProgression: {
    easy: number;
    medium: number;
    hard: number;
  };
  learningVelocity: number; // questions per day
  retentionRate: number; // 0-1
  consistencyScore: number; // 0-1
  updatedAt: Date;
}

export interface SpacedRepetitionSchedule {
  id: string;
  userId: string;
  questionId: string;
  interval: number; // days until next review
  easeFactor: number; // spaced repetition ease factor
  repetitions: number;
  nextReviewDate: Date;
  lastReviewedAt: Date;
  lastPerformance: 'again' | 'hard' | 'good' | 'easy';
}

export interface LearningAnalytics {
  userId: string;
  totalQuestionsAnswered: number;
  accuracyRate: number;
  averageResponseTime: number;
  knowledgeGaps: string[];
  masteredTopics: string[];
  recommendedStudyTime: number; // minutes per day
  projectedGoalCompletion: Date;
  learningMomentum: 'accelerating' | 'steady' | 'declining';
}

// Teacher Group Management Types (US009-US010)
export interface Group {
  id: string;
  name: string;
  teacherId: string;
  description?: string;
  inviteCode: string;
  inviteCodeExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  teacher?: User;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: 'student' | 'assistant';
  joinedAt: Date;
  user?: User;
  group?: Group;
}

export interface GroupAssignment {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  questionIds: string[];
  dueDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  completionCount?: number;
  totalMembers?: number;
  questions?: Question[];
  group?: Group;
  creator?: User;
}

export interface GroupInvite {
  code: string;
  groupId: string;
  createdBy: string;
  expiresAt: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface GroupProgress {
  groupId: string;
  assignmentId?: string;
  totalMembers: number;
  completedMembers: number;
  averageScore: number;
  completionRate: number;
  overallProgress: StudentProgress[];
}

export interface StudentProgress {
  userId: string;
  studentName: string;
  assignmentsCompleted: number;
  totalAssignments: number;
  averageScore: number;
  lastActivity: Date;
  overallRank?: number;
  user?: User;
}

export interface AssignmentResult {
  id: string;
  assignmentId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in minutes
  completedAt: Date;
  answers: AssignmentAnswer[];
  user?: User;
  assignment?: GroupAssignment;
}

export interface AssignmentAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in milliseconds
}

export interface GroupAnalytics {
  groupId: string;
  totalAssignments: number;
  activeAssignments: number;
  completionRate: number;
  averageScore: number;
  mostDifficultTopics: string[];
  topPerformers: StudentProgress[];
  strugglingStudents: StudentProgress[];
  timeSpentAnalytics: {
    average: number;
    minimum: number;
    maximum: number;
  };
}

// Group Creation Request Types
export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  questionIds: string[];
  dueDate?: string; // ISO string
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

export interface GenerateInviteRequest {
  expiresInHours?: number; // default 48
  maxUses?: number; // unlimited if not specified
}

// Email and Notification Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'system';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  user_id: string;
  daily_reminder: boolean;
  streak_notifications: boolean;
  weekly_progress: boolean;
  moderation_updates: boolean;
  group_activities: boolean;
  system_announcements: boolean;
  marketing_emails: boolean;
  email_frequency: 'immediate' | 'daily_digest' | 'weekly_digest';
  preferred_language: 'en' | 'ar' | 'ur' | 'id' | 'tr' | 'fr';
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string; // HH:MM format
  timezone?: string;
  updatedAt?: Date;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  template_id?: string;
  template_data?: Record<string, any>;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  provider_message_id?: string;
  error_message?: string;
  sent_at: Date;
  delivered_at?: Date;
  opened_at?: Date;
  clicked_at?: Date;
}

export interface NotificationQueue {
  id: string;
  user_id: string;
  type: 'email' | 'push' | 'sms';
  template_id: string;
  template_data: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  scheduled_for: Date;
  attempts: number;
  max_attempts: number;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  last_attempt_at?: Date;
  created_at: Date;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  target_roles: ('learner' | 'teacher' | 'scholar')[];
  is_active: boolean;
  show_until?: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserNotificationSettings {
  user_id: string;
  email_notifications: NotificationPreferences;
  push_notifications?: {
    enabled: boolean;
    device_tokens: string[];
    categories: Record<string, boolean>;
  };
  sms_notifications?: {
    enabled: boolean;
    phone_number?: string;
    categories: Record<string, boolean>;
  };
}
