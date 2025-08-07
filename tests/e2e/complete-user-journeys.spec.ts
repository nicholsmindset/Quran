import { test, expect } from '@playwright/test'

/**
 * Complete User Journey Testing for Qur'an Verse Challenge
 * Tests end-to-end workflows for all user roles with Islamic content validation
 */

test.describe('Flow 1: New Learner Complete Journey', () => {
  test('should complete full learner registration and first quiz experience', async ({ page }) => {
    // Step 1: Registration
    await page.goto('/auth')
    
    // Switch to registration
    await page.getByText(/register|sign up|create account/i).click()
    
    // Fill registration form
    const timestamp = Date.now()
    const testEmail = `learner${timestamp}@example.com`
    
    await page.getByTestId('email-input').fill(testEmail)
    await page.getByTestId('password-input').fill('SecurePass123!')
    await page.getByTestId('confirm-password-input').fill('SecurePass123!')
    
    // Select learner role
    await page.getByTestId('role-select').click()
    await page.getByRole('option', { name: /learner/i }).click()
    
    // Submit registration
    await page.getByTestId('register-button').click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
    
    // Step 2: Islamic Greeting Verification
    await expect(page.getByText(/assalamu alaikum|welcome/i)).toBeVisible()
    await expect(page.getByText(/islamic greeting/i).or(page.getByText(/bismillah/i))).toBeVisible()
    
    // Step 3: Profile Completion
    const profileButton = page.getByTestId('complete-profile-button')
    if (await profileButton.isVisible({ timeout: 2000 })) {
      await profileButton.click()
      await expect(page).toHaveURL('/profile')
      
      // Fill basic profile information
      await page.getByTestId('full-name-input').fill('Test Learner')
      await page.getByTestId('timezone-select').click()
      await page.getByRole('option', { name: /UTC/i }).first().click()
      await page.getByTestId('save-profile-button').click()
      
      // Return to dashboard
      await page.goto('/dashboard')
    }
    
    // Step 4: First Daily Quiz Experience
    await page.getByTestId('start-daily-quiz-button').click()
    await expect(page).toHaveURL('/quiz')
    
    // Verify quiz interface loads
    await page.waitForSelector('[data-testid="quiz-interface"]', { timeout: 10000 })
    await expect(page.getByText(/question 1 of/i)).toBeVisible()
    await expect(page.getByTestId('quiz-timer')).toBeVisible()
    
    // Step 5: Answer Questions with Auto-save Verification
    let questionCount = 0
    const maxQuestions = 5 // Complete partial quiz
    
    while (questionCount < maxQuestions) {
      try {
        // Check if quiz is complete
        if (await page.getByText('Quiz Complete!').isVisible({ timeout: 1000 })) {
          break
        }
        
        // Answer current question
        const choiceButton = page.locator('[data-testid^="choice-"]').first()
        if (await choiceButton.isVisible({ timeout: 3000 })) {
          await choiceButton.click()
        } else {
          // Handle fill-in-the-blank
          const fillInput = page.getByTestId('fill-blank-input')
          if (await fillInput.isVisible({ timeout: 1000 })) {
            await fillInput.fill('answer')
          }
        }
        
        // Verify auto-save indicator
        await expect(page.getByText(/saved|auto-saved/i).or(page.getByTestId('auto-save-indicator'))).toBeVisible({ timeout: 5000 })
        
        // Navigate to next question
        const nextButton = page.getByTestId('next-button')
        if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          await nextButton.click()
          await page.waitForTimeout(500) // Allow navigation
          questionCount++
        } else {
          break
        }
      } catch (error) {
        console.log(`Question ${questionCount + 1} handling:`, error.message)
        break
      }
    }
    
    // Step 6: Progress Dashboard Verification
    await page.goto('/dashboard')
    
    // Check streak counter (should show 1)
    await expect(page.getByTestId('streak-counter')).toBeVisible()
    const streakText = await page.getByTestId('streak-counter').textContent()
    expect(streakText).toMatch(/1|day/)
    
    // Check progress indicators
    await expect(page.getByTestId('progress-overview')).toBeVisible()
    await expect(page.getByText(/questions answered|quiz progress/i)).toBeVisible()
    
    // Step 7: Achievement System Check
    const achievementSection = page.getByTestId('achievements-section')
    if (await achievementSection.isVisible({ timeout: 2000 })) {
      await expect(page.getByText(/first quiz|getting started/i)).toBeVisible()
    }
    
    // Step 8: Group Invitation Preparation
    // Store user data for teacher flow test
    await page.evaluate((email) => {
      localStorage.setItem('test-learner-email', email)
    }, testEmail)
  })
  
  test('should handle resume quiz functionality correctly', async ({ page }) => {
    // Login as learner
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('testpassword123')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL('/dashboard')
    
    // Start quiz
    await page.goto('/quiz')
    await page.waitForSelector('[data-testid="quiz-interface"]')
    
    // Answer first question
    const choiceButton = page.locator('[data-testid^="choice-"]').first()
    if (await choiceButton.isVisible({ timeout: 3000 })) {
      await choiceButton.click()
      await page.getByTestId('next-button').click()
    }
    
    // Leave quiz (simulate interruption)
    await page.goto('/dashboard')
    
    // Return to quiz - should show resume option
    await page.goto('/quiz')
    
    // Look for resume functionality
    const resumeButton = page.getByTestId('resume-quiz-button')
    if (await resumeButton.isVisible({ timeout: 3000 })) {
      await resumeButton.click()
      
      // Should be on question 2 (where we left off)
      await expect(page.getByText(/question 2 of/i)).toBeVisible()
    }
  })
})

test.describe('Flow 2: Teacher Classroom Management Journey', () => {
  test('should complete full teacher workflow from registration to student management', async ({ page }) => {
    // Step 1: Teacher Registration
    await page.goto('/auth')
    await page.getByText(/register|sign up|create account/i).click()
    
    const timestamp = Date.now()
    const teacherEmail = `teacher${timestamp}@example.com`
    
    await page.getByTestId('email-input').fill(teacherEmail)
    await page.getByTestId('password-input').fill('TeacherPass123!')
    await page.getByTestId('confirm-password-input').fill('TeacherPass123!')
    
    // Select teacher role
    await page.getByTestId('role-select').click()
    await page.getByRole('option', { name: /teacher/i }).click()
    
    await page.getByTestId('register-button').click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
    
    // Step 2: Create First Group
    await page.getByTestId('create-group-button').click()
    
    await page.getByTestId('group-name-input').fill('Test Islamic Studies Class')
    await page.getByTestId('group-description-input').fill('A test class for Islamic studies students')
    await page.getByTestId('group-grade-select').click()
    await page.getByRole('option', { name: /9th|high school/i }).first().click()
    
    await page.getByTestId('create-group-submit').click()
    
    // Should redirect to group dashboard
    await expect(page).toHaveURL(/groups\/[a-zA-Z0-9-]+/)
    
    // Step 3: Generate and Copy Invitation Code
    await expect(page.getByTestId('group-invitation-code')).toBeVisible()
    const invitationCode = await page.getByTestId('group-invitation-code').textContent()
    expect(invitationCode).toMatch(/^[A-Z0-9]{6,8}$/) // Invitation code format
    
    // Test copy functionality
    await page.getByTestId('copy-invitation-button').click()
    await expect(page.getByText(/copied|copy successful/i)).toBeVisible()
    
    // Step 4: Create Custom Assignment
    await page.getByTestId('create-assignment-button').click()
    
    await page.getByTestId('assignment-title-input').fill('Daily Qur\'an Review')
    await page.getByTestId('assignment-description-input').fill('Complete 10 questions about today\'s verses')
    
    // Set due date (3 days from now)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 3)
    const dateString = futureDate.toISOString().split('T')[0]
    await page.getByTestId('assignment-due-date').fill(dateString)
    
    // Select question criteria
    await page.getByTestId('question-count-input').fill('10')
    await page.getByTestId('difficulty-select').click()
    await page.getByRole('option', { name: /medium/i }).click()
    
    await page.getByTestId('create-assignment-submit').click()
    
    // Should see assignment in list
    await expect(page.getByText('Daily Qur\'an Review')).toBeVisible()
    
    // Step 5: Group Settings Management
    await page.getByTestId('group-settings-button').click()
    
    // Update group settings
    await page.getByTestId('allow-late-submissions-checkbox').check()
    await page.getByTestId('auto-grade-checkbox').check()
    await page.getByTestId('save-settings-button').click()
    
    await expect(page.getByText(/settings saved|updated successfully/i)).toBeVisible()
    
    // Step 6: Monitor Empty Class Analytics
    await page.getByTestId('class-analytics-tab').click()
    
    // Should show empty state with helpful guidance
    await expect(page.getByText(/no students enrolled|invite students/i)).toBeVisible()
    await expect(page.getByTestId('student-count')).toHaveText('0')
    
    // Step 7: Generate New Invitation Code
    await page.getByTestId('generate-new-code-button').click()
    
    const newCode = await page.getByTestId('group-invitation-code').textContent()
    expect(newCode).not.toBe(invitationCode)
    expect(newCode).toMatch(/^[A-Z0-9]{6,8}$/)
    
    // Store teacher data for cross-test usage
    await page.evaluate((data) => {
      localStorage.setItem('test-teacher-email', data.email)
      localStorage.setItem('test-group-code', data.code)
    }, { email: teacherEmail, code: newCode })
  })
  
  test('should handle student enrollment and progress monitoring', async ({ page }) => {
    // Get stored teacher data
    const teacherEmail = await page.evaluate(() => localStorage.getItem('test-teacher-email'))
    const groupCode = await page.evaluate(() => localStorage.getItem('test-group-code'))
    
    if (!teacherEmail || !groupCode) {
      test.skip('Requires previous teacher registration test')
    }
    
    // Login as teacher
    await page.goto('/auth')
    await page.getByTestId('email-input').fill(teacherEmail)
    await page.getByTestId('password-input').fill('TeacherPass123!')
    await page.getByTestId('login-button').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Navigate to group
    await page.getByTestId('my-groups-section').click()
    await page.getByText('Test Islamic Studies Class').click()
    
    // Simulate student joining (in separate browser context)
    const studentContext = await page.context().browser()?.newContext()
    const studentPage = await studentContext?.newPage()
    
    if (studentPage) {
      // Student registration and joining
      await studentPage.goto('/auth')
      await studentPage.getByText(/register|sign up|create account/i).click()
      
      const studentEmail = `student${Date.now()}@example.com`
      await studentPage.getByTestId('email-input').fill(studentEmail)
      await studentPage.getByTestId('password-input').fill('StudentPass123!')
      await studentPage.getByTestId('confirm-password-input').fill('StudentPass123!')
      
      await studentPage.getByTestId('role-select').click()
      await studentPage.getByRole('option', { name: /learner/i }).click()
      
      await studentPage.getByTestId('register-button').click()
      await expect(studentPage).toHaveURL('/dashboard', { timeout: 15000 })
      
      // Join group using invitation code
      await studentPage.getByTestId('join-group-button').click()
      await studentPage.getByTestId('invitation-code-input').fill(groupCode)
      await studentPage.getByTestId('join-group-submit').click()
      
      await expect(studentPage.getByText(/successfully joined|welcome to/i)).toBeVisible()
      
      await studentContext?.close()
    }
    
    // Back to teacher view - refresh to see student
    await page.reload()
    
    // Should now show 1 student
    await expect(page.getByTestId('student-count')).toHaveText('1')
    
    // Check student list
    await page.getByTestId('students-tab').click()
    await expect(page.getByText(/student/i)).toBeVisible()
    
    // Individual student progress should show
    const studentRow = page.locator('[data-testid="student-row"]').first()
    await expect(studentRow).toBeVisible()
  })
})

test.describe('Flow 3: Scholar Moderation Complete Workflow', () => {
  test('should complete full scholar review and approval process', async ({ page }) => {
    // Step 1: Scholar Registration
    await page.goto('/auth')
    await page.getByText(/register|sign up|create account/i).click()
    
    const timestamp = Date.now()
    const scholarEmail = `scholar${timestamp}@example.com`
    
    await page.getByTestId('email-input').fill(scholarEmail)
    await page.getByTestId('password-input').fill('ScholarPass123!')
    await page.getByTestId('confirm-password-input').fill('ScholarPass123!')
    
    // Select scholar role
    await page.getByTestId('role-select').click()
    await page.getByRole('option', { name: /scholar/i }).click()
    
    await page.getByTestId('register-button').click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
    
    // Step 2: Access Scholar Dashboard
    await page.goto('/scholar')
    await expect(page.getByText(/moderation dashboard|pending reviews/i)).toBeVisible()
    
    // Step 3: Review Moderation Queue
    await expect(page.getByTestId('pending-questions-count')).toBeVisible()
    const pendingCount = await page.getByTestId('pending-questions-count').textContent()
    
    // Step 4: Review Individual Questions
    const firstQuestion = page.getByTestId('question-review-item').first()
    if (await firstQuestion.isVisible({ timeout: 3000 })) {
      await firstQuestion.click()
      
      // Should navigate to detailed review page
      await expect(page).toHaveURL(/scholar\/review\/[a-zA-Z0-9-]+/)
      
      // Step 5: Islamic Content Validation
      await expect(page.getByTestId('question-text')).toBeVisible()
      await expect(page.getByTestId('arabic-text')).toBeVisible()
      await expect(page.getByTestId('translation-text')).toBeVisible()
      
      // Check Arabic text validation
      const arabicText = await page.getByTestId('arabic-text').textContent()
      expect(arabicText).toMatch(/[\u0600-\u06FF]/) // Contains Arabic characters
      
      // Step 6: Scholar Review Actions
      // Test reject with feedback
      await page.getByTestId('reject-button').click()
      await page.getByTestId('rejection-reason-select').click()
      await page.getByRole('option', { name: /inaccurate translation/i }).first().click()
      
      await page.getByTestId('feedback-textarea').fill('The English translation needs to be more precise. Please consult authentic tafsir sources.')
      await page.getByTestId('submit-rejection').click()
      
      await expect(page.getByText(/question rejected|feedback sent/i)).toBeVisible()
      
      // Return to queue
      await page.goto('/scholar')
    }
    
    // Step 7: SLA Compliance Monitoring
    await expect(page.getByTestId('sla-status')).toBeVisible()
    const slaStatus = await page.getByTestId('sla-status').textContent()
    expect(slaStatus).toMatch(/on track|\d+ hours? remaining/)
    
    // Step 8: Batch Processing
    if (await page.getByTestId('select-all-checkbox').isVisible()) {
      await page.getByTestId('select-all-checkbox').check()
      await page.getByTestId('bulk-approve-button').click()
      
      // Should show confirmation dialog
      await expect(page.getByText(/confirm bulk approval/i)).toBeVisible()
      await page.getByTestId('confirm-bulk-action').click()
      
      await expect(page.getByText(/questions approved/i)).toBeVisible()
    }
    
    // Step 9: Performance Statistics
    await page.getByTestId('scholar-stats-tab').click()
    await expect(page.getByTestId('reviews-completed-today')).toBeVisible()
    await expect(page.getByTestId('average-review-time')).toBeVisible()
    await expect(page.getByTestId('accuracy-rating')).toBeVisible()
  })
  
  test('should handle complex Islamic content validation scenarios', async ({ page }) => {
    // Login as scholar
    await page.goto('/auth')
    await page.getByTestId('email-input').fill('scholar@example.com')
    await page.getByTestId('password-input').fill('scholarpass123')
    await page.getByTestId('login-button').click()
    
    await page.goto('/scholar')
    
    // Test Arabic text validation
    const questionItem = page.getByTestId('question-review-item').first()
    if (await questionItem.isVisible({ timeout: 3000 })) {
      await questionItem.click()
      
      // Verify Uthmani script preservation
      const arabicText = page.getByTestId('arabic-text')
      await expect(arabicText).toBeVisible()
      
      // Check for proper diacritical marks
      const arabicContent = await arabicText.textContent()
      expect(arabicContent).toMatch(/[\u064B-\u065F]/) // Diacritical marks range
      
      // Verify translation accuracy
      const translationText = await page.getByTestId('translation-text').textContent()
      expect(translationText).not.toMatch(/\[object|undefined|null\]/i)
      
      // Test verse reference validation
      const verseReference = page.getByTestId('verse-reference')
      await expect(verseReference).toBeVisible()
      const referenceText = await verseReference.textContent()
      expect(referenceText).toMatch(/\d+:\d+/) // Format: Surah:Verse
      
      // Cultural sensitivity check
      await page.getByTestId('cultural-sensitivity-checkbox').check()
      
      // Approve with Islamic validation
      await page.getByTestId('approve-button').click()
      await page.getByTestId('islamic-validation-confirmed').check()
      await page.getByTestId('submit-approval').click()
      
      await expect(page.getByText(/question approved/i)).toBeVisible()
    }
  })
})

test.describe('Cross-Role Integration Testing', () => {
  test('should handle complete ecosystem workflow', async ({ page, context }) => {
    // This test simulates the complete ecosystem interaction
    // Teacher creates assignment → Student completes → Scholar moderates → Results flow back
    
    // Step 1: Create teacher context
    const teacherPage = page
    await teacherPage.goto('/auth')
    await teacherPage.getByTestId('email-input').fill('teacher@example.com')
    await teacherPage.getByTestId('password-input').fill('teacherpass123')
    await teacherPage.getByTestId('login-button').click()
    
    // Create assignment with specific requirements
    await teacherPage.goto('/dashboard')
    await teacherPage.getByTestId('create-assignment-button').click()
    
    await teacherPage.getByTestId('assignment-title-input').fill('Integration Test Assignment')
    await teacherPage.getByTestId('question-count-input').fill('5')
    
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    await teacherPage.getByTestId('assignment-due-date').fill(futureDate.toISOString().split('T')[0])
    
    await teacherPage.getByTestId('create-assignment-submit').click()
    
    // Step 2: Student context - complete assignment
    const studentContext = await context.newContext()
    const studentPage = await studentContext.newPage()
    
    await studentPage.goto('/auth')
    await studentPage.getByTestId('email-input').fill('student@example.com')
    await studentPage.getByTestId('password-input').fill('studentpass123')
    await studentPage.getByTestId('login-button').click()
    
    // Find and complete assignment
    await studentPage.goto('/dashboard')
    const assignmentCard = studentPage.getByText('Integration Test Assignment')
    if (await assignmentCard.isVisible({ timeout: 5000 })) {
      await assignmentCard.click()
      
      // Complete all questions
      for (let i = 0; i < 5; i++) {
        const choiceButton = studentPage.locator('[data-testid^="choice-"]').first()
        if (await choiceButton.isVisible({ timeout: 2000 })) {
          await choiceButton.click()
          
          const nextButton = studentPage.getByTestId('next-button')
          if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
            await nextButton.click()
          }
        }
      }
      
      // Submit assignment
      await studentPage.getByTestId('submit-assignment').click()
      await expect(studentPage.getByText(/assignment submitted|completed/i)).toBeVisible()
    }
    
    await studentContext.close()
    
    // Step 3: Verify teacher sees completion
    await teacherPage.reload()
    await expect(teacherPage.getByText(/1 submission|completed by 1/i)).toBeVisible({ timeout: 10000 })
    
    // Step 4: Verify system integrity
    await teacherPage.getByTestId('assignment-results').click()
    await expect(teacherPage.getByTestId('student-submission')).toBeVisible()
    
    // Check grading and progress tracking
    const submissionRow = teacherPage.locator('[data-testid="student-submission"]').first()
    await expect(submissionRow).toContainText(/\d+%|\d+\/5/) // Score display
  })
})