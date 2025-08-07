import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { createServer } from 'http'
import { server } from './mocks/server'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.NODE_ENV = 'test'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}))

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}))

// Setup MSW server
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error',
  })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

// Custom matchers for Islamic content
expect.extend({
  toBeValidArabicText(received: string) {
    // Check for Arabic Unicode range (U+0600 to U+06FF)
    const arabicRegex = /[\u0600-\u06FF]/
    const pass = typeof received === 'string' && arabicRegex.test(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be valid Arabic text`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be valid Arabic text`,
        pass: false,
      }
    }
  },
  
  toBeValidQuranReference(received: { surah: number; verse: number }) {
    const pass = 
      received && 
      typeof received.surah === 'number' &&
      typeof received.verse === 'number' &&
      received.surah >= 1 && 
      received.surah <= 114 &&
      received.verse >= 1
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid Quran reference`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid Quran reference`,
        pass: false,
      }
    }
  },
  
  toHaveValidIslamicContent(received: any) {
    const hasArabicText = received.arabic_text && typeof received.arabic_text === 'string'
    const hasTranslation = received.translation && typeof received.translation === 'string'
    const hasValidReference = received.surah >= 1 && received.surah <= 114 && received.verse >= 1
    
    const pass = hasArabicText && hasTranslation && hasValidReference
    
    if (pass) {
      return {
        message: () => `expected object not to have valid Islamic content`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected object to have valid Islamic content (arabic_text, translation, valid reference)`,
        pass: false,
      }
    }
  },
})

// Global test configuration
global.console = {
  ...console,
  // Silence console.log in tests unless explicitly enabled
  log: process.env.VERBOSE_TESTS ? console.log : jest.fn(),
  warn: console.warn,
  error: console.error,
}

// Increase timeout for integration tests
jest.setTimeout(30000)