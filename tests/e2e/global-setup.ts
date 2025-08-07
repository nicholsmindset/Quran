import { chromium, FullConfig } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')
  
  // Start development server if not already running
  if (!process.env.CI && !process.env.PLAYWRIGHT_SKIP_SERVER_START) {
    console.log('🌐 Checking if development server is running...')
    
    try {
      const response = await fetch('http://localhost:3000')
      console.log('✅ Development server is already running')
    } catch (error) {
      console.log('⚠️ Development server not running, please start it manually with: npm run dev')
      process.exit(1)
    }
  }
  
  // Setup test data
  console.log('📊 Setting up test data...')
  
  // Create a browser instance for setup tasks
  const browser = await chromium.launch()
  const context = await browser.newContext({
    baseURL: config.projects[0].use?.baseURL || 'http://localhost:3000',
  })
  const page = await context.newPage()
  
  try {
    // Wait for the app to be ready
    await page.goto('/')
    await page.waitForSelector('body', { timeout: 10000 })
    
    // Setup authentication state for different user types
    await setupAuthStates(context)
    
    console.log('✅ E2E setup complete')
  } catch (error) {
    console.error('❌ E2E setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupAuthStates(context: any) {
  console.log('🔐 Setting up authentication states...')
  
  // Create authenticated user state
  const page = await context.newPage()
  
  try {
    // Navigate to auth page
    await page.goto('/auth')
    
    // Fill in test user credentials and login
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for successful login
    await page.waitForURL('/dashboard', { timeout: 10000 })
    
    // Save authenticated state
    await context.storageState({ 
      path: './tests/e2e/auth/user-auth.json' 
    })
    
    console.log('✅ User authentication state saved')
    
    // Logout and setup moderator state
    await page.goto('/auth')
    await page.fill('[data-testid="email-input"]', 'moderator@example.com')
    await page.fill('[data-testid="password-input"]', 'modpassword123')
    await page.click('[data-testid="login-button"]')
    
    await page.waitForURL('/dashboard', { timeout: 10000 })
    
    await context.storageState({ 
      path: './tests/e2e/auth/moderator-auth.json' 
    })
    
    console.log('✅ Moderator authentication state saved')
    
  } catch (error) {
    console.warn('⚠️ Could not setup authentication states (this is expected for fresh installs)')
    console.warn('Please ensure test users exist in your database')
  } finally {
    await page.close()
  }
}

export default globalSetup