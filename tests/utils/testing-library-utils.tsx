import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { createMockUser } from '../fixtures/islamic-content'

// Mock user contexts for different roles
export const mockAuthContexts = {
  authenticated: {
    user: createMockUser('user'),
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  moderator: {
    user: createMockUser('moderator'),
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  admin: {
    user: createMockUser('admin'),
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  unauthenticated: {
    user: null,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  loading: {
    user: null,
    isLoading: true,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: keyof typeof mockAuthContexts
  initialQueries?: Array<{ queryKey: string[], queryFn: () => any }>
}

function AllTheProviders({ 
  children, 
  authContext = 'unauthenticated',
  initialQueries = []
}: { 
  children: React.ReactNode
  authContext?: keyof typeof mockAuthContexts
  initialQueries?: Array<{ queryKey: string[], queryFn: () => any }>
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })

  // Pre-populate query cache with initial data
  initialQueries.forEach(({ queryKey, queryFn }) => {
    queryClient.setQueryData(queryKey, queryFn())
  })

  // Mock AuthProvider with different contexts
  const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const contextValue = mockAuthContexts[authContext]
    
    return (
      <div data-testid="mock-auth-provider" data-auth-context={authContext}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { ...contextValue } as any)
          }
          return child
        })}
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        {children}
        <Toaster />
      </MockAuthProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { authContext = 'unauthenticated', initialQueries = [], ...renderOptions } = options
  
  return render(ui, {
    wrapper: (props) => AllTheProviders({ ...props, authContext, initialQueries }),
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Additional testing utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

export const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }))
}

export const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

// Mock window.matchMedia for responsive tests
export const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Helper for testing Arabic text rendering
export const getByArabicText = (container: HTMLElement, text: string) => {
  return container.querySelector(`[data-testid*="arabic"]:contains("${text}")`) ||
         container.querySelector(`:contains("${text}")`)
}

// Custom screen queries for Islamic content
export const islamicQueries = {
  getByArabicText: (text: string) => document.querySelector(`*:contains("${text}")`),
  getByTranslation: (text: string) => document.querySelector(`[data-testid*="translation"]:contains("${text}")`),
  getByVerseReference: (surah: number, verse: number) => 
    document.querySelector(`[data-surah="${surah}"][data-verse="${verse}"]`),
}

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  await waitForLoadingToFinish()
  const end = performance.now()
  return end - start
}

// Accessibility testing helpers
export const checkAriaLabels = (element: HTMLElement) => {
  const elementsNeedingLabels = element.querySelectorAll(
    'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby])'
  )
  return elementsNeedingLabels.length === 0
}

export const checkKeyboardNavigation = async (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  
  return {
    hasFocusableElements: focusableElements.length > 0,
    elementsCount: focusableElements.length,
    elements: Array.from(focusableElements)
  }
}