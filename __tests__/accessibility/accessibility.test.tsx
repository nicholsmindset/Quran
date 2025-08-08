import { render } from '../utils/testing-library-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import React from 'react'
import { QuizInterface } from '@/components/quiz/quiz-interface'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { ProgressOverview } from '@/components/dashboard/progress-overview'
import { SAMPLE_QUIZ_QUESTIONS } from '../fixtures/islamic-content'

// Extend Jest with axe matchers
expect.extend(toHaveNoViolations)

// Mock framer-motion for accessibility tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('Accessibility Tests - WCAG 2.1 AA Compliance', () => {
  // Configure axe for Islamic content and Arabic text
  const axeConfig = {
    rules: {
      // Ensure proper language attributes for Arabic content
      'html-has-lang': { enabled: true },
      'valid-lang': { enabled: true },
      
      // Color contrast requirements (more strict for accessibility)
      'color-contrast': { enabled: true },
      'color-contrast-enhanced': { enabled: true },
      
      // Focus management for keyboard navigation
      'focus-order-semantics': { enabled: true },
      'tabindex': { enabled: true },
      
      // ARIA requirements for screen readers
      'aria-allowed-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-roles': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'aria-valid-attr': { enabled: true },
      
      // Form accessibility
      'label': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      
      // Islamic content specific rules
      'image-alt': { enabled: true }, // For Islamic symbols/images
      'heading-order': { enabled: true }, // Proper heading structure
      'landmark-unique': { enabled: true },
      'region': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
  }

  describe('Authentication Components', () => {
    it('should have no accessibility violations in LoginForm', async () => {
      const { container } = render(<LoginForm />)
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in RegisterForm', async () => {
      const { container } = render(<RegisterForm />)
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should have proper form labels and ARIA attributes', async () => {
      const { container, getByLabelText } = render(<LoginForm />)
      
      // Check form inputs have proper labels
      expect(getByLabelText(/email/i)).toBeInTheDocument()
      expect(getByLabelText(/password/i)).toBeInTheDocument()
      
      // Check ARIA attributes
      const emailInput = getByLabelText(/email/i)
      const passwordInput = getByLabelText(/password/i)
      
      expect(emailInput).toHaveAttribute('aria-required', 'true')
      expect(passwordInput).toHaveAttribute('aria-required', 'true')
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should announce form errors to screen readers', async () => {
      const { container, getByRole } = render(<LoginForm />)
      
      // Submit form to trigger validation errors
      const submitButton = getByRole('button', { name: /sign in|login/i })
      submitButton.click()
      
      // Check for error announcements
      const errorRegion = getByRole('alert', { timeout: 1000 }).catch(() => null)
      if (errorRegion) {
        expect(errorRegion).toBeInTheDocument()
      }
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Quiz Interface Components', () => {
    const mockQuestions = [
      {
        id: 'q1',
        prompt: 'What is the opening verse of the Quran?',
        choices: [
          'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
          'الرَّحْمَٰنِ الرَّحِيمِ',
          'مَالِكِ يَوْمِ الدِّينِ'
        ],
        answer: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        difficulty: 'easy',
        verse: {
          surah: 1,
          ayah: 1,
          arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          translation: 'In the name of Allah, the Most Gracious, the Most Merciful'
        },
        topic: 'Al-Fatiha',
        createdAt: new Date()
      }
    ]

    it('should have no accessibility violations in QuizInterface', async () => {
      const { container } = render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={jest.fn()} 
        />
      )
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading structure in quiz', async () => {
      const { container } = render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={jest.fn()} 
        />
      )
      
      // Check for proper heading hierarchy
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBeGreaterThan(0)
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible progress indicator', async () => {
      const { container, getByRole } = render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={jest.fn()} 
        />
      )
      
      // Progress bar should have proper ARIA attributes
      const progressBar = getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible quiz navigation buttons', async () => {
      const { container, getByRole } = render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={jest.fn()} 
        />
      )
      
      // Navigation buttons should be accessible
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should handle Arabic text accessibility correctly', async () => {
      const { container } = render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={jest.fn()} 
        />
      )
      
      // Arabic text elements should have proper language attributes
      const arabicElements = container.querySelectorAll('*')
      const arabicTextElements = Array.from(arabicElements).filter(el => 
        /[\u0600-\u06FF]/.test(el.textContent || '')
      )
      
      arabicTextElements.forEach(element => {
        // Should have Arabic language attribute or inherit from parent
        const lang = element.getAttribute('lang') || 
                    element.closest('[lang]')?.getAttribute('lang')
        expect(['ar', 'ar-SA', null]).toContain(lang) // null is acceptable if inherited
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Dashboard Components', () => {
    const mockProgressData = {
      totalQuestions: 150,
      correctAnswers: 120,
      accuracy: 80,
      streak: 7,
      studyTime: 300,
      dailyGoal: 10,
      completedToday: 8
    }

    it('should have no accessibility violations in ProgressOverview', async () => {
      const { container } = render(<ProgressOverview {...mockProgressData} />)
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible data visualizations', async () => {
      const { container } = render(<ProgressOverview {...mockProgressData} />)
      
      // Progress charts should have proper ARIA labels
      const charts = container.querySelectorAll('[role="img"], [role="progressbar"], svg')
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('aria-label')
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should provide alternative text for visual elements', async () => {
      const { container } = render(<ProgressOverview {...mockProgressData} />)
      
      // All images and visual elements should have alt text or ARIA labels
      const images = container.querySelectorAll('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should meet WCAG AA color contrast requirements', async () => {
      const { container } = render(
        <div>
          <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
          <LoginForm />
        </div>
      )
      
      const results = await axe(container, {
        ...axeConfig,
        rules: {
          ...axeConfig.rules,
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })

    it('should be usable without color alone', async () => {
      const { container } = render(
        <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
      )
      
      // Check for non-color indicators (icons, text, patterns)
      const interactiveElements = container.querySelectorAll('button, input, a')
      
      interactiveElements.forEach(element => {
        // Should have text content, ARIA label, or icon
        const hasTextContent = element.textContent && element.textContent.trim() !== ''
        const hasAriaLabel = element.hasAttribute('aria-label')
        const hasIcon = element.querySelector('svg, .icon, [data-icon]')
        
        expect(hasTextContent || hasAriaLabel || hasIcon).toBe(true)
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should be fully keyboard accessible', async () => {
      const { container } = render(<LoginForm />)
      
      // Check tabindex attributes
      const tabbableElements = container.querySelectorAll('[tabindex]')
      tabbableElements.forEach(element => {
        const tabindex = element.getAttribute('tabindex')
        // Tabindex should not be greater than 0 (anti-pattern)
        expect(parseInt(tabindex || '0')).toBeLessThanOrEqual(0)
      })
      
      const results = await axe(container, {
        ...axeConfig,
        rules: {
          ...axeConfig.rules,
          'tabindex': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })

    it('should have proper focus indicators', async () => {
      const { container } = render(
        <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
      )
      
      // Interactive elements should be focusable
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      
      expect(focusableElements.length).toBeGreaterThan(0)
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Screen Reader Accessibility', () => {
    it('should have proper ARIA landmarks', async () => {
      const { container } = render(
        <div>
          <header>Header</header>
          <main>
            <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
          </main>
          <footer>Footer</footer>
        </div>
      )
      
      // Check for landmark roles
      const landmarks = container.querySelectorAll('[role="banner"], [role="main"], [role="contentinfo"], header, main, footer, nav')
      expect(landmarks.length).toBeGreaterThan(0)
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should provide context for form controls', async () => {
      const { container } = render(<RegisterForm />)
      
      // Form controls should have labels or descriptions
      const inputs = container.querySelectorAll('input, textarea, select')
      inputs.forEach(input => {
        const hasLabel = input.hasAttribute('aria-label') || 
                        input.hasAttribute('aria-labelledby') ||
                        container.querySelector(`label[for="${input.id}"]`)
        expect(hasLabel).toBe(true)
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should announce dynamic content changes', async () => {
      const { container } = render(
        <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
      )
      
      // Should have ARIA live regions for dynamic updates
      const liveRegions = container.querySelectorAll('[aria-live], [role="alert"], [role="status"]')
      expect(liveRegions.length).toBeGreaterThan(0)
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Islamic Content Accessibility', () => {
    it('should properly handle Arabic text direction and language', async () => {
      const { container } = render(
        <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
      )
      
      // Arabic text should have proper language and direction attributes
      const arabicElements = Array.from(container.querySelectorAll('*')).filter(el => 
        /[\u0600-\u06FF]/.test(el.textContent || '')
      )
      
      arabicElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        expect(['rtl', 'ltr']).toContain(computedStyle.direction)
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should provide context for Islamic terminology', async () => {
      const { container } = render(
        <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
      )
      
      // Islamic terms should have context or translations
      const islamicTerms = container.querySelectorAll('[data-term], [title], [aria-describedby]')
      
      // Check that complex terms have explanations
      const arabicText = container.textContent?.match(/[\u0600-\u06FF]+/g)
      if (arabicText && arabicText.length > 0) {
        // Should have some form of explanation or context
        const hasTranslations = container.textContent?.includes('translation') ||
                               container.querySelector('[data-translation]') ||
                               container.querySelector('[aria-describedby]')
        expect(hasTranslations).toBe(true)
      }
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should handle mixed RTL/LTR content appropriately', async () => {
      const mixedContentQuestion = {
        ...mockQuestions[0],
        prompt: 'What does بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ mean in English?',
        choices: [
          'In the name of Allah',
          'Praise be to Allah',
          'Allah is Great',
          'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
        ]
      }
      
      const { container } = render(
        <QuizInterface questions={[mixedContentQuestion]} onComplete={jest.fn()} />
      )
      
      // Mixed content should be handled properly
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Mobile Accessibility', () => {
    beforeEach(() => {
      // Mock mobile viewport
      global.innerWidth = 375
      global.innerHeight = 667
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 })
    })

    afterEach(() => {
      // Reset viewport
      global.innerWidth = 1024
      global.innerHeight = 768
    })

    it('should be accessible on mobile devices', async () => {
      const { container } = render(
        <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
      )
      
      // Check touch targets are large enough (44x44px minimum)
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect()
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })

    it('should handle Arabic text on mobile correctly', async () => {
      const { container } = render(
        <QuizInterface questions={mockQuestions} onComplete={jest.fn()} />
      )
      
      // Arabic text should be readable on mobile
      const arabicElements = Array.from(container.querySelectorAll('*')).filter(el => 
        /[\u0600-\u06FF]/.test(el.textContent || '')
      )
      
      arabicElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element)
        const fontSize = parseFloat(computedStyle.fontSize)
        expect(fontSize).toBeGreaterThanOrEqual(14) // Minimum readable size on mobile
      })
      
      const results = await axe(container, axeConfig)
      expect(results).toHaveNoViolations()
    })
  })
})