import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Browser client for client-side operations
export const createBrowserSupabaseClient = () => {
  // Avoid accessing env or real browser client during SSR/prerender
  if (typeof window === 'undefined') {
    // Minimal no-op mock to allow server-side rendering without env vars
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: null }),
        signUp: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        insert: async () => ({ data: null, error: null }),
      }),
    } as any
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    // In the browser, these MUST be defined. Throw to surface misconfiguration.
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined')
  }
  
  return createBrowserClient(url, anonKey)
}

// Server client for server-side operations with service role key
export const createServerSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  }
  
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }
  
  return createClient(url, serviceKey)
}

// Default export for API routes (server-side)
export { createServerSupabaseClient as createClient }

// Alternative server client export
export const createSupabaseClient = createServerSupabaseClient

// Database types for type safety
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'learner' | 'teacher' | 'scholar'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'learner' | 'teacher' | 'scholar'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'learner' | 'teacher' | 'scholar'
          created_at?: string
        }
      }
      verses: {
        Row: {
          id: string
          surah: number
          ayah: number
          arabic_text: string
          translation_en: string
          created_at: string
        }
        Insert: {
          id?: string
          surah: number
          ayah: number
          arabic_text: string
          translation_en: string
          created_at?: string
        }
        Update: {
          id?: string
          surah?: number
          ayah?: number
          arabic_text?: string
          translation_en?: string
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          verse_id: string
          prompt: string
          choices: string[]
          answer: string
          difficulty: 'easy' | 'medium' | 'hard'
          approved_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          verse_id: string
          prompt: string
          choices: string[]
          answer: string
          difficulty: 'easy' | 'medium' | 'hard'
          approved_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          verse_id?: string
          prompt?: string
          choices?: string[]
          answer?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          approved_at?: string | null
          created_by?: string
          created_at?: string
        }
      }
      attempts: {
        Row: {
          id: string
          user_id: string
          question_id: string
          correct: boolean
          answered_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          correct: boolean
          answered_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          correct?: boolean
          answered_at?: string
        }
      }
      streaks: {
        Row: {
          user_id: string
          current_streak: number
          longest_streak: number
          updated_at: string
        }
        Insert: {
          user_id: string
          current_streak?: number
          longest_streak?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          current_streak?: number
          longest_streak?: number
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          question_id: string
          scholar_id: string
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          question_id: string
          scholar_id: string
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          question_id?: string
          scholar_id?: string
          created_at?: string
        }
      }
      daily_quizzes: {
        Row: {
          id: string
          date: string
          question_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          question_ids: string[]
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          question_ids?: string[]
          created_at?: string
        }
      }
      quiz_sessions: {
        Row: {
          id: string
          user_id: string
          daily_quiz_id: string
          current_question_index: number
          answers: { [key: string]: string }
          status: 'in_progress' | 'completed' | 'expired'
          started_at: string
          completed_at: string | null
          last_activity_at: string
          timezone: string
        }
        Insert: {
          id?: string
          user_id: string
          daily_quiz_id: string
          current_question_index?: number
          answers?: { [key: string]: string }
          status?: 'in_progress' | 'completed' | 'expired'
          started_at?: string
          completed_at?: string | null
          last_activity_at?: string
          timezone: string
        }
        Update: {
          id?: string
          user_id?: string
          daily_quiz_id?: string
          current_question_index?: number
          answers?: { [key: string]: string }
          status?: 'in_progress' | 'completed' | 'expired'
          started_at?: string
          completed_at?: string | null
          last_activity_at?: string
          timezone?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          teacher_id: string
          description: string | null
          invite_code: string
          invite_code_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          teacher_id: string
          description?: string | null
          invite_code?: string
          invite_code_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          teacher_id?: string
          description?: string | null
          invite_code?: string
          invite_code_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      group_memberships: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'student' | 'assistant'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'student' | 'assistant'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'student' | 'assistant'
          joined_at?: string
        }
      }
      group_assignments: {
        Row: {
          id: string
          group_id: string
          title: string
          description: string | null
          question_ids: string[]
          due_date: string | null
          created_by: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          description?: string | null
          question_ids: string[]
          due_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          description?: string | null
          question_ids?: string[]
          due_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      group_invites: {
        Row: {
          code: string
          group_id: string
          created_by: string
          expires_at: string
          max_uses: number | null
          current_uses: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          code: string
          group_id: string
          created_by: string
          expires_at: string
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          group_id?: string
          created_by?: string
          expires_at?: string
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
          created_at?: string
        }
      }
      assignment_results: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          score: number
          total_questions: number
          correct_answers: number
          time_spent: number
          completed_at: string
          answers: any // JSON array of AssignmentAnswer
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          score: number
          total_questions: number
          correct_answers: number
          time_spent: number
          completed_at?: string
          answers: any
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          score?: number
          total_questions?: number
          correct_answers?: number
          time_spent?: number
          completed_at?: string
          answers?: any
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'learner' | 'teacher' | 'scholar'
      difficulty_level: 'easy' | 'medium' | 'hard'
      quiz_session_status: 'in_progress' | 'completed' | 'expired'
      group_member_role: 'student' | 'assistant'
    }
  }
}