# Qur'an Verse Challenge - DevOps Setup Documentation

## Project Overview

This is a Next.js 18 TypeScript project for the Qur'an Verse Challenge SaaS application. The project is configured with modern development tools and automated deployment to Vercel.

## Technology Stack

- **Framework**: Next.js 18 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4
- **Code Quality**: ESLint + Prettier
- **Pre-commit**: Husky + lint-staged
- **Deployment**: Vercel
- **Database**: Supabase (PostgreSQL)

## Quick Start

1. **Clone and Install**:

   ```bash
   git clone <repository-url>
   cd quran-verse-challenge
   npm install
   ```

2. **Environment Setup**:

   ```bash
   cp .env.example .env.local
   # Fill in your actual environment variables
   ```

3. **Development Server**:

   ```bash
   npm run dev
   ```

4. **Open**: http://localhost:3000

## Development Commands

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start development server with Turbopack |
| `npm run build`        | Build for production                    |
| `npm run start`        | Start production server                 |
| `npm run lint`         | Run ESLint                              |
| `npm run lint:fix`     | Fix ESLint issues                       |
| `npm run format`       | Format with Prettier                    |
| `npm run format:check` | Check Prettier formatting               |
| `npm run type-check`   | TypeScript type checking                |

## Project Structure

```
/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Reusable UI components
│   ├── lib/          # Utility functions
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
├── tests/            # Test files
├── docs/             # Documentation
└── config files      # ESLint, TypeScript, etc.
```

## Code Quality Standards

### TypeScript Configuration

- Strict mode enabled
- Additional safety checks (noUncheckedIndexedAccess, noImplicitReturns)
- Path aliases configured (@/_ for src/_)

### ESLint Rules

- Next.js recommended rules
- TypeScript integration
- React best practices
- Import/export standards

### Prettier Configuration

- Single quotes for JS/TS
- 100 character line width
- Trailing commas (ES5)
- LF line endings

### Pre-commit Hooks

- Automatic ESLint fixing
- Prettier formatting
- TypeScript type checking

## Environment Variables

Required environment variables (see .env.example):

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service key
- `OPENAI_API_KEY`: OpenAI API key for quiz generation
- `NEXTAUTH_SECRET`: NextAuth.js secret key

## Deployment

### Vercel Deployment

1. **Connect to Vercel**:
   - Import project from Git repository
   - Vercel will auto-detect Next.js configuration

2. **Environment Variables**:
   - Add all production environment variables
   - Configure different values for staging/production

3. **Automatic Deployments**:
   - Main branch → Production deployment
   - Pull requests → Preview deployments

### Manual Deployment

```bash
npm run build
npm run start
```

## Development Workflow

1. **Create Feature Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Development**:
   - Make changes
   - Pre-commit hooks run automatically
   - Fix any linting/formatting issues

3. **Testing**:

   ```bash
   npm run type-check
   npm run lint
   npm run format:check
   ```

4. **Commit & Push**:

   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**:
   - Vercel will create preview deployment
   - Code review and merge

## Performance Requirements

- P95 API latency < 300ms
- Bundle size < 500KB initial load
- Core Web Vitals compliance
- WCAG 2.1 AA accessibility

## Security

- Environment variables properly configured
- Security headers in Vercel config
- Row-level security with Supabase
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **ESLint Conflicts**:

   ```bash
   npm run lint:fix
   ```

2. **TypeScript Errors**:

   ```bash
   npm run type-check
   ```

3. **Environment Variables**:
   - Check .env.local file exists
   - Verify variable names match .env.example

4. **Build Issues**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

### Getting Help

1. Check the logs in Vercel dashboard
2. Run development server locally to debug
3. Use TypeScript strict mode for better error detection
4. Refer to Next.js documentation for framework-specific issues

## Next Steps

1. Complete Supabase setup (Backend Agent task)
2. Implement authentication system
3. Set up verse database
4. Create quiz generation pipeline
5. Build user interface components

## Task Completion Status

- ✅ T016: Next.js project initialized
- ✅ T017: TypeScript configuration complete
- ✅ T018: ESLint and Prettier configured
- ✅ T019: Vercel deployment ready
- ✅ T020: Environment variables template created

All DevOps setup tasks completed successfully!
