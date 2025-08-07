# Qur'an Verse Challenge - Comprehensive Test Suite

This directory contains the complete testing infrastructure for the Qur'an Verse Challenge SaaS project, implementing QA best practices with specialized focus on Islamic content and Arabic text handling.

## 📋 Testing Overview

### Quality Requirements
- **95% Unit Test Coverage Gate** - All code must maintain 95% coverage
- **P95 API Latency < 300ms** - 95th percentile response time requirement  
- **WCAG 2.1 AA Compliance** - Full accessibility compliance for inclusive Islamic learning
- **Islamic Content Accuracy** - Specialized validation for Arabic text and Quranic references

### Test Categories

#### 🧪 Unit Tests (`__tests__/unit/`)
- **Coverage Target**: 95% (enforced by CI/CD)
- **Focus Areas**:
  - Authentication and authorization logic
  - AI question generation with Islamic content validation
  - Quiz interface with Arabic text rendering
  - Islamic content utilities and helpers
  - API route handlers

#### 🔗 Integration Tests (`__tests__/integration/`)
- **Scope**: API endpoints with database interactions
- **Key Areas**:
  - Authentication flow with Supabase
  - Question approval workflow
  - Quiz attempt recording and progress tracking
  - AI question generation pipeline

#### 🎭 E2E Tests (`tests/e2e/`)
- **Framework**: Playwright with multi-browser support
- **Critical Flows**:
  - User registration and login
  - Complete quiz-taking journey
  - Dashboard and progress tracking
  - Moderator question approval workflow
- **Arabic Support**: RTL text rendering and mixed content handling

#### ♿ Accessibility Tests
- **Standard**: WCAG 2.1 AA compliance
- **Tools**: jest-axe + Playwright axe integration
- **Islamic-Specific**: Arabic text accessibility, RTL layouts
- **Coverage**: All user interfaces and interactive elements

#### ⚡ Load Testing (`tests/load/`)
- **Tool**: Artillery with Islamic content scenarios
- **Requirements**: P95 response time < 300ms
- **Scenarios**: Authentication, quiz flow, AI generation, moderation
- **Islamic Context**: Arabic text processing performance

### 🕌 Islamic Content Testing

#### Arabic Text Validation
- **Unicode Range Testing**: Validates Arabic characters (U+0600-U+06FF)
- **RTL Layout Testing**: Right-to-left text rendering
- **Mixed Content**: Arabic and English text handling
- **Font Rendering**: Arabic typography and diacritics

#### Quranic Content Accuracy
- **Verse References**: Surah and Ayah validation (1-114, 1-286)
- **Arabic Text Integrity**: Uthmani script preservation
- **Translation Accuracy**: English translation consistency
- **Topic Classification**: Islamic themes and concepts

#### Custom Matchers
```typescript
// Custom Jest matchers for Islamic content
expect(arabicText).toBeValidArabicText()
expect(verseRef).toBeValidQuranReference()
expect(question).toHaveValidIslamicContent()
```

## 🛠 Test Infrastructure

### Test Setup
```bash
# Install dependencies
npm ci --legacy-peer-deps

# Setup test environment
npm run test:setup
```

### Running Tests

#### Quick Commands
```bash
# Run all tests
npm run test:all

# Individual test suites
npm run test                    # Unit tests
npm run test:integration        # Integration tests  
npm run test:e2e               # E2E tests
npm run test:accessibility     # Accessibility tests
npm run test:load              # Load tests

# Coverage and quality
npm run test:coverage          # Unit tests with coverage
npm run test:ci               # Full CI pipeline
```

#### Advanced Testing
```bash
# Arabic text focused tests
npm test -- --testNamePattern="Arabic"

# Islamic content validation
npm test -- --testNamePattern="Islamic"

# Performance tests only
npm test -- --testNamePattern="Performance"

# Watch mode for development
npm run test:watch
```

### Custom Test Runner
```bash
# Full QA pipeline
node tests/utils/test-runner.js all

# Specific test suites
node tests/utils/test-runner.js unit integration
node tests/utils/test-runner.js accessibility islamic
```

## 📊 Coverage and Quality Gates

### Coverage Requirements
```javascript
// Jest coverage thresholds
coverageThreshold: {
  global: {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95,
  },
  // Critical files require 100% coverage
  './src/lib/auth.ts': 100,
  './src/lib/ai-question-generator.ts': 100,
  './src/components/quiz/quiz-interface.tsx': 100,
}
```

### Quality Gates (CI/CD)
1. **Code Quality**: ESLint, Prettier, TypeScript
2. **Unit Tests**: 95% coverage requirement
3. **Integration Tests**: API and database validation
4. **E2E Tests**: Complete user workflows
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Load Testing**: P95 < 300ms performance
7. **Islamic Content**: Arabic text and accuracy validation
8. **Security**: Dependency and vulnerability scanning

## 🔧 Configuration Files

### Core Config
- `jest.config.js` - Jest configuration with Islamic content matchers
- `playwright.config.ts` - E2E testing with Arabic text support
- `tests/setup.ts` - Global test environment setup
- `tests/mocks/server.ts` - MSW API mocking

### Artillery Load Testing
- `tests/load/artillery.yml` - Load test configuration
- `tests/load/processor.js` - Custom Islamic content scenarios

### Test Utilities
- `tests/utils/testing-library-utils.tsx` - Enhanced React Testing Library
- `tests/fixtures/islamic-content.ts` - Test data and factories
- `tests/utils/test-runner.js` - Custom test orchestration

## 🚀 CI/CD Integration

### GitHub Actions Workflow
- **File**: `.github/workflows/qa-testing.yml`
- **Triggers**: Push, PR, scheduled daily runs
- **Quality Gates**: All 8 testing phases must pass
- **Deployment**: Automated release on main branch success

### Performance Monitoring
- **Bundle Size**: Tracked and reported
- **Load Test Results**: P95 latency validation
- **Accessibility Scores**: WCAG compliance monitoring
- **Arabic Text Performance**: RTL rendering metrics

## 🔍 Debugging Tests

### Common Issues

#### Arabic Text Rendering
```bash
# Test Arabic text specifically
npm test -- --testNamePattern="Arabic" --verbose

# Debug Arabic text in E2E
PWDEBUG=1 npx playwright test tests/e2e/quiz-flow.spec.ts
```

#### Accessibility Failures
```bash
# Run accessibility tests with detailed output
npm run test:accessibility -- --verbose

# E2E accessibility debugging
npx playwright test tests/e2e/accessibility.spec.ts --debug
```

#### Load Test Issues
```bash
# Run single load test scenario
artillery run tests/load/artillery.yml --scenario "Authentication Flow"

# Debug performance
npm run test:load -- --verbose
```

### Test Data Management
```typescript
// Using test factories
import { createMockQuestion, createMockUser } from '../fixtures/islamic-content'

const islamicQuestion = createMockQuestion({
  arabic_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  difficulty: 'easy'
})
```

## 📈 Reporting

### Generated Reports
- `coverage/` - Test coverage reports
- `tests/reports/playwright-html/` - E2E test results
- `tests/reports/load-test-*` - Performance test results
- `tests/reports/accessibility-*` - WCAG compliance reports

### Key Metrics Tracked
- **Test Coverage**: Line, branch, function coverage
- **Performance**: Response times, bundle sizes
- **Accessibility**: WCAG violations and scores
- **Islamic Content**: Arabic text tests and accuracy
- **Quality**: ESLint issues, TypeScript errors

## 🤝 Contributing

### Writing Tests
1. **Unit Tests**: Follow AAA pattern (Arrange, Act, Assert)
2. **Islamic Content**: Use custom matchers for Arabic text
3. **E2E Tests**: Include Arabic text and RTL layout validation
4. **Accessibility**: Test keyboard navigation and screen readers
5. **Performance**: Consider Arabic text rendering impact

### Test Naming Convention
```typescript
describe('Component/Function Name', () => {
  describe('Feature/Behavior', () => {
    it('should do specific action when condition', () => {
      // Test implementation
    })
    
    it('should handle Arabic text correctly', () => {
      // Islamic content specific test
    })
    
    it('should be accessible to screen readers', () => {
      // Accessibility test
    })
  })
})
```

### Quality Checklist
- [ ] 95% code coverage achieved
- [ ] Arabic text handling tested
- [ ] Accessibility requirements met
- [ ] Performance impact assessed
- [ ] Islamic content accuracy verified
- [ ] E2E user flows covered
- [ ] Error scenarios tested

---

## 📞 Support

For test-related questions or issues:
1. Check existing test patterns in similar components
2. Review Islamic content test fixtures
3. Consult accessibility testing documentation
4. Verify performance impact of changes

**Quality Assurance Focus**: Ensuring accurate, accessible, and performant Islamic learning experience through comprehensive testing.