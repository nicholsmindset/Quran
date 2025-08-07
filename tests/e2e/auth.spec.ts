import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/')
  })

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/auth')
    
    // Check page title and heading
    await expect(page).toHaveTitle(/Auth|Login|Sign In/)
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible()
    
    // Check form elements are present
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('login-button')).toBeVisible()
    
    // Check form validation
    await page.getByTestId('login-button').click()
    await expect(page.getByText(/email is required|invalid email/i)).toBeVisible()
  })

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/auth')
    
    // Test invalid email
    await page.getByTestId('email-input').fill('invalid-email')
    await page.getByTestId('password-input').fill('short')
    await page.getByTestId('login-button').click()
    
    await expect(page.getByText(/invalid email format/i)).toBeVisible()
    
    // Test missing password
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').clear()
    await page.getByTestId('login-button').click()
    
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should handle login attempt with invalid credentials', async ({ page }) => {
    await page.goto('/auth')
    
    await page.getByTestId('email-input').fill('invalid@example.com')
    await page.getByTestId('password-input').fill('wrongpassword')
    await page.getByTestId('login-button').click()
    
    // Should show error message
    await expect(page.getByText(/invalid credentials|authentication failed/i)).toBeVisible({ timeout: 10000 })
    
    // Should remain on auth page
    expect(page.url()).toContain('/auth')
  })

  test('should successfully log in with valid credentials', async ({ page }) => {
    await page.goto('/auth')
    
    // Fill in test credentials (these should exist in your test database)
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    
    // Click login and wait for navigation
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 200
    )
    
    await page.getByTestId('login-button').click()
    await responsePromise
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    
    // Should see dashboard elements
    await expect(page.getByText(/dashboard|welcome/i)).toBeVisible()
  })

  test('should display registration form when switching tabs', async ({ page }) => {
    await page.goto('/auth')
    
    // Click register tab/link
    await page.getByText(/register|sign up|create account/i).click()
    
    // Check registration form elements
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('confirm-password-input')).toBeVisible()
    await expect(page.getByTestId('register-button')).toBeVisible()
  })

  test('should validate password confirmation on registration', async ({ page }) => {
    await page.goto('/auth')
    
    // Switch to registration
    await page.getByText(/register|sign up|create account/i).click()
    
    await page.getByTestId('email-input').fill('newuser@example.com')
    await page.getByTestId('password-input').fill('password123')
    await page.getByTestId('confirm-password-input').fill('different123')
    
    await page.getByTestId('register-button').click()
    
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })

  test('should handle logout correctly', async ({ page }) => {
    // First log in
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    
    // Then log out
    await page.getByTestId('user-menu-trigger').click()
    await page.getByTestId('logout-button').click()
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth')
    
    // Verify we can't access protected pages
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/auth') // Should redirect back to auth
  })
})

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to auth page', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/quiz', '/profile', '/progress']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL('/auth')
    }
  })

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    // Login first
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Test navigation to other protected routes
    const protectedRoutes = [
      { path: '/quiz', selector: '[data-testid="quiz-interface"]' },
      { path: '/profile', selector: '[data-testid="profile-form"]' },
      { path: '/progress', selector: '[data-testid="progress-overview"]' }
    ]
    
    for (const route of protectedRoutes) {
      await page.goto(route.path)
      expect(page.url()).toContain(route.path)
      
      // Wait for page content to load
      await page.waitForSelector('body', { state: 'visible' })
      
      // Should not redirect back to auth
      expect(page.url()).not.toContain('/auth')
    }
  })
})

test.describe('Session Management', () => {
  test('should maintain session across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Refresh the page
    await page.reload()
    
    // Should still be on dashboard (not redirected to auth)
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(/dashboard|welcome/i)).toBeVisible()
  })

  test('should handle expired sessions gracefully', async ({ page }) => {
    // Login
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Simulate expired session by clearing storage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access protected route
    await page.goto('/profile')
    
    // Should redirect to auth
    await expect(page).toHaveURL('/auth')
  })
})

test.describe('Authentication Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/auth')
    
    // Intercept login request and make it fail
    await page.route('**/api/auth/login', route => {
      route.abort('failed')
    })
    
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    
    // Should show network error message
    await expect(page.getByText(/network error|connection failed|try again/i)).toBeVisible()
  })

  test('should handle server errors appropriately', async ({ page }) => {
    await page.goto('/auth')
    
    // Mock server error response
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      })
    })
    
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    
    // Should show server error message
    await expect(page.getByText(/server error|try again later/i)).toBeVisible()
  })

  test('should provide clear feedback for different error types', async ({ page }) => {
    const errorScenarios = [
      {
        response: { success: false, error: 'Invalid login credentials' },
        expectedMessage: /invalid credentials|wrong email or password/i
      },
      {
        response: { success: false, error: 'Account not found' },
        expectedMessage: /account not found|user does not exist/i
      },
      {
        response: { success: false, error: 'Account suspended' },
        expectedMessage: /account suspended|contact support/i
      }
    ]
    
    for (const scenario of errorScenarios) {
      await page.goto('/auth')
      
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify(scenario.response)
        })
      })
      
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('testpassword123')
      await page.getByTestId('login-button').click()
      
      await expect(page.getByText(scenario.expectedMessage)).toBeVisible()
    }
  })
})

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('email-input')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('password-input')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('login-button')).toBeFocused()
    
    // Should be able to submit with Enter
    await page.getByTestId('email-input').focus()
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.keyboard.press('Enter')
    
    // Should trigger login
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login')
    )
  })

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/auth')
    
    const emailInput = page.getByTestId('email-input')
    const passwordInput = page.getByTestId('password-input')
    const loginButton = page.getByTestId('login-button')
    
    await expect(emailInput).toHaveAttribute('aria-label')
    await expect(passwordInput).toHaveAttribute('aria-label')
    await expect(loginButton).toHaveAttribute('aria-label')
    
    // Check for proper form structure
    const form = page.locator('form')
    await expect(form).toBeVisible()
  })

  test('should announce errors to screen readers', async ({ page }) => {
    await page.goto('/auth')
    
    // Submit empty form
    await page.getByTestId('login-button').click()
    
    // Error messages should be announced
    const errorMessage = page.getByRole('alert').or(page.getByText(/required|invalid/))
    await expect(errorMessage).toBeVisible()
  })
})