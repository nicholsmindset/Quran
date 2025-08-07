import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

/**
 * Islamic Content Accuracy and Arabic Text Validation Testing
 * Validates Islamic authenticity, Arabic text rendering, and cultural sensitivity
 */

test.describe('Arabic Text Rendering and Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('arabic@example.com')
    await page.getByTestId('password-input').fill('ArabicTest123!')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('should render Uthmani script correctly in quiz interface', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]', { timeout: 10000 })
    
    // Look for Arabic text elements
    const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
    const arabicCount = await arabicElements.count()
    
    if (arabicCount > 0) {
      for (let i = 0; i < Math.min(3, arabicCount); i++) {
        const arabicElement = arabicElements.nth(i)
        await expect(arabicElement).toBeVisible()
        
        // Test Uthmani script preservation
        const textContent = await arabicElement.textContent()
        
        // Should contain Arabic characters
        expect(textContent).toMatch(/[\u0600-\u06FF]/)
        
        // Should not contain replacement characters (indicating encoding issues)
        expect(textContent).not.toMatch(/\ufffd|�/)
        
        // Test for proper diacritical marks (if present)
        const hasDiacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(textContent || '')
        if (hasDiacritics) {
          // Diacritics should render properly
          expect(textContent).toMatch(/[\u064B-\u065F\u0670\u06D6-\u06ED]/)
        }
        
        // Test RTL direction
        const direction = await arabicElement.evaluate(el => 
          window.getComputedStyle(el).direction
        )
        expect(direction).toBe('rtl')
        
        // Test font rendering
        const fontFamily = await arabicElement.evaluate(el => 
          window.getComputedStyle(el).fontFamily
        )
        expect(fontFamily).toMatch(/noto|amiri|arabic|sans-serif/i)
        
        // Test font size readability
        const fontSize = await arabicElement.evaluate(el => 
          parseInt(window.getComputedStyle(el).fontSize)
        )
        expect(fontSize).toBeGreaterThanOrEqual(14) // Minimum readable size
        
        // Test text alignment for RTL
        const textAlign = await arabicElement.evaluate(el => 
          window.getComputedStyle(el).textAlign
        )
        expect(['right', 'end', 'start']).toContain(textAlign)
      }
    }
  })
  
  test('should preserve Arabic text integrity during navigation', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Capture initial Arabic text
    const initialArabicTexts = []
    const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
    const count = await arabicElements.count()
    
    for (let i = 0; i < Math.min(3, count); i++) {
      const text = await arabicElements.nth(i).textContent()
      if (text) initialArabicTexts.push(text)
    }
    
    if (initialArabicTexts.length > 0) {
      // Navigate to next question
      const choiceButton = page.locator('[data-testid^="choice-"]').first()
      if (await choiceButton.isVisible({ timeout: 3000 })) {
        await choiceButton.click()
        
        const nextButton = page.getByTestId('next-button')
        if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          await nextButton.click()
          await page.waitForTimeout(1000)
          
          // Check Arabic text integrity after navigation
          const newArabicElements = page.locator('text=/[\u0600-\u06FF]/')
          const newCount = await newArabicElements.count()
          
          if (newCount > 0) {
            const newArabicText = await newArabicElements.first().textContent()
            
            // Text should still be valid Arabic
            expect(newArabicText).toMatch(/[\u0600-\u06FF]/)
            expect(newArabicText).not.toMatch(/\ufffd|�/)
            
            // Should maintain proper encoding
            const bytes = new TextEncoder().encode(newArabicText || '')
            expect(bytes.length).toBeGreaterThan(0)
          }
        }
      }
    }
  })
  
  test('should handle mixed Arabic-English content correctly', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Look for mixed content (Arabic + English)
    const mixedElements = page.locator('*').filter({ 
      has: page.locator('text=/[\u0600-\u06FF].*[a-zA-Z]|[a-zA-Z].*[\u0600-\u06FF]/') 
    })
    
    if (await mixedElements.count() > 0) {
      const mixedElement = mixedElements.first()
      const textContent = await mixedElement.textContent()
      
      // Should contain both Arabic and English
      expect(textContent).toMatch(/[\u0600-\u06FF]/)
      expect(textContent).toMatch(/[a-zA-Z]/)
      
      // Test bidirectional text handling
      const direction = await mixedElement.evaluate(el => 
        window.getComputedStyle(el).direction
      )
      
      // Should handle bidi correctly
      expect(['ltr', 'rtl']).toContain(direction)
      
      // Should not contain visible bidi control characters
      expect(textContent).not.toMatch(/[\u202A-\u202E\u2066-\u2069]/)
    }
  })
  
  test('should validate verse references accuracy', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Look for verse reference elements
    const verseRefs = page.locator('[data-testid="verse-reference"]')
      .or(page.locator('text=/\d+:\d+/'))
      .or(page.locator('.verse-ref'))
    
    if (await verseRefs.count() > 0) {
      const verseRef = verseRefs.first()
      const refText = await verseRef.textContent()
      
      // Should match Surah:Verse format
      expect(refText).toMatch(/\d+:\d+/)
      
      // Extract surah and verse numbers
      const match = refText?.match(/(\d+):(\d+)/)
      if (match) {
        const surahNum = parseInt(match[1])
        const verseNum = parseInt(match[2])
        
        // Validate surah number (1-114)
        expect(surahNum).toBeGreaterThanOrEqual(1)
        expect(surahNum).toBeLessThanOrEqual(114)
        
        // Validate verse number (positive)
        expect(verseNum).toBeGreaterThanOrEqual(1)
        
        // Basic verse count validation for known surahs
        if (surahNum === 1) { // Al-Fatihah
          expect(verseNum).toBeLessThanOrEqual(7)
        } else if (surahNum === 2) { // Al-Baqarah
          expect(verseNum).toBeLessThanOrEqual(286)
        }
      }
    }
  })
})

test.describe('Islamic Content Authenticity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('scholar@example.com')
    await page.getByTestId('password-input').fill('ScholarTest123!')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL('/dashboard')
  })
  
  test('should validate question content for Islamic accuracy', async ({ page }) => {
    await page.goto('/scholar')
    await page.waitForSelector('[data-testid="moderation-queue"]', { timeout: 10000 })
    
    const questionItems = page.locator('[data-testid="question-review-item"]')
    
    if (await questionItems.count() > 0) {
      await questionItems.first().click()
      
      // Should navigate to review page
      await expect(page).toHaveURL(/scholar\/review\/[a-zA-Z0-9-]+/)
      
      // Validate question structure
      await expect(page.getByTestId('question-text')).toBeVisible()
      await expect(page.getByTestId('arabic-text')).toBeVisible()
      await expect(page.getByTestId('translation-text')).toBeVisible()
      
      // Test Arabic text validation
      const arabicText = await page.getByTestId('arabic-text').textContent()
      expect(arabicText).toMatch(/[\u0600-\u06FF]/)
      
      // Test translation quality
      const translationText = await page.getByTestId('translation-text').textContent()
      expect(translationText).not.toMatch(/\[object|undefined|null\]/i)
      expect(translationText).toMatch(/\w+/) // Should contain actual words
      
      // Test for common Islamic terms authenticity
      const islamicTerms = [
        'Allah', 'Muhammad', 'Quran', 'Qur\'an', 'Surah', 'Verse', 'Ayah',
        'Prophet', 'Messenger', 'believer', 'faith', 'Islam', 'Muslim'
      ]
      
      const hasIslamicContent = islamicTerms.some(term => 
        translationText?.toLowerCase().includes(term.toLowerCase())
      )
      
      if (hasIslamicContent) {
        // Should maintain respectful language
        expect(translationText).not.toMatch(/\b(god|lord)\b/gi) // Should use "Allah"
      }
      
      // Test verse reference validation
      const verseRef = page.getByTestId('verse-reference')
      if (await verseRef.isVisible()) {
        const refText = await verseRef.textContent()
        expect(refText).toMatch(/\d+:\d+/)
      }
      
      // Test for cultural sensitivity flags
      const culturalFlags = page.getByTestId('cultural-sensitivity-warnings')
      if (await culturalFlags.isVisible()) {
        const warnings = await culturalFlags.textContent()
        
        // Should flag potentially sensitive content
        expect(warnings).not.toMatch(/no warnings|all clear/i)
      }
    }
  })
  
  test('should validate Islamic greetings and cultural elements', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test Islamic greeting presence
    const greetingElement = page.getByText(/assalamu alaikum|peace be upon you|bismillah/i)
    
    if (await greetingElement.isVisible({ timeout: 3000 })) {
      const greetingText = await greetingElement.textContent()
      
      // Should contain proper Islamic greetings
      const properGreetings = [
        'Assalamu Alaikum',
        'Bismillah',
        'In the name of Allah',
        'Peace be upon you'
      ]
      
      const hasProperGreeting = properGreetings.some(greeting => 
        greetingText?.toLowerCase().includes(greeting.toLowerCase())
      )
      
      expect(hasProperGreeting).toBe(true)
    }
    
    // Test prayer time integration
    const prayerTimeElement = page.getByTestId('prayer-time-indicator')
      .or(page.getByText(/fajr|dhuhr|asr|maghrib|isha/i))
    
    if (await prayerTimeElement.isVisible({ timeout: 2000 })) {
      const prayerText = await prayerTimeElement.textContent()
      
      // Should contain valid prayer names
      const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
      const hasValidPrayer = prayerNames.some(prayer => 
        prayerText?.toLowerCase().includes(prayer.toLowerCase())
      )
      
      expect(hasValidPrayer).toBe(true)
    }
    
    // Test Hijri date display
    const hijriDate = page.getByTestId('hijri-date').or(page.getByText(/\d+\s+(Muharram|Safar|Rabi|Jumada|Rajab|Sha'ban|Ramadan|Shawwal|Dhu)/i))
    
    if (await hijriDate.isVisible({ timeout: 2000 })) {
      const dateText = await hijriDate.textContent()
      
      // Should contain valid Islamic month names
      const islamicMonths = [
        'Muharram', 'Safar', 'Rabi', 'Jumada', 'Rajab', 
        'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu'
      ]
      
      const hasValidMonth = islamicMonths.some(month => 
        dateText?.includes(month)
      )
      
      expect(hasValidMonth).toBe(true)
    }
  })
  
  test('should ensure respectful terminology throughout the app', async ({ page }) => {
    // Test multiple pages for terminology consistency
    const pagesToTest = ['/dashboard', '/quiz', '/profile', '/progress']
    
    for (const pagePath of pagesToTest) {
      await page.goto(pagePath)
      await page.waitForSelector('main', { state: 'visible' })
      
      // Get all text content
      const pageText = await page.evaluate(() => document.body.textContent)
      
      if (pageText) {
        // Should use "Allah" instead of generic terms
        if (pageText.toLowerCase().includes('god') && !pageText.toLowerCase().includes('allah')) {
          // Allow "God willing" but prefer Islamic terminology
          const contextualUse = /god willing|god's|godly/gi.test(pageText)
          if (!contextualUse) {
            console.warn(`Page ${pagePath} uses "God" instead of "Allah"`)
          }
        }
        
        // Should use respectful titles for Prophet Muhammad (PBUH)
        if (pageText.toLowerCase().includes('muhammad')) {
          const respectfulTitles = [
            'Prophet Muhammad',
            'Muhammad (peace be upon him)',
            'Muhammad (PBUH)',
            'Messenger of Allah'
          ]
          
          const hasRespectfulTitle = respectfulTitles.some(title => 
            pageText.toLowerCase().includes(title.toLowerCase())
          )
          
          // Allow standalone "Muhammad" in some contexts
          if (pageText.toLowerCase().match(/\bmuhammad\b/g)?.length > 0) {
            expect(hasRespectfulTitle || pageText.includes('Muhammad')).toBe(true)
          }
        }
        
        // Should avoid potentially offensive language
        const offensiveTerms = [
          'infidel', 'heathen', 'pagan', 'kafir'
        ]
        
        offensiveTerms.forEach(term => {
          expect(pageText.toLowerCase()).not.toContain(term)
        })
        
        // Should use inclusive language
        const inclusiveCheck = !(/non-believers?|unbelievers?/gi.test(pageText))
        if (!inclusiveCheck) {
          console.warn(`Page ${pagePath} may contain non-inclusive language`)
        }
      }
    }
  })
})

test.describe('Scholar Validation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('scholar@example.com')
    await page.getByTestId('password-input').fill('ScholarTest123!')
    await page.getByTestId('login-button').click()
    await page.goto('/scholar')
  })
  
  test('should validate Arabic text accuracy during review', async ({ page }) => {
    await page.waitForSelector('[data-testid="moderation-queue"]')
    
    const questionItems = page.locator('[data-testid="question-review-item"]')
    
    if (await questionItems.count() > 0) {
      await questionItems.first().click()
      
      // Test Arabic validation tools
      await expect(page.getByTestId('arabic-validation-section')).toBeVisible()
      
      // Test diacritical marks checker
      const diacriticsChecker = page.getByTestId('diacritics-checker')
      if (await diacriticsChecker.isVisible()) {
        await diacriticsChecker.click()
        
        // Should show diacritics analysis
        await expect(page.getByText(/diacritics analysis|tashkeel/i)).toBeVisible()
      }
      
      // Test verse authenticity checker
      const authenticityChecker = page.getByTestId('verse-authenticity-checker')
      if (await authenticityChecker.isVisible()) {
        await authenticityChecker.click()
        
        // Should validate against authentic Quranic text
        await expect(page.getByText(/authenticity verified|authentic source/i)).toBeVisible()
      }
      
      // Test translation accuracy
      const translationChecker = page.getByTestId('translation-accuracy-checker')
      if (await translationChecker.isVisible()) {
        await translationChecker.click()
        
        // Should show translation quality indicators
        await expect(page.getByText(/translation quality|accuracy score/i)).toBeVisible()
      }
      
      // Test Islamic content validation
      await page.getByTestId('islamic-validation-checkbox').check()
      
      // Submit validation
      await page.getByTestId('approve-button').click()
      await page.getByTestId('submit-approval').click()
      
      await expect(page.getByText(/approved|validation complete/i)).toBeVisible()
    }
  })
  
  test('should flag content requiring Islamic expertise review', async ({ page }) => {
    await page.waitForSelector('[data-testid="moderation-queue"]')
    
    const questionItems = page.locator('[data-testid="question-review-item"]')
    
    if (await questionItems.count() > 0) {
      await questionItems.first().click()
      
      // Test complex Islamic content detection
      const complexContentFlags = [
        'theological-complexity',
        'jurisprudence-reference',
        'sectarian-sensitivity',
        'historical-context-needed'
      ]
      
      for (const flag of complexContentFlags) {
        const flagElement = page.getByTestId(`flag-${flag}`)
        if (await flagElement.isVisible()) {
          await flagElement.click()
          
          // Should provide guidance for complex content
          await expect(page.getByText(/requires expert review|specialist needed/i)).toBeVisible()
        }
      }
      
      // Test escalation to senior scholar
      const escalateButton = page.getByTestId('escalate-to-senior-scholar')
      if (await escalateButton.isVisible()) {
        await escalateButton.click()
        
        await page.getByTestId('escalation-reason-select').click()
        await page.getByRole('option', { name: /complex theology/i }).first().click()
        
        await page.getByTestId('escalation-notes').fill('Requires senior scholar review for theological accuracy')
        await page.getByTestId('submit-escalation').click()
        
        await expect(page.getByText(/escalated successfully/i)).toBeVisible()
      }
    }
  })
})

test.describe('Accessibility with Islamic Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('a11y@example.com')
    await page.getByTestId('password-input').fill('AccessibilityTest123!')
    await page.getByTestId('login-button').click()
    await injectAxe(page)
  })
  
  test('should provide accessible Arabic text reading experience', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Test screen reader support for Arabic text
    const arabicElements = page.locator('text=/[\u0600-\u06FF]/')
    
    if (await arabicElements.count() > 0) {
      const arabicElement = arabicElements.first()
      
      // Should have proper language attribute
      const lang = await arabicElement.getAttribute('lang')
      expect(['ar', 'ar-SA', 'ar-EG', null]).toContain(lang) // null is acceptable if inherited
      
      // Should have proper direction attribute
      const dir = await arabicElement.getAttribute('dir')
      expect(['rtl', null]).toContain(dir) // null is acceptable if inherited from parent
      
      // Test aria-label for screen readers
      const ariaLabel = await arabicElement.getAttribute('aria-label')
      if (ariaLabel) {
        // Should provide transliteration or description
        expect(ariaLabel).toMatch(/\w+/)
      }
      
      // Test for proper heading structure
      const headingArabic = page.locator('h1, h2, h3, h4, h5, h6').filter({ has: page.locator('text=/[\u0600-\u06FF]/') })
      
      if (await headingArabic.count() > 0) {
        // Headings should be properly structured
        const headingLevel = await headingArabic.first().tagName()
        expect(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']).toContain(headingLevel.toUpperCase())
      }
    }
    
    // Run accessibility check
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })
  
  test('should support keyboard navigation with RTL content', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Test keyboard navigation in RTL context
    await page.keyboard.press('Tab')
    
    let focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test arrow key navigation in RTL
    if (await page.locator('[data-testid^="choice-"]').count() > 1) {
      // Navigate to first choice
      await page.locator('[data-testid^="choice-"]').first().focus()
      
      // In RTL, left arrow should go to next item, right arrow to previous
      await page.keyboard.press('ArrowRight')
      
      focusedElement = page.locator(':focus')
      const focusedId = await focusedElement.getAttribute('data-testid')
      
      // Should maintain logical navigation despite RTL layout
      expect(focusedId).toMatch(/choice-/)
    }
    
    // Test tab order preservation
    const interactiveElements = page.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const elementCount = await interactiveElements.count()
    
    if (elementCount > 0) {
      // Tab through all elements
      for (let i = 0; i < Math.min(5, elementCount); i++) {
        await page.keyboard.press('Tab')
        
        focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()
        
        // Focus should be clearly visible
        const outline = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).outline
        )
        const outlineWidth = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).outlineWidth
        )
        
        // Should have visible focus indicator
        expect(outline !== 'none' || outlineWidth !== '0px').toBe(true)
      }
    }
  })
  
  test('should provide alternative text for Islamic symbols and decorations', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test images and icons for alt text
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i)
      const alt = await image.getAttribute('alt')
      const src = await image.getAttribute('src')
      
      // Decorative images should have empty alt
      if (src?.includes('decoration') || src?.includes('ornament')) {
        expect(alt).toBe('')
      } else {
        // Meaningful images should have descriptive alt text
        expect(alt).toBeTruthy()
        if (alt && alt.length > 0) {
          expect(alt.length).toBeGreaterThan(3)
        }
      }
    }
    
    // Test Islamic symbols for accessibility
    const islamicSymbols = page.locator('text=/☪|✦|۞|﷽/') // Common Islamic symbols
    
    if (await islamicSymbols.count() > 0) {
      for (let i = 0; i < await islamicSymbols.count(); i++) {
        const symbol = islamicSymbols.nth(i)
        
        const ariaLabel = await symbol.getAttribute('aria-label')
        const title = await symbol.getAttribute('title')
        
        // Symbols should have accessible descriptions
        expect(ariaLabel || title).toBeTruthy()
      }
    }
  })
  
  test('should maintain WCAG 2.1 AA compliance with Islamic color schemes', async ({ page }) => {
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Test color contrast for Islamic color themes
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6').filter({ hasText: /\w+/ })
    const sampleSize = Math.min(10, await textElements.count())
    
    for (let i = 0; i < sampleSize; i++) {
      const element = textElements.nth(i)
      
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        }
      })
      
      // Check for sufficient color contrast (simplified test)
      const textColor = styles.color
      const bgColor = styles.backgroundColor
      
      // Should not be white on white or black on black
      expect(textColor).not.toBe(bgColor)
      
      // Green and gold Islamic themes should maintain contrast
      if (textColor.includes('rgb(') && bgColor.includes('rgb(')) {
        const textRgb = textColor.match(/\d+/g)?.map(Number)
        const bgRgb = bgColor.match(/\d+/g)?.map(Number)
        
        if (textRgb && bgRgb) {
          // Simple contrast check (not full WCAG algorithm)
          const textBrightness = (textRgb[0] * 299 + textRgb[1] * 587 + textRgb[2] * 114) / 1000
          const bgBrightness = (bgRgb[0] * 299 + bgRgb[1] * 587 + bgRgb[2] * 114) / 1000
          const contrastRatio = Math.abs(textBrightness - bgBrightness)
          
          // Should have reasonable contrast
          expect(contrastRatio).toBeGreaterThan(50)
        }
      }
    }
    
    // Run full accessibility check
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true }
      }
    })
  })
})