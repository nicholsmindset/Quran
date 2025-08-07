# Backend API Documentation

## Overview

This document describes the backend API implementation for the Qur'an Verse Challenge application, built with Next.js 15, Supabase, and TypeScript.

## Sprint 1 Implementation Status

### ✅ Completed Tasks

#### T001: Setup Supabase Auth
- [x] Supabase client configuration (`src/lib/supabase.ts`)
- [x] Environment variables setup (`.env.example`)
- [x] TypeScript database types defined

#### T002: Create users table with roles
- [x] Users table schema with roles (learner/teacher/scholar)
- [x] Database schema file (`supabase/schema.sql`)
- [x] Proper UUID primary keys and timestamps

#### T003: Implement registration API
- [x] `POST /api/auth/register` endpoint
- [x] Input validation with Zod
- [x] Password hashing via Supabase Auth
- [x] User profile creation in database

#### T004: Implement login/logout flow
- [x] `POST /api/auth/login` endpoint  
- [x] `POST /api/auth/logout` endpoint
- [x] JWT token management
- [x] Session handling

#### T005: Setup RLS policies for users
- [x] Row Level Security enabled
- [x] Users can only access own data
- [x] Scholars/teachers have elevated access
- [x] Comprehensive RLS policies

#### T006: Design verses table schema
- [x] Verses table with surah/ayah indexing
- [x] Arabic text and English translation columns
- [x] UTF-8 collation for Arabic support
- [x] Unique constraints on (surah, ayah)

#### T007: Source authentic Qur'anic text data
- [x] Sample Qur'anic text data structure
- [x] Data validation functions
- [x] Source documentation and verification process

#### T008: Create verse seed script
- [x] Comprehensive seeding script (`scripts/seed-verses.ts`)
- [x] Batch processing for performance
- [x] Error handling and validation
- [x] npm scripts for easy execution

#### T009: Validate Arabic text encoding
- [x] UTF-8 encoding validation functions
- [x] Arabic Unicode range checking
- [x] Corruption detection

#### T010: Create database indexes
- [x] Performance indexes on key columns
- [x] Text search optimization for Arabic
- [x] Foreign key relationship indexes

#### T011: Design questions table schema
- [x] Questions table with verse relationships
- [x] Multiple choice support (JSONB array)
- [x] Difficulty levels and approval workflow
- [x] Created_by tracking

#### T012: Design attempts table schema
- [x] User attempts tracking
- [x] Correctness and timestamp recording
- [x] Unique constraint (user_id, question_id)
- [x] Foreign key relationships

#### T013: Create approval workflow API endpoints
- [x] `GET /api/questions/pending` (scholars only)
- [x] `POST /api/questions/{id}/approve` (scholars only)
- [x] `POST /api/questions/{id}/reject` (scholars only)
- [x] Proper authorization and validation

#### T014: Setup RLS for questions/attempts
- [x] RLS policies for questions table
- [x] Users see only approved questions
- [x] Scholars see all questions including pending
- [x] Users access only their own attempts

#### T015: Create audit logging system
- [x] Audit logs table for approval actions
- [x] Automatic logging via database triggers
- [x] Scholar action tracking
- [x] Queryable audit trail

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'learner' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### verses
```sql
CREATE TABLE verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surah INTEGER NOT NULL CHECK (surah >= 1 AND surah <= 114),
    ayah INTEGER NOT NULL CHECK (ayah >= 1),
    arabic_text TEXT NOT NULL,
    translation_en TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(surah, ayah)
);
```

#### questions
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verse_id UUID NOT NULL REFERENCES verses(id),
    prompt TEXT NOT NULL,
    choices JSONB NOT NULL CHECK (jsonb_array_length(choices) >= 2),
    answer TEXT NOT NULL,
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### attempts
```sql
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);
```

### Supporting Tables

- **streaks**: User progress tracking
- **audit_logs**: Approval action logging

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json
Authorization: Not required

{
  "email": "user@example.com",
  "password": "securepassword123",
  "role": "learner" // Optional: learner|teacher|scholar
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "learner",
      "created_at": "2025-01-08T10:00:00Z"
    },
    "message": "Registration successful. Please check your email to confirm your account."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json
Authorization: Not required

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "learner",
      "created_at": "2025-01-08T10:00:00Z"
    },
    "session": {
      "access_token": "jwt_token_here",
      "refresh_token": "refresh_token_here",
      "expires_at": 1704715200
    },
    "message": "Login successful"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### Questions Management

#### Get Pending Questions (Scholars Only)
```http
GET /api/questions/pending?page=1&limit=10
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "prompt": "Which verse mentions the word 'Rahman'?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "difficulty": "medium",
      "created_at": "2025-01-08T10:00:00Z",
      "verses": {
        "surah": 1,
        "ayah": 3,
        "arabic_text": "الرَّحْمَـٰنِ الرَّحِيمِ",
        "translation_en": "The Entirely Merciful, the Especially Merciful,"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Approve Question (Scholars Only)
```http
POST /api/questions/{id}/approve
Authorization: Bearer <access_token>
```

#### Reject Question (Scholars Only)
```http
POST /api/questions/{id}/reject
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Question needs improvement in clarity"
}
```

#### Get Approved Questions
```http
GET /api/questions/approved?page=1&limit=10&difficulty=medium&exclude_attempted=true
Authorization: Bearer <access_token>
```

### Quiz Attempts

#### Submit Answer
```http
POST /api/attempts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "question_id": "uuid",
  "correct": true
}
```

#### Get User Attempts
```http
GET /api/attempts?page=1&limit=10
Authorization: Bearer <access_token>
```

## Row Level Security (RLS)

### Users Table
- Users can read/update their own data only
- Scholars and teachers can view all users
- Role changes require elevated permissions

### Verses Table
- All authenticated users can read verses
- Only teachers and scholars can insert verses

### Questions Table
- Users see only approved questions
- Scholars see all questions (including pending)
- Only teachers and scholars can create questions
- Only scholars can approve/update questions

### Attempts Table
- Users can only access their own attempts
- Teachers and scholars can view all attempts
- Users can insert their own attempts only

### Audit Logs
- Only scholars can read and write audit logs
- Automatic logging via database triggers

## Database Functions and Triggers

### User Streak Management
- Automatic streak creation when user registers
- Streak updates when attempts are made
- Tracks current and longest streaks

### Question Approval Logging
- Automatic audit logging when questions approved
- Tracks scholar ID and timestamp

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env.local` and configure:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Schema
Run the SQL schema in Supabase:
```bash
# Copy contents of supabase/schema.sql to Supabase SQL Editor
```

### 3. Seed Sample Data
```bash
npm run seed:verses
```

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "details": [] // Optional validation details
}
```

## Security Features

- **Authentication**: JWT tokens via Supabase Auth
- **Authorization**: Role-based access control (RBAC)
- **Row Level Security**: Database-level access control
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries via Supabase
- **CORS**: Configured for allowed origins only
- **Rate Limiting**: Via Vercel/Supabase built-in protections

## Performance Optimizations

- **Database Indexes**: Strategic indexes on frequently queried columns
- **Batch Operations**: Efficient seeding and updates
- **Connection Pooling**: Via Supabase managed connections
- **Caching**: Browser and server-side caching headers
- **Pagination**: All list endpoints support pagination

## Development Notes

- TypeScript strict mode enabled
- ESLint and Prettier configured
- Pre-commit hooks for code quality
- Comprehensive error logging
- Development vs production configurations