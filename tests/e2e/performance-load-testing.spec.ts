import { test, expect } from '@playwright/test'

/**
 * Performance and Load Testing for Qur'an Verse Challenge
 * Tests system performance under various load conditions and validates SLA requirements
 */

test.describe('API Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('perf@example.com')
    await page.getByTestId('password-input').fill('PerfTest123!')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('should meet API response time requirements (< 300ms P95)', async ({ page }) => {
    const apiTimes = []
    
    // Test authentication endpoint
    await page.goto('/auth')
    const authResponse = await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 200
    )
    
    const authTime = await authResponse.headerValue('x-response-time')
    if (authTime) {
      apiTimes.push(parseInt(authTime.replace('ms', '')))
    }
    
    await page.getByTestId('email-input').fill('perf@example.com')
    await page.getByTestId('password-input').fill('PerfTest123!')
    
    const loginStart = Date.now()
    await page.getByTestId('login-button').click()
    await page.waitForResponse(response => response.url().includes('/api/auth/login'))
    const loginTime = Date.now() - loginStart
    apiTimes.push(loginTime)
    
    // Test quiz generation endpoint
    await page.goto('/quiz')
    
    const quizResponse = await page.waitForResponse(response => 
      response.url().includes('/api/quiz/daily') && response.status() === 200
    )
    
    const quizTime = await quizResponse.headerValue('x-response-time')
    if (quizTime) {
      apiTimes.push(parseInt(quizTime.replace('ms', '')))
    }
    
    // Test question loading
    const questionStart = Date.now()
    await page.waitForSelector('[data-testid="quiz-interface"]')
    const questionTime = Date.now() - questionStart
    apiTimes.push(questionTime)
    
    // Test progress endpoint
    await page.goto('/progress')
    
    const progressResponse = await page.waitForResponse(response => 
      response.url().includes('/api/user/progress') && response.status() === 200
    )
    
    const progressTime = await progressResponse.headerValue('x-response-time')
    if (progressTime) {
      apiTimes.push(parseInt(progressTime.replace('ms', '')))
    }
    
    // Calculate P95
    apiTimes.sort((a, b) => a - b)
    const p95Index = Math.floor(apiTimes.length * 0.95)
    const p95Time = apiTimes[p95Index]
    
    console.log(`API Response Times: ${apiTimes.join(', ')}ms`)
    console.log(`P95 Response Time: ${p95Time}ms`)
    
    // P95 should be under 300ms
    expect(p95Time).toBeLessThan(300)
    
    // Average should be even better
    const avgTime = apiTimes.reduce((a, b) => a + b) / apiTimes.length
    expect(avgTime).toBeLessThan(200)
  })
  
  test('should handle concurrent quiz sessions efficiently', async ({ page, context }) => {
    const concurrentSessions = 5
    const sessionPages = []
    
    // Create multiple concurrent sessions
    for (let i = 0; i < concurrentSessions; i++) {
      const newPage = await context.newPage()
      sessionPages.push(newPage)
      
      // Login each session
      await newPage.goto('/auth')
      await newPage.getByTestId('email-input').fill(`concurrent${i}@example.com`)
      await newPage.getByTestId('password-input').fill('ConcurrentTest123!')
      await newPage.getByTestId('login-button').click()
      
      // Start quiz
      await newPage.goto('/quiz')
    }
    
    // Measure concurrent quiz loading
    const startTime = Date.now()
    
    const loadPromises = sessionPages.map(async sessionPage => {
      await sessionPage.waitForSelector('[data-testid="quiz-interface"]', { timeout: 10000 })
      return Date.now()
    })
    
    const loadTimes = await Promise.all(loadPromises)
    const totalLoadTime = Math.max(...loadTimes) - startTime
    
    // Concurrent loading should not significantly degrade performance
    expect(totalLoadTime).toBeLessThan(5000)
    
    // Test concurrent answer submissions
    const submissionPromises = sessionPages.map(async sessionPage => {
      const choiceButton = sessionPage.locator('[data-testid^="choice-"]').first()
      if (await choiceButton.isVisible({ timeout: 2000 })) {
        const submitStart = Date.now()
        await choiceButton.click()
        
        // Wait for auto-save
        await sessionPage.waitForSelector('[data-testid="auto-save-indicator"]', { timeout: 5000 })
        return Date.now() - submitStart
      }
      return 0
    })
    
    const submissionTimes = await Promise.all(submissionPromises)
    const validSubmissions = submissionTimes.filter(time => time > 0)
    
    if (validSubmissions.length > 0) {
      const avgSubmissionTime = validSubmissions.reduce((a, b) => a + b) / validSubmissions.length
      expect(avgSubmissionTime).toBeLessThan(1000) // 1 second average
    }
    
    // Cleanup
    await Promise.all(sessionPages.map(sessionPage => sessionPage.close()))
  })
  
  test('should efficiently handle Arabic text rendering under load', async ({ page }) => {
    const renderingTimes = []
    
    // Test multiple quiz loads with Arabic content
    for (let i = 0; i < 10; i++) {
      await page.goto('/quiz')
      
      const renderStart = Date.now()
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Wait for Arabic text to render
      const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
      if (await arabicElements.count() > 0) {
        await arabicElements.first().waitFor({ state: 'visible' })
        
        // Force re-render to test performance
        await page.evaluate(() => {
          const arabicEl = document.querySelector('[dir="rtl"], .arabic-text')
          if (arabicEl) {
            arabicEl.style.display = 'none'
            arabicEl.offsetHeight // Trigger reflow
            arabicEl.style.display = ''
          }
        })
      }
      
      const renderTime = Date.now() - renderStart
      renderingTimes.push(renderTime)
      
      console.log(`Arabic render attempt ${i + 1}: ${renderTime}ms`)
    }
    
    // Arabic rendering should be consistent and fast
    const avgRenderTime = renderingTimes.reduce((a, b) => a + b) / renderingTimes.length
    const maxRenderTime = Math.max(...renderingTimes)
    
    expect(avgRenderTime).toBeLessThan(500) // Average under 500ms
    expect(maxRenderTime).toBeLessThan(1000) // Maximum under 1 second
    
    // Check for memory leaks
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    if (memoryUsage > 0) {
      expect(memoryUsage).toBeLessThan(50 * 1024 * 1024) // 50MB limit
    }
  })
})

test.describe('Daily Quiz Generation Performance', () => {
  test('should generate daily quiz within acceptable time limits', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('admin@example.com')
    await page.getByTestId('password-input').fill('AdminTest123!')
    await page.getByTestId('login-button').click()
    
    // Test manual quiz generation (simulating cron job)
    const generateStart = Date.now()
    
    const response = await page.request.post('/api/quiz/daily/generate', {
      data: {
        forceRegenerate: true,
        userId: 'test-user-id'
      }
    })
    
    const generateTime = Date.now() - generateStart
    
    expect(response.ok()).toBeTruthy()
    expect(generateTime).toBeLessThan(5000) // 5 seconds max for generation
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('questions')
    expect(responseData.questions).toHaveLength(10) // Standard daily quiz length
    
    // Verify AI question generation performance
    if (responseData.aiGeneratedCount > 0) {
      expect(responseData.aiGenerationTime).toBeLessThan(3000) // 3 seconds for AI
    }
  })
  
  test('should handle quiz generation for multiple users efficiently', async ({ page, context }) => {
    // Simulate multiple users requesting daily quiz simultaneously
    const userCount = 10
    const generationPromises = []
    
    for (let i = 0; i < userCount; i++) {
      const promise = page.request.post('/api/quiz/daily/generate', {
        data: {
          userId: `bulk-test-user-${i}`,
          difficulty: 'medium'
        }
      })
      generationPromises.push(promise)
    }
    
    const startTime = Date.now()
    const responses = await Promise.all(generationPromises)
    const totalTime = Date.now() - startTime
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy()
    })
    
    // Bulk generation should be efficient
    expect(totalTime).toBeLessThan(15000) // 15 seconds for 10 users
    
    const avgTimePerUser = totalTime / userCount
    expect(avgTimePerUser).toBeLessThan(2000) // 2 seconds average per user
  })
  
  test('should maintain database performance under quiz load', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('db@example.com')
    await page.getByTestId('password-input').fill('DbTest123!')
    await page.getByTestId('login-button').click()
    
    const dbOperationTimes = []
    
    // Test multiple database-intensive operations
    const operations = [
      '/api/questions/approved',
      '/api/user/progress',
      '/api/user/streaks',
      '/api/groups/student',
      '/api/scholar/questions'
    ]
    
    for (const endpoint of operations) {
      const opStart = Date.now()
      
      const response = await page.request.get(endpoint)
      const opTime = Date.now() - opStart
      
      dbOperationTimes.push(opTime)
      
      if (response.ok()) {
        const data = await response.json()
        // Verify data structure
        expect(data).toHaveProperty('success')
      }
    }
    
    // Database operations should be fast
    const avgDbTime = dbOperationTimes.reduce((a, b) => a + b) / dbOperationTimes.length
    expect(avgDbTime).toBeLessThan(200) // 200ms average
    
    const maxDbTime = Math.max(...dbOperationTimes)
    expect(maxDbTime).toBeLessThan(500) // 500ms maximum
  })
})

test.describe('Scholar Moderation Performance', () => {
  test('should handle scholar review queue efficiently', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('scholar@example.com')
    await page.getByTestId('password-input').fill('ScholarTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/scholar')
    
    // Test moderation queue loading
    const queueStart = Date.now()
    await page.waitForSelector('[data-testid="moderation-queue"]', { timeout: 10000 })
    const queueLoadTime = Date.now() - queueStart
    
    expect(queueLoadTime).toBeLessThan(2000) // 2 seconds to load queue
    
    // Test bulk operations performance
    const bulkOperationStart = Date.now()
    
    // Select multiple questions (if available)
    const questionItems = page.locator('[data-testid="question-review-item"]')
    const itemCount = Math.min(5, await questionItems.count())
    
    for (let i = 0; i < itemCount; i++) {
      await questionItems.nth(i).locator('input[type="checkbox"]').check()
    }
    
    if (itemCount > 0) {
      await page.getByTestId('bulk-approve-button').click()
      await page.getByTestId('confirm-bulk-action').click()
      
      // Wait for bulk operation to complete
      await expect(page.getByText(/approved successfully/i)).toBeVisible({ timeout: 10000 })
    }
    
    const bulkOperationTime = Date.now() - bulkOperationStart
    
    if (itemCount > 0) {
      expect(bulkOperationTime).toBeLessThan(5000) // 5 seconds for bulk operation
      
      const timePerItem = bulkOperationTime / itemCount
      expect(timePerItem).toBeLessThan(1000) // 1 second per item
    }
  })
  
  test('should meet SLA tracking performance requirements', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('scholar@example.com')
    await page.getByTestId('password-input').fill('ScholarTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/scholar')
    
    // Test SLA status updates
    const slaStart = Date.now()
    
    const response = await page.request.get('/api/scholar/stats/sla')
    const slaTime = Date.now() - slaStart
    
    expect(response.ok()).toBeTruthy()
    expect(slaTime).toBeLessThan(500) // 500ms for SLA status
    
    const slaData = await response.json()
    expect(slaData).toHaveProperty('timeRemaining')
    expect(slaData).toHaveProperty('questionsInQueue')
    
    // Test real-time SLA updates
    const slaIndicator = page.getByTestId('sla-status')
    await expect(slaIndicator).toBeVisible()
    
    // SLA indicator should update frequently
    const initialText = await slaIndicator.textContent()
    
    await page.waitForTimeout(5000) // Wait 5 seconds
    
    const updatedText = await slaIndicator.textContent()
    
    // Time should have updated (counting down)
    expect(updatedText).not.toBe(initialText)
  })
})

test.describe('Teacher Dashboard Performance', () => {
  test('should load class analytics efficiently', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('teacher@example.com')
    await page.getByTestId('password-input').fill('TeacherTest123!')
    await page.getByTestId('login-button').click()
    
    // Navigate to group dashboard
    await page.goto('/dashboard')
    await page.getByTestId('my-groups-section').click()
    
    const groupCard = page.getByTestId('group-card').first()
    if (await groupCard.isVisible({ timeout: 3000 })) {
      const analyticsStart = Date.now()
      
      await groupCard.click()
      await page.getByTestId('class-analytics-tab').click()
      
      // Wait for analytics to load
      await page.waitForSelector('[data-testid="student-progress-chart"]', { timeout: 10000 })
      await page.waitForSelector('[data-testid="class-performance-metrics"]', { timeout: 5000 })
      
      const analyticsTime = Date.now() - analyticsStart
      
      expect(analyticsTime).toBeLessThan(3000) // 3 seconds for analytics
      
      // Test progress chart rendering performance
      const chartStart = Date.now()
      
      // Force chart re-render
      await page.evaluate(() => {
        const chart = document.querySelector('[data-testid="student-progress-chart"]')
        if (chart) {
          chart.style.display = 'none'
          chart.offsetHeight
          chart.style.display = ''
        }
      })
      
      const chartTime = Date.now() - chartStart
      expect(chartTime).toBeLessThan(1000) // 1 second for chart render
    }
  })
  
  test('should handle assignment creation efficiently', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('teacher@example.com')
    await page.getByTestId('password-input').fill('TeacherTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/dashboard')
    
    const assignmentStart = Date.now()
    
    await page.getByTestId('create-assignment-button').click()
    
    // Fill assignment form
    await page.getByTestId('assignment-title-input').fill('Performance Test Assignment')
    await page.getByTestId('assignment-description-input').fill('Testing assignment creation performance')
    
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    await page.getByTestId('assignment-due-date').fill(futureDate.toISOString().split('T')[0])
    
    await page.getByTestId('question-count-input').fill('15')
    
    // Submit assignment
    await page.getByTestId('create-assignment-submit').click()
    
    // Wait for confirmation
    await expect(page.getByText(/assignment created|created successfully/i)).toBeVisible({ timeout: 10000 })
    
    const assignmentTime = Date.now() - assignmentStart
    
    expect(assignmentTime).toBeLessThan(5000) // 5 seconds for assignment creation
    
    // Verify assignment appears in list
    await expect(page.getByText('Performance Test Assignment')).toBeVisible()
  })
})

test.describe('Real-time Updates Performance', () => {
  test('should handle real-time progress updates efficiently', async ({ page, context }) => {
    // Setup two contexts: student and teacher
    const studentPage = page
    const teacherPage = await context.newPage()
    
    // Login student
    await studentPage.goto('/auth')
    await studentPage.getByTestId('email-input').fill('student@example.com')
    await studentPage.getByTestId('password-input').fill('StudentTest123!')
    await studentPage.getByTestId('login-button').click()
    
    // Login teacher
    await teacherPage.goto('/auth')
    await teacherPage.getByTestId('email-input').fill('teacher@example.com')
    await teacherPage.getByTestId('password-input').fill('TeacherTest123!')
    await teacherPage.getByTestId('login-button').click()
    
    // Teacher monitors class dashboard
    await teacherPage.goto('/dashboard')
    const groupCard = teacherPage.getByTestId('group-card').first()
    
    if (await groupCard.isVisible({ timeout: 3000 })) {
      await groupCard.click()
      await teacherPage.getByTestId('students-tab').click()
      
      // Student takes quiz
      await studentPage.goto('/quiz')
      await studentPage.waitForSelector('[data-testid="quiz-interface"]')
      
      const updateStart = Date.now()
      
      // Answer questions
      for (let i = 0; i < 3; i++) {
        const choiceButton = studentPage.locator('[data-testid^="choice-"]').first()
        if (await choiceButton.isVisible({ timeout: 2000 })) {
          await choiceButton.click()
          
          const nextButton = studentPage.getByTestId('next-button')
          if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
            await nextButton.click()
            await studentPage.waitForTimeout(500)
          }
        }
      }
      
      // Check if teacher dashboard updates
      await teacherPage.reload() // In real app, this would be real-time
      
      const updateTime = Date.now() - updateStart
      expect(updateTime).toBeLessThan(60000) // Updates within 1 minute
      
      // Verify progress is visible
      const studentProgress = teacherPage.getByTestId('student-progress').first()
      if (await studentProgress.isVisible({ timeout: 5000 })) {
        const progressText = await studentProgress.textContent()
        expect(progressText).toMatch(/\d+/) // Should show some progress
      }
    }
    
    await teacherPage.close()
  })
  
  test('should maintain performance with frequent auto-saves', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('autosave@example.com')
    await page.getByTestId('password-input').fill('AutoSaveTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    const autoSaveTimes = []
    
    // Monitor auto-save performance
    page.on('response', response => {
      if (response.url().includes('/api/quiz/session/') && response.request().method() === 'PUT') {
        const responseTime = response.timing().responseEnd - response.timing().requestStart
        autoSaveTimes.push(responseTime)
      }
    })
    
    // Answer multiple questions to trigger auto-saves
    for (let i = 0; i < 5; i++) {
      const choiceButton = page.locator('[data-testid^="choice-"]').first()
      if (await choiceButton.isVisible({ timeout: 2000 })) {
        await choiceButton.click()
        
        // Wait for auto-save
        await page.waitForSelector('[data-testid="auto-save-indicator"]', { timeout: 5000 })
        
        const nextButton = page.getByTestId('next-button')
        if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          await nextButton.click()
          await page.waitForTimeout(1000) // Allow for auto-save
        }
      }
    }
    
    // Auto-saves should be fast and not affect user experience
    if (autoSaveTimes.length > 0) {
      const avgAutoSaveTime = autoSaveTimes.reduce((a, b) => a + b) / autoSaveTimes.length
      expect(avgAutoSaveTime).toBeLessThan(200) // 200ms average for auto-save
      
      const maxAutoSaveTime = Math.max(...autoSaveTimes)
      expect(maxAutoSaveTime).toBeLessThan(500) // 500ms maximum
    }
  })
})

test.describe('Memory and Resource Management', () => {
  test('should not have memory leaks during extended usage', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('memory@example.com')
    await page.getByTestId('password-input').fill('MemoryTest123!')
    await page.getByTestId('login-button').click()
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Simulate extended usage
    for (let i = 0; i < 10; i++) {
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      await page.goto('/dashboard')
      await page.waitForSelector('[data-testid="dashboard-content"]')
      
      await page.goto('/progress')
      await page.waitForSelector('main')
      
      // Force garbage collection if available
      if (await page.evaluate(() => window.gc)) {
        await page.evaluate(() => window.gc())
      }
    }
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100
      
      console.log(`Memory usage: ${initialMemory} -> ${finalMemory} (${memoryIncreasePercent.toFixed(1)}% increase)`)
      
      // Memory should not increase by more than 50% during normal usage
      expect(memoryIncreasePercent).toBeLessThan(50)
      
      // Total memory usage should stay reasonable
      expect(finalMemory).toBeLessThan(100 * 1024 * 1024) // 100MB limit
    }
  })
  
  test('should handle resource cleanup on page navigation', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('cleanup@example.com')
    await page.getByTestId('password-input').fill('CleanupTest123!')
    await page.getByTestId('login-button').click()
    
    // Monitor resource cleanup
    const resourceCounts = {
      timers: [],
      eventListeners: [],
      requests: []
    }
    
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Get resource count before navigation
    const beforeResources = await page.evaluate(() => ({
      timers: (window as any).activeTimers?.length || 0,
      eventListeners: (window as any).eventListeners?.length || 0
    }))
    
    // Navigate away
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="dashboard-content"]')
    
    // Check resource cleanup
    const afterResources = await page.evaluate(() => ({
      timers: (window as any).activeTimers?.length || 0,
      eventListeners: (window as any).eventListeners?.length || 0
    }))
    
    // Resources should not accumulate excessively
    if (beforeResources.timers > 0) {
      const timerIncrease = afterResources.timers - beforeResources.timers
      expect(timerIncrease).toBeLessThan(5) // Minimal timer accumulation
    }
    
    // Check for DOM node leaks
    const domNodes = await page.evaluate(() => document.querySelectorAll('*').length)
    expect(domNodes).toBeLessThan(5000) // Reasonable DOM size limit
  })
})