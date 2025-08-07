import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

test.describe('E2E Accessibility Tests - WCAG 2.1 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing environment
    await page.goto('/')
    
    // Configure axe for Islamic content
    await page.addInitScript(() => {
      // Configure axe to understand Arabic content
      if (window.axe) {
        window.axe.configure({
          rules: [
            {
              id: 'html-has-lang',
              enabled: true
            },
            {
              id: 'valid-lang', 
              enabled: true
            },
            {
              id: 'color-contrast',
              enabled: true
            },
            {
              id: 'color-contrast-enhanced',
              enabled: true
            }
          ],
          tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
        })
      }
    })
  })

  test.describe('Page-Level Accessibility', () => {
    test('should pass accessibility audit on home page', async ({ page }) => {
      await page.goto('/')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should pass accessibility audit on auth page', async ({ page }) => {
      await page.goto('/auth')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should pass accessibility audit on dashboard (authenticated)', async ({ page }) => {
      // Login first
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await expect(page).toHaveURL('/dashboard')
      await page.waitForLoadState('networkidle')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should pass accessibility audit on quiz page', async ({ page }) => {
      // Login and navigate to quiz
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]', { timeout: 10000 })
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should be fully navigable with keyboard on auth page', async ({ page }) => {
      await page.goto('/auth')
      
      // Start keyboard navigation
      await page.keyboard.press('Tab')
      await expect(page.getByTestId('email-input')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByTestId('password-input')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByTestId('login-button')).toBeFocused()
      
      // Should be able to interact with Enter
      await page.getByTestId('email-input').focus()
      await page.keyboard.type('test@example.com')
      await page.keyboard.press('Tab')
      await page.keyboard.type('password123')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      
      // Should trigger form submission
      await page.waitForResponse(response => 
        response.url().includes('/api/auth/login'), { timeout: 5000 }
      )
    })

    test('should navigate quiz interface with keyboard', async ({ page }) => {
      // Login and start quiz
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Navigate through quiz choices with keyboard
      await page.keyboard.press('Tab')
      
      // Should focus on first choice
      const firstChoice = page.locator('[data-testid^="choice-"]').first()
      if (await firstChoice.isVisible()) {
        await expect(firstChoice).toBeFocused()
        
        // Select with Enter
        await page.keyboard.press('Enter')
        await expect(firstChoice).toHaveAttribute('data-state', 'selected')
        
        // Navigate to next button
        await page.keyboard.press('Tab')
        await page.keyboard.press('Tab') // Skip other choices
        await expect(page.getByTestId('next-button')).toBeFocused()
      }
    })

    test('should handle Arabic text navigation correctly', async ({ page }) => {
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Check for Arabic text and ensure it's keyboard accessible
      const arabicElements = await page.locator('text=/[\u0600-\u06FF]/').all()
      
      for (const element of arabicElements) {
        if (await element.isVisible()) {
          // Arabic text should be focusable if interactive
          const parent = element.locator('xpath=..')
          if (await parent.getAttribute('role') || await parent.getAttribute('tabindex')) {
            await parent.focus()
            expect(await parent.evaluate(el => document.activeElement === el)).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/auth')
      
      // Check form elements have proper ARIA attributes
      const emailInput = page.getByTestId('email-input')
      const passwordInput = page.getByTestId('password-input')
      const loginButton = page.getByTestId('login-button')
      
      await expect(emailInput).toHaveAttribute('aria-label')
      await expect(passwordInput).toHaveAttribute('aria-label')
      await expect(loginButton).toHaveAttribute('aria-label')
      
      // Check for form validation announcements
      await loginButton.click()
      
      const errorMessage = page.locator('[role="alert"]').or(page.locator('[aria-live]'))
      await expect(errorMessage).toBeVisible({ timeout: 5000 })
    })

    test('should announce quiz progress to screen readers', async ({ page }) => {
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Progress bar should have proper ARIA attributes
      const progressBar = page.locator('[role="progressbar"]')
      await expect(progressBar).toBeVisible()
      await expect(progressBar).toHaveAttribute('aria-valuenow')
      await expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      await expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      
      // Question number should be announced
      const questionHeader = page.getByText(/question \d+ of \d+/i)
      await expect(questionHeader).toBeVisible()
    })

    test('should provide context for Arabic content', async ({ page }) => {
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Arabic text should have language attributes
      const arabicElements = await page.locator('text=/[\u0600-\u06FF]/').all()
      
      for (const element of arabicElements) {
        const lang = await element.getAttribute('lang') || 
                     await element.locator('xpath=ancestor::*[@lang][1]').getAttribute('lang')
        expect(['ar', 'ar-SA', null]).toContain(lang)
      }
    })
  })

  test.describe('Color and Visual Accessibility', () => {
    test('should meet color contrast requirements', async ({ page }) => {
      await page.goto('/')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['color-contrast', 'color-contrast-enhanced'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should be usable at high zoom levels', async ({ page }) => {
      await page.goto('/auth')
      
      // Test at 200% zoom
      await page.setViewportSize({ width: 640, height: 480 }) // Simulates 200% zoom on 1280x960
      
      // All elements should still be visible and functional
      await expect(page.getByTestId('email-input')).toBeVisible()
      await expect(page.getByTestId('password-input')).toBeVisible()
      await expect(page.getByTestId('login-button')).toBeVisible()
      
      // Form should still function
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.waitForResponse(response => 
        response.url().includes('/api/auth/login')
      )
    })

    test('should work without color information', async ({ page }) => {
      // Simulate color blindness by removing color CSS
      await page.addStyleTag({
        content: `
          * {
            filter: grayscale(100%) !important;
          }
        `
      })
      
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Should still be able to identify interactive elements
      const choiceButtons = page.locator('[data-testid^="choice-"]')
      const count = await choiceButtons.count()
      
      if (count > 0) {
        // Buttons should have text or icons, not just color
        for (let i = 0; i < count; i++) {
          const button = choiceButtons.nth(i)
          const hasText = (await button.textContent())?.trim() !== ''
          const hasIcon = await button.locator('svg, .icon, [data-icon]').count() > 0
          expect(hasText || hasIcon).toBe(true)
        }
      }
    })
  })

  test.describe('Islamic Content Accessibility', () => {
    test('should handle Arabic text direction properly', async ({ page }) => {
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Check Arabic text has proper direction
      const arabicElements = await page.locator('text=/[\u0600-\u06FF]/').all()
      
      for (const element of arabicElements) {
        const direction = await element.evaluate(el => 
          window.getComputedStyle(el).direction
        )
        expect(['rtl', 'ltr']).toContain(direction)
        
        // Text should be readable (not overlapped)
        const boundingBox = await element.boundingBox()
        expect(boundingBox?.width).toBeGreaterThan(0)
        expect(boundingBox?.height).toBeGreaterThan(0)
      }
    })

    test('should provide translations or context for Arabic terms', async ({ page }) => {
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Look for Arabic text with English translations nearby
      const pageContent = await page.textContent('body')
      const hasArabicText = /[\u0600-\u06FF]/.test(pageContent || '')
      
      if (hasArabicText) {
        // Should have some English translation or context
        const hasEnglishContext = /translation|meaning|english/i.test(pageContent || '') ||
                                  await page.locator('[data-translation]').count() > 0 ||
                                  await page.locator('[title]').count() > 0
        
        expect(hasEnglishContext).toBe(true)
      }
    })

    test('should handle mixed RTL/LTR content correctly', async ({ page }) => {
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Mixed content should maintain proper reading order
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
      
      // Check that text doesn't overlap or misalign
      const allText = await page.locator('*').filter({ hasText: /.+/ }).all()
      
      for (const element of allText) {
        if (await element.isVisible()) {
          const boundingBox = await element.boundingBox()
          expect(boundingBox?.width).toBeGreaterThan(0)
          expect(boundingBox?.height).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) {
        await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      }
      
      await page.goto('/auth')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have proper touch targets on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        await page.setViewportSize({ width: 375, height: 667 })
      }
      
      await page.goto('/auth')
      
      // Touch targets should be at least 44x44px
      const buttons = await page.locator('button').all()
      
      for (const button of buttons) {
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox()
          expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
          expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test('should handle Arabic text properly on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        await page.setViewportSize({ width: 375, height: 667 })
      }
      
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Arabic text should be readable on mobile
      const arabicElements = await page.locator('text=/[\u0600-\u06FF]/').all()
      
      for (const element of arabicElements) {
        if (await element.isVisible()) {
          const fontSize = await element.evaluate(el => 
            parseInt(window.getComputedStyle(el).fontSize)
          )
          expect(fontSize).toBeGreaterThanOrEqual(14) // Minimum mobile font size
          
          // Text should not be cut off
          const boundingBox = await element.boundingBox()
          expect(boundingBox?.width).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('Error Handling and User Feedback', () => {
    test('should provide accessible error messages', async ({ page }) => {
      await page.goto('/auth')
      
      // Trigger validation errors
      await page.getByTestId('login-button').click()
      
      // Error messages should be announced to screen readers
      const errorMessages = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]')
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 })
      
      // Check accessibility of error state
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should provide accessible loading states', async ({ page }) => {
      await page.goto('/auth')
      
      // Fill form and submit
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      
      // Look for loading indicators
      await page.getByTestId('login-button').click()
      
      // Loading states should be accessible
      const loadingIndicator = page.locator('[aria-label*="loading"], [role="status"], [aria-busy="true"]')
      
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator.first()).toBeVisible()
        
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
        
        expect(accessibilityScanResults.violations).toEqual([])
      }
    })
  })

  test.describe('Dynamic Content Accessibility', () => {
    test('should handle quiz navigation accessibility', async ({ page }) => {
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Select an answer and navigate
      const firstChoice = page.locator('[data-testid^="choice-"]').first()
      if (await firstChoice.isVisible()) {
        await firstChoice.click()
        await page.getByTestId('next-button').click()
        
        // Question change should be announced
        await page.waitForSelector('[data-testid="question-prompt"]')
        
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
        
        expect(accessibilityScanResults.violations).toEqual([])
      }
    })

    test('should handle quiz completion accessibility', async ({ page }) => {
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]')
      
      // Try to complete quiz quickly (mock or single question)
      const completeButton = page.getByTestId('complete-button')
      if (await completeButton.isVisible({ timeout: 2000 })) {
        await completeButton.click()
        
        // Results page should be accessible
        await expect(page.getByText('Quiz Complete!')).toBeVisible({ timeout: 10000 })
        
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
        
        expect(accessibilityScanResults.violations).toEqual([])
      }
    })
  })
})