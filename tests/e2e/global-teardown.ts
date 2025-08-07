import { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...')
  
  try {
    // Clean up authentication files
    const authDir = './tests/e2e/auth'
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir)
      for (const file of files) {
        if (file.endsWith('-auth.json')) {
          fs.unlinkSync(path.join(authDir, file))
          console.log(`🗑️ Cleaned up ${file}`)
        }
      }
    }
    
    // Clean up temporary test files
    const tempDir = './tests/temp'
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      console.log('🗑️ Cleaned up temporary test files')
    }
    
    console.log('✅ E2E teardown complete')
  } catch (error) {
    console.error('❌ E2E teardown failed:', error)
  }
}

export default globalTeardown