import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '../../utils/testing-library-utils'
import { QuizInterface } from '@/components/quiz/quiz-interface'
import { Question, Attempt } from '@/types'
import { SAMPLE_QUIZ_QUESTIONS } from '../../fixtures/islamic-content'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('QuizInterface', () => {
  const mockQuestions: Question[] = [
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
    },
    {
      id: 'q2',
      prompt: 'Complete the verse: وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ ______',
      choices: [], // Fill-in-the-blank question
      answer: 'وَحَمَلْنَاهُمْ فِي الْبَرِّ وَالْبَحْرِ',
      difficulty: 'medium',
      verse: {
        surah: 17,
        ayah: 70,
        arabicText: 'وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ وَحَمَلْنَاهُمْ فِي الْبَرِّ وَالْبَحْرِ',
        translation: 'And We have honored the children of Adam'
      },
      topic: 'Human Dignity',
      createdAt: new Date()
    }
  ]

  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('should render the first question correctly', () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete} 
          timeLimit={10}
        />
      )

      expect(screen.getByText('What is the opening verse of the Quran?')).toBeInTheDocument()
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
      expect(screen.getByText('easy')).toBeInTheDocument()
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    it('should render multiple choice options for MCQ questions', () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      // Check that all 4 choices are rendered
      expect(screen.getByText(/A\./)).toBeInTheDocument()
      expect(screen.getByText(/B\./)).toBeInTheDocument()
      expect(screen.getByText(/C\./)).toBeInTheDocument()
      expect(screen.getByText(/D\./)).toBeInTheDocument()

      // Check Arabic text is present
      expect(screen.getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBeInTheDocument()
    })

    it('should render input field for fill-in-the-blank questions', () => {
      render(
        <QuizInterface 
          questions={[mockQuestions[1]]} 
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument()
      expect(screen.getByText('Complete the verse:')).toBeInTheDocument()
    })

    it('should show progress bar correctly', () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '50') // 1 of 2 questions = 50%
    })
  })

  describe('Timer Functionality', () => {
    it('should countdown timer correctly', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
          timeLimit={1} // 1 minute
        />
      )

      expect(screen.getByText('1:00')).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(1000) // Advance 1 second
      })

      await waitFor(() => {
        expect(screen.getByText('0:59')).toBeInTheDocument()
      })
    })

    it('should show warning when time is running low', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
          timeLimit={1}
        />
      )

      act(() => {
        jest.advanceTimersByTime(50000) // Advance to 10 seconds left
      })

      await waitFor(() => {
        const timeDisplay = screen.getByText('0:10')
        expect(timeDisplay).toHaveClass('text-red-600', 'font-bold')
      })
    })

    it('should auto-complete quiz when time runs out', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
          timeLimit={1}
        />
      )

      act(() => {
        jest.advanceTimersByTime(60000) // Advance full minute
      })

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
        expect(screen.getByText('Quiz Complete!')).toBeInTheDocument()
      })
    })
  })

  describe('Question Navigation', () => {
    it('should navigate to next question when answer is selected', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      // Select first answer
      const firstChoice = screen.getByText(/A\..*بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/)
      fireEvent.click(firstChoice)

      // Click next
      const nextButton = screen.getByText('Next')
      expect(nextButton).not.toBeDisabled()
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()
        expect(screen.getByText('Complete the verse:')).toBeInTheDocument()
      })
    })

    it('should not allow navigation without selecting an answer', () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })

    it('should allow going back to previous questions', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      // Answer first question and go to second
      const firstChoice = screen.getByText(/A\./)
      fireEvent.click(firstChoice)
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()
      })

      // Go back to first question
      const previousButton = screen.getByText('Previous')
      expect(previousButton).not.toBeDisabled()
      fireEvent.click(previousButton)

      await waitFor(() => {
        expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
      })
    })

    it('should preserve answers when navigating between questions', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      // Select answer on first question
      const firstChoice = screen.getByText(/A\./)
      fireEvent.click(firstChoice)
      expect(firstChoice).toHaveAttribute('data-state', 'selected')

      // Navigate away and back
      fireEvent.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Previous'))
      await waitFor(() => {
        expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
      })

      // Check that answer is still selected
      const selectedChoice = screen.getByText(/A\./)
      expect(selectedChoice).toHaveAttribute('data-state', 'selected')
    })
  })

  describe('Answer Handling', () => {
    it('should handle multiple choice selection correctly', () => {
      render(
        <QuizInterface 
          questions={[mockQuestions[0]]} 
          onComplete={mockOnComplete}
        />
      )

      const firstChoice = screen.getByText(/A\./)
      const secondChoice = screen.getByText(/B\./)

      // Select first choice
      fireEvent.click(firstChoice)
      expect(firstChoice).toHaveAttribute('data-state', 'selected')

      // Select second choice (should deselect first)
      fireEvent.click(secondChoice)
      expect(secondChoice).toHaveAttribute('data-state', 'selected')
      expect(firstChoice).not.toHaveAttribute('data-state', 'selected')
    })

    it('should handle fill-in-the-blank input correctly', async () => {
      render(
        <QuizInterface 
          questions={[mockQuestions[1]]} 
          onComplete={mockOnComplete}
        />
      )

      const input = screen.getByPlaceholderText('Type your answer here...')
      
      fireEvent.change(input, { target: { value: 'وَحَمَلْنَاهُمْ فِي الْبَرِّ وَالْبَحْرِ' } })
      
      expect(input).toHaveValue('وَحَمَلْنَاهُمْ فِي الْبَرِّ وَالْبَحْرِ')
      
      await waitFor(() => {
        const completeButton = screen.getByText('Complete')
        expect(completeButton).not.toBeDisabled()
      })
    })
  })

  describe('Quiz Completion', () => {
    it('should complete quiz and show results', async () => {
      render(
        <QuizInterface 
          questions={[mockQuestions[0]]} 
          onComplete={mockOnComplete}
        />
      )

      // Answer question
      const correctChoice = screen.getByText(/A\..*بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/)
      fireEvent.click(correctChoice)
      
      // Complete quiz
      const completeButton = screen.getByText('Complete')
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(screen.getByText('Quiz Complete!')).toBeInTheDocument()
        expect(screen.getByText('100%')).toBeInTheDocument()
        expect(screen.getByText('You got 1 out of 1 questions correct')).toBeInTheDocument()
        expect(screen.getByText('Excellent!')).toBeInTheDocument()
      })

      expect(mockOnComplete).toHaveBeenCalledWith([
        expect.objectContaining({
          questionId: 'q1',
          correct: true,
          userId: 'current-user',
        })
      ])
    })

    it('should calculate score correctly for mixed results', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      // Answer first question correctly
      fireEvent.click(screen.getByText(/A\..*بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/))
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()
      })

      // Answer second question incorrectly
      const input = screen.getByPlaceholderText('Type your answer here...')
      fireEvent.change(input, { target: { value: 'wrong answer' } })
      fireEvent.click(screen.getByText('Complete'))

      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument()
        expect(screen.getByText('You got 1 out of 2 questions correct')).toBeInTheDocument()
        expect(screen.getByText('Keep Practicing')).toBeInTheDocument()
      })
    })

    it('should show correct performance badges', async () => {
      render(
        <QuizInterface 
          questions={[mockQuestions[0]]} 
          onComplete={mockOnComplete}
        />
      )

      // Get 100% score
      fireEvent.click(screen.getByText(/A\..*بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/))
      fireEvent.click(screen.getByText('Complete'))

      await waitFor(() => {
        expect(screen.getByText('Excellent!')).toBeInTheDocument()
      })
    })

    it('should display results breakdown correctly', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      // Answer both questions (one correct, one incorrect)
      fireEvent.click(screen.getByText(/A\..*بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/))
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Type your answer here...')
        fireEvent.change(input, { target: { value: 'wrong answer' } })
        fireEvent.click(screen.getByText('Complete'))
      })

      await waitFor(() => {
        expect(screen.getByText('1', { selector: '.text-emerald-600' })).toBeInTheDocument()
        expect(screen.getByText('Correct Answers')).toBeInTheDocument()
        expect(screen.getByText('1', { selector: '.text-red-600' })).toBeInTheDocument()
        expect(screen.getByText('Incorrect Answers')).toBeInTheDocument()
      })
    })
  })

  describe('Quiz Restart', () => {
    it('should restart quiz correctly', async () => {
      render(
        <QuizInterface 
          questions={[mockQuestions[0]]} 
          onComplete={mockOnComplete}
          timeLimit={5}
        />
      )

      // Complete quiz
      fireEvent.click(screen.getByText(/A\./))
      fireEvent.click(screen.getByText('Complete'))

      await waitFor(() => {
        expect(screen.getByText('Quiz Complete!')).toBeInTheDocument()
      })

      // Restart quiz
      const restartButton = screen.getByText('Take Again')
      fireEvent.click(restartButton)

      await waitFor(() => {
        expect(screen.getByText('What is the opening verse of the Quran?')).toBeInTheDocument()
        expect(screen.getByText('Question 1 of 1')).toBeInTheDocument()
        expect(screen.getByText('5:00')).toBeInTheDocument()
      })

      // Check that no answers are selected
      const choices = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('A.') || 
        button.textContent?.includes('B.') ||
        button.textContent?.includes('C.') ||
        button.textContent?.includes('D.')
      )
      
      choices.forEach(choice => {
        expect(choice).not.toHaveAttribute('data-state', 'selected')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)

      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      const firstChoice = screen.getByText(/A\./)
      
      // Focus and select using keyboard
      firstChoice.focus()
      fireEvent.keyDown(firstChoice, { key: 'Enter' })
      
      expect(firstChoice).toHaveAttribute('data-state', 'selected')
    })

    it('should handle Arabic text rendering properly', () => {
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      const arabicText = screen.getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')
      expect(arabicText).toBeInTheDocument()
      expect(arabicText).toBeValidArabicText()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty questions array', () => {
      render(
        <QuizInterface 
          questions={[]} 
          onComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('No questions available')).toBeInTheDocument()
    })

    it('should handle malformed questions gracefully', () => {
      const malformedQuestion = {
        ...mockQuestions[0],
        choices: undefined as any
      }

      render(
        <QuizInterface 
          questions={[malformedQuestion]} 
          onComplete={mockOnComplete}
        />
      )

      // Should still render but with fallback behavior
      expect(screen.getByText('What is the opening verse of the Quran?')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should render within acceptable time limits', async () => {
      const startTime = performance.now()
      
      render(
        <QuizInterface 
          questions={mockQuestions} 
          onComplete={mockOnComplete}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('should handle large numbers of questions efficiently', () => {
      const manyQuestions = Array(100).fill(null).map((_, index) => ({
        ...mockQuestions[0],
        id: `q${index}`,
        prompt: `Question ${index + 1}`
      }))

      const startTime = performance.now()
      
      render(
        <QuizInterface 
          questions={manyQuestions} 
          onComplete={mockOnComplete}
        />
      )

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200) // Should still be fast
    })
  })
})