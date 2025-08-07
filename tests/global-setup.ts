import { execSync } from 'child_process'

export default async function globalSetup() {
  // Set up test environment
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  process.env.OPENAI_API_KEY = 'test-openai-key'
  
  console.log('🚀 Global test setup complete')
}