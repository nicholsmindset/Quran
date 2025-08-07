import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Browser client for client-side operations
export const createBrowserSupabaseClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Server client for server-side operations with service role key
export const createServerSupabaseClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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
    }
  }
}