# Daily Quiz System - Technical Documentation

## Overview

The Daily Quiz System is the core backend implementation for the Quran Verse Challenge SaaS platform. It provides a complete quiz engine with session management, progress tracking, and performance optimization.

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Routes    │    │   Quiz Engine   │    │   Database      │
│                 │    │                 │    │                 │
│ • Daily Quiz    │◄──►│ • Generation    │◄──►│ • Questions     │
│ • Sessions      │    │ • State Mgmt    │    │ • Sessions      │
│ • Progress      │    │ • Validation    │    │ • Attempts      │
│ • Users         │    │ • Scoring       │    │ • Streaks       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- **Daily Quiz Generation**: Balanced 5-question quizzes (2 easy, 2 medium, 1 hard)
- **Session Management**: Resume functionality with 15-second auto-save
- **Progress Tracking**: Streaks, accuracy metrics, performance analytics
- **Timezone Support**: 4 AM local time quiz reset
- **Performance Optimized**: <300ms P95 response time
- **Scalable Architecture**: Supports millions of users

## API Endpoints

### Daily Quiz Management

#### `GET /api/quiz/daily`
Get today's daily quiz with completion status.

**Query Parameters:**
- `timezone` (string, optional): User timezone (default: UTC)

**Response:**
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "uuid",
      "date": "2024-01-15",
      "questions": [...],
      "questionIds": ["uuid1", "uuid2", ...]
    },
    "status": {
      "hasCompletedToday": false,
      "currentSession": null,
      "streakInfo": { "current": 5, "longest": 12 }
    },
    "metadata": {
      "timezone": "UTC",
      "questionCount": 5,
      "difficulties": { "easy": 2, "medium": 2, "hard": 1 }
    }
  }
}
```

#### `POST /api/quiz/daily/generate`
Generate daily quiz (CRON/Admin endpoint).

**Authorization:** Requires teacher/scholar role
**Body:**
```json
{
  "date": "2024-01-15",
  "force": false
}
```

#### `GET /api/quiz/daily/status`
Check user's completion status.

**Query Parameters:**
- `timezone` (string): User timezone
- `include_details` (boolean): Include detailed progress info

### Quiz Session Management

#### `POST /api/quiz/session/start`
Start new quiz session.

**Body:**
```json
{
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "currentQuestionIndex": 0,
      "totalQuestions": 5,
      "status": "in_progress"
    },
    "quiz": { "questions": [...] }
  }
}
```

#### `GET /api/quiz/session/{id}`
Get session state with progress.

#### `PUT /api/quiz/session/{id}/answer`
Submit answer and save state.

**Body:**
```json
{
  "question_id": "uuid",
  "answer": "A",
  "move_to_next": true,
  "time_spent": 15000
}
```

#### `POST /api/quiz/session/{id}/complete`
Complete quiz and get results.

**Body:**
```json
{
  "final_answers": { "question_id": "answer" },
  "force_complete": false
}
```

### User Progress & Analytics

#### `GET /api/user/progress`
Comprehensive progress statistics.

**Query Parameters:**
- `period`: week, month, 3months, year, all
- `include_breakdown`: boolean
- `timezone`: string

#### `GET /api/user/streaks`
Detailed streak information with calendar view.

#### `POST /api/user/activity`
Record learning activity events.

## Database Schema

### Core Tables

```sql
-- Daily quiz configurations
daily_quizzes (
  id UUID PRIMARY KEY,
  date DATE UNIQUE,
  question_ids UUID[],
  created_at TIMESTAMPTZ
)

-- Quiz sessions with state
quiz_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  daily_quiz_id UUID REFERENCES daily_quizzes(id),
  current_question_index INTEGER,
  answers JSONB,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'expired')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  timezone TEXT,
  UNIQUE(user_id, daily_quiz_id, status)
)

-- User streaks and progress
streaks (
  user_id UUID PRIMARY KEY,
  current_streak INTEGER,
  longest_streak INTEGER,
  updated_at TIMESTAMPTZ
)
```

### Database Functions

- `update_user_streak(user_id)`: Updates streak on quiz completion
- `reset_user_streak(user_id)`: Resets streak on missed day
- `get_balanced_quiz_questions()`: Selects balanced difficulty questions

## Quiz Engine Implementation

### Core Class: `quiz-engine.ts`

```typescript
// Key functions
export async function generateDailyQuiz(date: string): Promise<DailyQuiz>
export async function startQuizSession(userId: string, dailyQuizId: string, timezone: string): Promise<QuizSession>
export async function saveQuizAnswer(sessionId: string, questionId: string, answer: string): Promise<QuizSession>
export async function completeQuizSession(sessionId: string): Promise<QuizResult>
export async function getUserQuizStatus(userId: string, timezone: string): Promise<QuizStatus>
```

### Question Selection Algorithm

1. **Difficulty Balance**: Ensures 2 easy, 2 medium, 1 hard question
2. **Surah Diversity**: Prioritizes questions from different surahs
3. **Approval Validation**: Only uses scholar-approved questions
4. **Randomization**: Shuffles questions for variety
5. **Caching**: Caches generated quizzes to avoid regeneration

### Session State Management

- **Auto-Save**: Saves state every 15 seconds
- **Resume Support**: Maintains exact position and answers
- **Timeout Handling**: 24-hour session expiry
- **Concurrency Safe**: Prevents multiple active sessions

### Performance Optimizations

- **Query Optimization**: Indexed database queries
- **Caching Strategy**: In-memory quiz caching
- **Connection Pooling**: Efficient database connections
- **Lazy Loading**: Questions loaded on demand
- **Response Compression**: Gzip API responses

## CRON Jobs

### Daily Quiz Generation

**Endpoint:** `POST /api/cron/daily-quiz-generation`
**Schedule:** Every hour from 3-5 AM GMT
**Purpose:** Pre-generate quizzes for all timezones

**Authorization:**
```bash
curl -X POST /api/cron/daily-quiz-generation \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Cleanup Operations

- Remove completed sessions older than 30 days
- Archive daily quizzes older than 7 days
- Expire inactive sessions after 24 hours

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Quiz System Test
```bash
npm run test:quiz
# or
tsx scripts/test-quiz-system.ts
```

### Load Testing
```bash
npm run test:load
```

## Deployment

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=your-secret-key
```

### Database Setup
1. Run `src/lib/database-functions.sql` in Supabase SQL editor
2. Ensure RLS policies are enabled
3. Verify indexes are created

### CRON Configuration (Vercel)
```json
{
  "crons": [{
    "path": "/api/cron/daily-quiz-generation",
    "schedule": "0 4 * * *"
  }]
}
```

## Monitoring & Analytics

### Key Metrics
- Quiz completion rate
- Average session duration
- Question difficulty accuracy
- User engagement patterns
- API response times

### Performance Targets
- **P95 Response Time**: <300ms
- **Quiz Generation**: <2s
- **Session Resume**: <200ms
- **Completion Rate**: >80%

### Error Monitoring
- Failed quiz generations
- Session timeout rates
- Database connection issues
- CRON job failures

## Security

### Authentication
- JWT token validation on all endpoints
- Role-based access control
- Session ownership verification

### Data Protection
- RLS policies on all tables
- Input validation with Zod schemas
- SQL injection prevention
- Rate limiting on CRON endpoints

### Privacy
- User data anonymization options
- GDPR compliance ready
- Audit logging for admin actions

## Troubleshooting

### Common Issues

**Quiz Generation Fails**
- Check approved question count (need 5+ per difficulty)
- Verify database connectivity
- Review question distribution across surahs

**Session Resume Issues**
- Verify session hasn't expired (24h limit)
- Check user ownership of session
- Validate session status

**Performance Degradation**
- Monitor database query performance
- Check connection pool limits
- Review caching effectiveness

**CRON Job Failures**
- Verify authorization token
- Check external service connectivity
- Review logs for error patterns

### Debug Commands
```bash
# Test database connection
npm run db:test

# Validate question pool
npm run questions:validate

# Check CRON endpoint
curl -X GET /api/cron/daily-quiz-generation

# Run system health check
npm run health:check
```

## Contributing

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Comprehensive error handling
- Unit test coverage >80%

### Development Workflow
1. Create feature branch
2. Implement with tests
3. Run full test suite
4. Submit PR with documentation

### Performance Guidelines
- Database queries <100ms
- API endpoints <300ms P95
- Memory usage <100MB per instance
- CPU usage <30% average

## Support

For technical issues or questions:
- Review API documentation
- Check test suite examples
- Run diagnostic scripts
- Submit GitHub issues with logs