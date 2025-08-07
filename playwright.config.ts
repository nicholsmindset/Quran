import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: './tests/reports/playwright-html' }],
    ['json', { outputFile: './tests/reports/playwright-results.json' }],
    ['junit', { outputFile: './tests/reports/playwright-junit.xml' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Capture console logs */
    launchOptions: {
      slowMo: process.env.CI ? 0 : 100,
    },
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable permissions for notifications, clipboard, etc.
        permissions: ['clipboard-read', 'clipboard-write'],
        // Set viewport for consistent testing
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Important for testing Arabic text rendering on mobile
        locale: 'ar-SA',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        locale: 'ar-SA',
      },
      dependencies: ['setup'],
    },

    /* Accessibility testing project */
    {
      name: 'accessibility',
      testMatch: /.*\.accessibility\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },

    /* Performance testing project */
    {
      name: 'performance',
      testMatch: /.*\.performance\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // Slower network for performance testing
        launchOptions: {
          args: ['--disable-dev-shm-usage', '--no-sandbox'],
        },
      },
      dependencies: ['setup'],
    },

    /* Arabic/RTL testing project */
    {
      name: 'arabic-rtl',
      testMatch: /.*\.arabic\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        locale: 'ar-SA',
        viewport: { width: 1280, height: 720 },
        // Test RTL layout
        extraHTTPHeaders: {
          'Accept-Language': 'ar,ar-SA;q=0.9,en;q=0.8'
        },
      },
      dependencies: ['setup'],
    },
  ],

  /* Folder for test artifacts */
  outputDir: './tests/reports/playwright-artifacts',
  
  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      // Test environment variables
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key',
    },
  },

  /* Test timeout */
  timeout: 30000,
  
  /* Global test setup */
  expect: {
    // Increase timeout for accessibility checks
    timeout: 10000,
    // Custom screenshot comparisons for Arabic text
    toHaveScreenshot: {
      mode: 'strict',
      animations: 'disabled',
    },
  },
})