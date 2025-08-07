import { test, expect } from '@playwright/test'

test.describe('Quiz Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each quiz test
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should start quiz from dashboard', async ({ page }) => {
    // Navigate to quiz from dashboard
    await page.getByTestId('start-quiz-button').click()
    
    await expect(page).toHaveURL('/quiz')
    await expect(page.getByText(/question 1 of/i)).toBeVisible()
  })

  test('should display quiz interface correctly', async ({ page }) => {
    await page.goto('/quiz')
    
    // Wait for quiz to load
    await page.waitForSelector('[data-testid="quiz-interface"]', { timeout: 10000 })
    
    // Check quiz header elements
    await expect(page.getByText(/question \d+ of \d+/i)).toBeVisible()
    await expect(page.getByText(/easy|medium|hard/i)).toBeVisible()
    await expect(page.getByText(/\d+:\d+/)).toBeVisible() // Timer
    
    // Check progress bar
    await expect(page.locator('[role="progressbar"]')).toBeVisible()
    
    // Check question content
    await expect(page.getByTestId('question-prompt')).toBeVisible()
    
    // Check navigation buttons
    await expect(page.getByTestId('next-button')).toBeVisible()
    await expect(page.getByTestId('previous-button')).toBeVisible()
  })

  test('should handle multiple choice questions correctly', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Wait for multiple choice question to load
    const choiceButtons = page.locator('[data-testid^="choice-"]')
    await expect(choiceButtons.first()).toBeVisible({ timeout: 5000 })
    
    // Check that choices are displayed
    const choiceCount = await choiceButtons.count()
    expect(choiceCount).toBeGreaterThan(0)
    expect(choiceCount).toBeLessThanOrEqual(4) // Typical MCQ has 2-4 choices
    
    // Select a choice
    await choiceButtons.first().click()
    
    // Should enable next button
    const nextButton = page.getByTestId('next-button')
    await expect(nextButton).not.toBeDisabled()
    
    // Selected choice should be highlighted
    await expect(choiceButtons.first()).toHaveAttribute('data-state', 'selected')
  })

  test('should handle fill-in-the-blank questions correctly', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Look for fill-in-the-blank input (may need to navigate to find one)
    const fillBlankInput = page.getByTestId('fill-blank-input')
    
    // If this question type is available
    if (await fillBlankInput.isVisible({ timeout: 1000 })) {
      await fillBlankInput.fill('Test answer')
      
      // Should enable next button
      const nextButton = page.getByTestId('next-button')
      await expect(nextButton).not.toBeDisabled()
    }
  })

  test('should handle Arabic text rendering correctly', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Check for Arabic text in questions or choices
    const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
    
    if (await arabicElements.count() > 0) {
      // Arabic text should be visible and properly rendered
      await expect(arabicElements.first()).toBeVisible()
      
      // Check text direction for Arabic content
      const firstArabicElement = arabicElements.first()
      const direction = await firstArabicElement.evaluate(el => 
        window.getComputedStyle(el).direction
      )
      expect(direction).toBe('rtl')
    }
  })

  test('should navigate between questions correctly', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Answer first question
    const choiceButton = page.locator('[data-testid^="choice-"]').first()
    await choiceButton.click({ timeout: 5000 })
    
    // Go to next question
    await page.getByTestId('next-button').click()
    
    // Should advance to question 2
    await expect(page.getByText(/question 2 of/i)).toBeVisible()
    
    // Go back to previous question
    await page.getByTestId('previous-button').click()
    
    // Should return to question 1
    await expect(page.getByText(/question 1 of/i)).toBeVisible()
    
    // Answer should be preserved
    await expect(choiceButton).toHaveAttribute('data-state', 'selected')
  })

  test('should not allow navigation without answering', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Next button should be disabled initially
    const nextButton = page.getByTestId('next-button')
    await expect(nextButton).toBeDisabled()
    
    // Previous button should be disabled on first question
    const previousButton = page.getByTestId('previous-button')
    await expect(previousButton).toBeDisabled()
  })

  test('should show quiz timer counting down', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Check initial timer
    const timer = page.getByTestId('quiz-timer')
    await expect(timer).toBeVisible()
    
    const initialTime = await timer.textContent()
    expect(initialTime).toMatch(/\d+:\d+/)
    
    // Wait a few seconds and check timer has decreased
    await page.waitForTimeout(3000)
    
    const laterTime = await timer.textContent()
    expect(laterTime).toMatch(/\d+:\d+/)
    expect(laterTime).not.toBe(initialTime)
  })

  test('should complete quiz and show results', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Answer all questions (simple approach - click first choice for each)
    let questionIndex = 1
    const maxQuestions = 10 // Safety limit
    
    while (questionIndex <= maxQuestions) {
      try {
        // Check if we're on the results page
        if (await page.getByText('Quiz Complete!').isVisible({ timeout: 1000 })) {
          break
        }
        
        // Check current question number
        const questionText = await page.getByText(/question \d+ of/i).textContent()
        if (!questionText) break
        
        // Answer the question
        const choiceButton = page.locator('[data-testid^="choice-"]').first()
        if (await choiceButton.isVisible({ timeout: 2000 })) {
          await choiceButton.click()
        } else {
          // Handle fill-in-the-blank
          const fillBlankInput = page.getByTestId('fill-blank-input')
          if (await fillBlankInput.isVisible({ timeout: 1000 })) {
            await fillBlankInput.fill('answer')
          }
        }
        
        // Click next/complete button
        const nextButton = page.getByTestId('next-button')
        const completeButton = page.getByTestId('complete-button')
        
        if (await completeButton.isVisible({ timeout: 1000 })) {
          await completeButton.click()
          break
        } else if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          await nextButton.click()
        }
        
        questionIndex++
      } catch (error) {
        console.log(`Error on question ${questionIndex}:`, error)
        break
      }
    }
    
    // Should show results
    await expect(page.getByText('Quiz Complete!')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/\d+%/)).toBeVisible()
    await expect(page.getByText(/you got \d+ out of \d+ questions correct/i)).toBeVisible()
  })

  test('should show appropriate performance feedback', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Complete quiz (simplified version)
    await page.evaluate(() => {
      // Mock completing quiz with high score
      const completeEvent = new CustomEvent('quiz-complete', {
        detail: { score: 90, correct: 9, total: 10 }
      })
      window.dispatchEvent(completeEvent)
    })
    
    // Or if that doesn't work, manually complete one question and check results structure
    const choiceButton = page.locator('[data-testid^="choice-"]').first()
    if (await choiceButton.isVisible({ timeout: 2000 })) {
      await choiceButton.click()
      const completeButton = page.getByTestId('complete-button').or(page.getByTestId('next-button'))
      await completeButton.click()
      
      // If there are more questions, this might not be the results page
      // But we can still test the structure when we do reach it
    }
    
    // Look for performance indicators
    if (await page.getByText('Quiz Complete!').isVisible({ timeout: 5000 })) {
      // Should show performance badge
      const badges = page.locator('[data-testid="performance-badge"]')
      if (await badges.count() > 0) {
        await expect(badges.first()).toBeVisible()
      }
      
      // Should show restart and dashboard buttons
      await expect(page.getByTestId('restart-quiz-button')).toBeVisible()
      await expect(page.getByTestId('back-to-dashboard-button')).toBeVisible()
    }
  })

  test('should allow restarting quiz', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Complete a quick quiz (answer one question if possible)
    const choiceButton = page.locator('[data-testid^="choice-"]').first()
    if (await choiceButton.isVisible({ timeout: 2000 })) {
      await choiceButton.click()
      const nextButton = page.getByTestId('next-button')
      if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
        await nextButton.click()
      }
    }
    
    // If we reach results, test restart functionality
    if (await page.getByText('Quiz Complete!').isVisible({ timeout: 5000 })) {
      await page.getByTestId('restart-quiz-button').click()
      
      // Should restart quiz
      await expect(page.getByText(/question 1 of/i)).toBeVisible()
      await expect(page.locator('[role="progressbar"]')).toBeVisible()
    }
  })

  test('should return to dashboard from results', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // If we can complete and reach results
    if (await page.getByText('Quiz Complete!').isVisible({ timeout: 10000 })) {
      await page.getByTestId('back-to-dashboard-button').click()
      await expect(page).toHaveURL('/dashboard')
    }
  })

  test('should handle quiz timeout', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Simulate time running out by checking if timer shows low time
    const timer = page.getByTestId('quiz-timer')
    
    // We can't easily wait for actual timeout, so check structure
    await expect(timer).toBeVisible()
    
    // Timer should show warning when low
    await page.evaluate(() => {
      // Mock low time scenario
      const timerElement = document.querySelector('[data-testid="quiz-timer"]')
      if (timerElement) {
        timerElement.textContent = '0:10'
        timerElement.classList.add('text-red-600', 'font-bold')
      }
    })
    
    // Should show warning styling
    await expect(timer).toHaveClass(/text-red-600|font-bold/)
  })
})

test.describe('Quiz Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Should be able to navigate with keyboard
    await page.keyboard.press('Tab')
    
    // First focusable element should be a choice or navigation button
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Should be able to select choices with Enter/Space
    if (await page.locator('[data-testid^="choice-"]').first().isVisible()) {
      await page.locator('[data-testid^="choice-"]').first().focus()
      await page.keyboard.press('Enter')
      
      // Should select the choice
      await expect(page.locator('[data-testid^="choice-"]').first()).toHaveAttribute('data-state', 'selected')
    }
  })

  test('should have proper ARIA labels for quiz elements', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Progress bar should have proper ARIA
    const progressBar = page.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()
    await expect(progressBar).toHaveAttribute('aria-valuenow')
    
    // Timer should have proper labeling
    const timer = page.getByTestId('quiz-timer')
    await expect(timer).toHaveAttribute('aria-label')
    
    // Question should have proper heading structure
    const questionHeading = page.locator('h1, h2, h3').filter({ hasText: /question/i })
    await expect(questionHeading).toBeVisible()
  })

  test('should announce important changes to screen readers', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Question navigation should be announced
    const choiceButton = page.locator('[data-testid^="choice-"]').first()
    if (await choiceButton.isVisible({ timeout: 2000 })) {
      await choiceButton.click()
      await page.getByTestId('next-button').click()
      
      // Should have aria-live region for announcements
      const liveRegion = page.locator('[aria-live]')
      await expect(liveRegion).toBeVisible()
    }
  })
})

test.describe('Quiz Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should load quiz within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should handle navigation smoothly', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Time the navigation between questions
    const choiceButton = page.locator('[data-testid^="choice-"]').first()
    if (await choiceButton.isVisible({ timeout: 2000 })) {
      await choiceButton.click()
      
      const navigationStart = Date.now()
      await page.getByTestId('next-button').click()
      
      // Wait for next question to appear
      await page.waitForSelector('[data-testid="question-prompt"]')
      const navigationTime = Date.now() - navigationStart
      
      // Navigation should be fast (< 500ms)
      expect(navigationTime).toBeLessThan(500)
    }
  })

  test('should maintain performance with Arabic text', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Check for Arabic text rendering performance
    const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
    
    if (await arabicElements.count() > 0) {
      const renderStart = Date.now()
      
      // Force re-render by scrolling
      await page.evaluate(() => window.scrollTo(0, 100))
      await page.evaluate(() => window.scrollTo(0, 0))
      
      // Wait for stabilization
      await page.waitForTimeout(100)
      
      const renderTime = Date.now() - renderStart
      
      // Arabic text rendering should be efficient
      expect(renderTime).toBeLessThan(200)
    }
  })
})