import { test, expect, devices } from '@playwright/test'

/**
 * Cross-Browser and Device Testing for Qur'an Verse Challenge
 * Tests functionality across different browsers, devices, and viewport sizes
 */

test.describe('Cross-Browser Compatibility', () => {
  const testUser = {
    email: 'crossbrowser@example.com',
    password: 'CrossBrowserTest123!'
  }
  
  // Test authentication across all browsers
  ;['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should authenticate successfully on ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test on ${currentBrowser}`)
      
      await page.goto('/auth')
      
      // Test login form rendering
      await expect(page.getByTestId('email-input')).toBeVisible()
      await expect(page.getByTestId('password-input')).toBeVisible()
      await expect(page.getByTestId('login-button')).toBeVisible()
      
      // Test login functionality
      await page.getByTestId('email-input').fill(testUser.email)
      await page.getByTestId('password-input').fill(testUser.password)
      await page.getByTestId('login-button').click()
      
      // Should work across all browsers
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
      await expect(page.getByText(/dashboard|welcome/i)).toBeVisible()
    })
  })
  
  test('should render Arabic text correctly across all browsers', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill(testUser.email)
    await page.getByTestId('password-input').fill(testUser.password)
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Navigate to quiz to test Arabic rendering
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]', { timeout: 10000 })
    
    // Check for Arabic text elements
    const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
    
    if (await arabicElements.count() > 0) {
      const firstArabicElement = arabicElements.first()
      await expect(firstArabicElement).toBeVisible()
      
      // Verify RTL text direction
      const direction = await firstArabicElement.evaluate(el => 
        window.getComputedStyle(el).direction
      )
      expect(direction).toBe('rtl')
      
      // Verify font rendering
      const fontFamily = await firstArabicElement.evaluate(el => 
        window.getComputedStyle(el).fontFamily
      )
      expect(fontFamily).toMatch(/arabic|noto|amiri/i)
      
      // Test character rendering (no broken characters)
      const textContent = await firstArabicElement.textContent()
      expect(textContent).not.toMatch(/\ufffd|�/) // No replacement characters
    }
  })
  
  test('should handle CSS animations consistently across browsers', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill(testUser.email)
    await page.getByTestId('password-input').fill(testUser.password)
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Test loading animations
    await page.goto('/quiz')
    
    // Check for loading states and transitions
    const loadingIndicator = page.getByTestId('quiz-loading').or(page.locator('[data-loading="true"]'))
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      // Should disappear once loaded
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 })
    }
    
    // Test streak celebration animation
    await page.goto('/dashboard')
    const streakElement = page.getByTestId('streak-counter')
    if (await streakElement.isVisible()) {
      // Check animation classes
      const hasAnimation = await streakElement.evaluate(el => {
        const computed = window.getComputedStyle(el)
        return computed.animationName !== 'none' || computed.transitionProperty !== 'none'
      })
      expect(hasAnimation).toBe(true)
    }
  })
  
  test('should maintain consistent layout across browsers', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill(testUser.email)
    await page.getByTestId('password-input').fill(testUser.password)
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Test dashboard layout consistency
    const navbar = page.getByTestId('navbar')
    const mainContent = page.getByTestId('main-content')
    const sidebar = page.getByTestId('sidebar').or(page.getByTestId('progress-sidebar'))
    
    await expect(navbar).toBeVisible()
    await expect(mainContent).toBeVisible()
    
    // Check layout measurements
    const navbarBox = await navbar.boundingBox()
    const mainBox = await mainContent.boundingBox()
    
    expect(navbarBox?.width).toBeGreaterThan(0)
    expect(mainBox?.width).toBeGreaterThan(0)
    
    // Ensure no overlap issues
    if (navbarBox && mainBox) {
      expect(mainBox.y).toBeGreaterThanOrEqual(navbarBox.y + navbarBox.height)
    }
  })
})

test.describe('Mobile Device Testing', () => {
  test.use({ ...devices['iPhone 12'] })
  
  test('should provide optimal mobile experience for quiz taking', async ({ page }) => {
    await page.goto('/auth')
    
    // Mobile-specific login
    await page.getByTestId('email-input').fill('mobile@example.com')
    await page.getByTestId('password-input').fill('MobileTest123!')
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Test mobile navigation
    const mobileMenu = page.getByTestId('mobile-menu-trigger')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
      await expect(page.getByTestId('mobile-navigation')).toBeVisible()
    }
    
    // Navigate to quiz
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Test touch interactions
    const choiceButton = page.locator('[data-testid^="choice-"]').first()
    await choiceButton.tap()
    
    // Verify selection works with touch
    await expect(choiceButton).toHaveAttribute('data-state', 'selected')
    
    // Test swipe navigation (if implemented)
    const quizContainer = page.getByTestId('quiz-container')
    const boundingBox = await quizContainer.boundingBox()
    
    if (boundingBox) {
      // Simulate swipe gesture
      await page.touchscreen.tap(boundingBox.x + boundingBox.width - 50, boundingBox.y + boundingBox.height / 2)
    }
    
    // Verify mobile-optimized Arabic text
    const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
    if (await arabicElements.count() > 0) {
      const fontSize = await arabicElements.first().evaluate(el => 
        window.getComputedStyle(el).fontSize
      )
      // Mobile should have readable font size (at least 16px)
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16)
    }
  })
  
  test('should handle mobile keyboard interactions', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('mobile@example.com')
    await page.getByTestId('password-input').fill('MobileTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Test fill-in-the-blank on mobile
    const fillInput = page.getByTestId('fill-blank-input')
    if (await fillInput.isVisible({ timeout: 2000 })) {
      await fillInput.tap()
      
      // Verify keyboard appears and input is accessible
      await fillInput.fill('test answer')
      
      const inputValue = await fillInput.inputValue()
      expect(inputValue).toBe('test answer')
      
      // Verify viewport adjustment for keyboard
      const viewportHeight = await page.evaluate(() => window.innerHeight)
      expect(viewportHeight).toBeGreaterThan(300) // Reasonable minimum
    }
  })
  
  test('should optimize performance on mobile devices', async ({ page }) => {
    // Monitor network requests
    const responses = []
    page.on('response', response => responses.push(response))
    
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('mobile@example.com')
    await page.getByTestId('password-input').fill('MobileTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Check for excessive network requests
    const jsRequests = responses.filter(r => r.url().includes('.js'))
    const cssRequests = responses.filter(r => r.url().includes('.css'))
    
    expect(jsRequests.length).toBeLessThan(10) // Reasonable limit
    expect(cssRequests.length).toBeLessThan(5)
    
    // Test memory usage
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    if (memoryUsage > 0) {
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024) // 100MB limit
    }
  })
})

test.describe('Tablet Device Testing', () => {
  test.use({ ...devices['iPad'] })
  
  test('should provide optimized tablet experience', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('tablet@example.com')
    await page.getByTestId('password-input').fill('TabletTest123!')
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Test tablet-specific layout
    const sidebar = page.getByTestId('sidebar')
    if (await sidebar.isVisible()) {
      // Sidebar should be visible on tablet
      const sidebarWidth = await sidebar.evaluate(el => el.offsetWidth)
      expect(sidebarWidth).toBeGreaterThan(200) // Reasonable sidebar width
    }
    
    // Test quiz interface on tablet
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Check for tablet-optimized choice buttons
    const choiceButtons = page.locator('[data-testid^="choice-"]')
    const buttonCount = await choiceButtons.count()
    
    if (buttonCount > 0) {
      const firstButton = choiceButtons.first()
      const buttonBox = await firstButton.boundingBox()
      
      // Buttons should be touch-friendly size
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44) // iOS minimum
      expect(buttonBox?.width).toBeGreaterThan(100)
    }
    
    // Test orientation handling
    await page.setViewportSize({ width: 1024, height: 768 }) // Landscape
    await page.waitForTimeout(500)
    
    // Interface should adapt to landscape
    const quizInterface = page.getByTestId('quiz-interface')
    await expect(quizInterface).toBeVisible()
    
    const interfaceBox = await quizInterface.boundingBox()
    expect(interfaceBox?.width).toBeGreaterThan(interfaceBox?.height || 0)
  })
  
  test('should handle multi-touch interactions', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('tablet@example.com')
    await page.getByTestId('password-input').fill('TabletTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Test pinch-to-zoom on Arabic text (if supported)
    const arabicElement = page.locator('text=/[\u0600-\u06FF]/').first()
    
    if (await arabicElement.isVisible()) {
      const elementBox = await arabicElement.boundingBox()
      
      if (elementBox) {
        // Simulate pinch gesture
        await page.touchscreen.tap(elementBox.x + elementBox.width / 2, elementBox.y + elementBox.height / 2)
        
        // Check if zoom controls are available
        const zoomControls = page.getByTestId('text-zoom-controls')
        if (await zoomControls.isVisible({ timeout: 1000 })) {
          await page.getByTestId('zoom-in-button').click()
          
          const newFontSize = await arabicElement.evaluate(el => 
            window.getComputedStyle(el).fontSize
          )
          expect(parseInt(newFontSize)).toBeGreaterThan(16)
        }
      }
    }
  })
})

test.describe('Viewport and Resolution Testing', () => {
  const viewportSizes = [
    { name: 'Mobile Small', width: 320, height: 568 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 },
    { name: '4K', width: 3840, height: 2160 }
  ]
  
  viewportSizes.forEach(({ name, width, height }) => {
    test(`should maintain usability at ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      
      await page.goto('/auth')
      await page.getByTestId('email-input').fill('viewport@example.com')
      await page.getByTestId('password-input').fill('ViewportTest123!')
      await page.getByTestId('login-button').click()
      
      await expect(page).toHaveURL('/dashboard')
      
      // Test navigation visibility
      const navbar = page.getByTestId('navbar')
      await expect(navbar).toBeVisible()
      
      // Ensure no horizontal scrolling on smaller screens
      if (width < 768) {
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        const viewportWidth = await page.evaluate(() => window.innerWidth)
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // Small tolerance
      }
      
      // Test quiz interface
      await page.goto('/quiz')
      await page.waitForSelector('[data-testid="quiz-interface"]', { timeout: 10000 })
      
      // All interactive elements should be accessible
      const nextButton = page.getByTestId('next-button')
      const buttonBox = await nextButton.boundingBox()
      
      expect(buttonBox?.width).toBeGreaterThan(0)
      expect(buttonBox?.height).toBeGreaterThan(0)
      
      // Button should be within viewport
      expect(buttonBox?.x).toBeGreaterThanOrEqual(0)
      expect(buttonBox?.y).toBeGreaterThanOrEqual(0)
      expect((buttonBox?.x || 0) + (buttonBox?.width || 0)).toBeLessThanOrEqual(width)
      expect((buttonBox?.y || 0) + (buttonBox?.height || 0)).toBeLessThanOrEqual(height)
      
      // Test Arabic text readability
      const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
      if (await arabicElements.count() > 0) {
        const fontSize = await arabicElements.first().evaluate(el => 
          parseInt(window.getComputedStyle(el).fontSize)
        )
        
        // Minimum readable size based on viewport
        const minSize = width < 768 ? 14 : 16
        expect(fontSize).toBeGreaterThanOrEqual(minSize)
      }
    })
  })
})

test.describe('RTL and Arabic Text Cross-Browser Testing', () => {
  test('should render Arabic text correctly across all browsers and devices', async ({ page, browserName }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('arabic@example.com')
    await page.getByTestId('password-input').fill('ArabicTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
    
    if (await arabicElements.count() > 0) {
      for (let i = 0; i < Math.min(3, await arabicElements.count()); i++) {
        const element = arabicElements.nth(i)
        await expect(element).toBeVisible()
        
        // Test RTL direction
        const direction = await element.evaluate(el => 
          window.getComputedStyle(el).direction
        )
        expect(direction).toBe('rtl')
        
        // Test text alignment
        const textAlign = await element.evaluate(el => 
          window.getComputedStyle(el).textAlign
        )
        expect(textAlign).toMatch(/right|end/)
        
        // Test font rendering quality
        const textContent = await element.textContent()
        
        // Should not contain replacement characters
        expect(textContent).not.toMatch(/\ufffd|�/)
        
        // Should contain valid Arabic characters
        expect(textContent).toMatch(/[\u0600-\u06FF]/)
        
        // Test diacritical marks preservation
        if (textContent?.match(/[\u064B-\u065F]/)) {
          const diacritics = textContent.match(/[\u064B-\u065F]/g)
          expect(diacritics).not.toBeNull()
        }
      }
      
      // Browser-specific Arabic rendering tests
      switch (browserName) {
        case 'chromium':
          // Chrome specific Arabic rendering checks
          const chromeFont = await arabicElements.first().evaluate(el => 
            window.getComputedStyle(el).fontFamily
          )
          expect(chromeFont).toMatch(/noto|arial/i)
          break
          
        case 'firefox':
          // Firefox specific Arabic rendering checks
          const firefoxFont = await arabicElements.first().evaluate(el => 
            window.getComputedStyle(el).fontFamily
          )
          // Firefox should handle Arabic fonts well
          expect(firefoxFont).not.toBe('')
          break
          
        case 'webkit':
          // Safari specific Arabic rendering checks
          const safariFont = await arabicElements.first().evaluate(el => 
            window.getComputedStyle(el).fontFamily
          )
          // WebKit should use system Arabic fonts
          expect(safariFont).toMatch(/system|noto|arial/i)
          break
      }
    }
  })
  
  test('should handle mixed LTR/RTL content correctly', async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('mixed@example.com')
    await page.getByTestId('password-input').fill('MixedTest123!')
    await page.getByTestId('login-button').click()
    
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Look for elements containing both Arabic and English text
    const mixedTextElements = page.locator('text=/[\u0600-\u06FF].*[a-zA-Z]|[a-zA-Z].*[\u0600-\u06FF]/')
    
    if (await mixedTextElements.count() > 0) {
      const mixedElement = mixedTextElements.first()
      
      // Should handle bidirectional text
      const direction = await mixedElement.evaluate(el => 
        window.getComputedStyle(el).direction
      )
      
      // May be 'ltr' with proper bidi handling
      expect(['ltr', 'rtl']).toContain(direction)
      
      // Check for proper bidi character handling
      const textContent = await mixedElement.textContent()
      expect(textContent).not.toMatch(/\u202A|\u202B|\u202C|\u202D|\u202E/) // No visible bidi controls
    }
  })
})

test.describe('Performance Across Browsers', () => {
  test('should meet performance benchmarks across all browsers', async ({ page, browserName }) => {
    const startTime = Date.now()
    
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('perf@example.com')
    await page.getByTestId('password-input').fill('PerfTest123!')
    
    const loginStartTime = Date.now()
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL('/dashboard')
    const loginTime = Date.now() - loginStartTime
    
    // Login should be fast across all browsers
    expect(loginTime).toBeLessThan(5000)
    
    // Test quiz loading performance
    const quizStartTime = Date.now()
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    const quizLoadTime = Date.now() - quizStartTime
    
    // Quiz should load quickly
    expect(quizLoadTime).toBeLessThan(3000)
    
    // Browser-specific performance expectations
    switch (browserName) {
      case 'chromium':
        // Chrome should be fastest
        expect(quizLoadTime).toBeLessThan(2500)
        break
      case 'firefox':
        // Firefox acceptable performance
        expect(quizLoadTime).toBeLessThan(3000)
        break
      case 'webkit':
        // Safari may be slightly slower
        expect(quizLoadTime).toBeLessThan(3500)
        break
    }
    
    // Test navigation performance
    const navigationTimes = []
    
    for (const route of ['/dashboard', '/profile', '/progress']) {
      const navStart = Date.now()
      await page.goto(route)
      await page.waitForSelector('main', { state: 'visible' })
      navigationTimes.push(Date.now() - navStart)
    }
    
    // All navigation should be snappy
    const avgNavigationTime = navigationTimes.reduce((a, b) => a + b) / navigationTimes.length
    expect(avgNavigationTime).toBeLessThan(1500)
  })
})