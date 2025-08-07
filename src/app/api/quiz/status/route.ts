import { NextRequest, NextResponse } from 'next/server';
import type { QuizStatus, DailyQuiz, QuizSession } from '@/types';

// Mock data for demonstration
const mockDailyQuiz: DailyQuiz = {
  id: 'daily-quiz-2024-01-15',
  date: '2024-01-15',
  questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
  createdAt: new Date()
};

const mockCurrentSession: QuizSession = {
  id: 'session-123',
  userId: 'user-1',
  dailyQuizId: 'daily-quiz-2024-01-15',
  currentQuestionIndex: 2,
  answers: {
    'q1': 'the Most Merciful',
    'q2': 'Salah'
  },
  status: 'in_progress',
  startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  lastActivityAt: new Date(),
  timezone: 'UTC'
};

export async function GET(request: NextRequest) {
  // In a real app, you would:
  // 1. Get user from authentication
  // 2. Check if user has completed today's quiz
  // 3. Get any in-progress session
  // 4. Return actual streak data

  // For demo purposes, we'll return different states based on query params
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || 'new'; // new, in_progress, completed

  let quizStatus: QuizStatus;

  switch (state) {
    case 'completed':
      quizStatus = {
        hasCompletedToday: true,
        todaysQuiz: mockDailyQuiz,
        streakInfo: {
          current: 12,
          longest: 28
        }
      };
      break;
    
    case 'in_progress':
      quizStatus = {
        hasCompletedToday: false,
        currentSession: mockCurrentSession,
        todaysQuiz: mockDailyQuiz,
        streakInfo: {
          current: 11,
          longest: 28
        }
      };
      break;
    
    default: // new
      quizStatus = {
        hasCompletedToday: false,
        todaysQuiz: mockDailyQuiz,
        streakInfo: {
          current: 11,
          longest: 28
        }
      };
  }

  return NextResponse.json(quizStatus);
}