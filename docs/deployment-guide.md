# Qur'an Verse Challenge - Deployment Guide

## 🚀 Sprint 2 Deployment Pipeline

This guide covers the complete deployment process for the Qur'an Verse Challenge from staging to production.

## Prerequisites

### Required Accounts & Services
- **Vercel Account**: For application hosting
- **Supabase Project**: For database and authentication
- **OpenAI API Key**: For AI question generation
- **GitHub Repository**: For source code and CI/CD

### Required Environment Variables

#### Staging Environment
```bash
# Supabase (Staging)
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your-staging-anon-key
STAGING_SUPABASE_SERVICE_KEY=your-staging-service-role-key

# OpenAI
STAGING_OPENAI_API_KEY=your-openai-api-key

# Vercel
VERCEL_TOKEN=your-vercel-api-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID_STAGING=your-staging-project-id
```

#### Production Environment
```bash
# Supabase (Production)
PRODUCTION_SUPABASE_URL=https://your-production-project.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=your-production-anon-key
PRODUCTION_SUPABASE_SERVICE_KEY=your-production-service-role-key

# OpenAI
PRODUCTION_OPENAI_API_KEY=your-production-openai-api-key

# Vercel
VERCEL_PROJECT_ID_PRODUCTION=your-production-project-id
```

## 🏗️ Infrastructure Setup

### 1. Supabase Database Setup

#### Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and fill in project details
4. Wait for project creation (2-3 minutes)

#### Configure Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Execute the schema setup script:
   ```bash
   # Copy the contents of scripts/setup-supabase.sql
   # Paste into SQL Editor and execute
   ```

#### Seed Verse Database
```bash
# From project root
npm run seed:verses
```

#### Configure Authentication
1. Go to Authentication → Settings
2. Set up email configuration
3. Configure redirect URLs:
   - Staging: `https://quran-verse-challenge-staging.vercel.app/auth/callback`
   - Production: `https://quran-verse-challenge.vercel.app/auth/callback`

### 2. Vercel Project Setup

#### Create Vercel Projects
```bash
# Install Vercel CLI
npm install -g vercel@latest

# Create staging project
vercel --name quran-verse-challenge-staging

# Create production project
vercel --name quran-verse-challenge
```

#### Configure Environment Variables
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required environment variables for each environment

## 🚢 Deployment Process

### Option 1: Automated Deployment (Recommended)

#### GitHub Actions Setup
1. Go to GitHub Repository → Settings → Secrets and Variables → Actions
2. Add all required secrets
3. Push to respective branches to trigger deployments:
   - `develop` or `staging` branch → Staging deployment
   - `main` branch → Production deployment

#### Deployment Workflow
```bash
# For staging deployment
git checkout develop
git add .
git commit -m "feat: ready for staging deployment"
git push origin develop

# For production deployment
git checkout main
git merge develop
git push origin main
```

### Option 2: Manual Deployment

#### Staging Deployment
```bash
# Set environment variables
export VERCEL_TOKEN=your-token
export STAGING_SUPABASE_URL=your-staging-url
export STAGING_SUPABASE_ANON_KEY=your-staging-key
export STAGING_SUPABASE_SERVICE_KEY=your-staging-service-key
export STAGING_OPENAI_API_KEY=your-openai-key

# Run deployment script
./scripts/deploy-staging.sh
```

#### Production Deployment
```bash
# Configure production environment variables
# Run production deployment (similar to staging but with production vars)
vercel --prod
```

## 🧪 Testing & Validation

### Pre-deployment Testing
```bash
# Run all quality gates
npm run test:ci
npm run lint
npm run type-check
npm run format:check

# Security scan
npm audit --audit-level=high
```

### Post-deployment Testing
```bash
# Health check
curl -f https://your-deployment-url/api/health

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:accessibility

# Performance audit
npm run lighthouse
```

## 📊 Monitoring & Observability

### Vercel Analytics
- Automatically enabled for all deployments
- View in Vercel Dashboard → Analytics

### Supabase Monitoring
- Database performance metrics
- Authentication analytics
- Real-time usage stats

### Error Tracking
- Vercel Functions logs
- Supabase logs
- Client-side error tracking

## 🔒 Security Configuration

### Vercel Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Supabase Security
- Row Level Security (RLS) enabled
- User role-based access control
- Service key protection

### API Security
- Rate limiting on API routes
- Input validation and sanitization
- CORS configuration

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Database Connection Issues
1. Verify Supabase URL and keys
2. Check network connectivity
3. Validate RLS policies

#### Environment Variable Issues
1. Ensure all required vars are set
2. Check for typos in variable names
3. Verify values are correct

#### Performance Issues
1. Check bundle size analysis
2. Review Lighthouse audit results
3. Monitor API response times

### Rollback Procedure
1. Go to Vercel Dashboard
2. Find previous successful deployment
3. Click "Promote to Production"
4. Verify rollback success

## 📈 Performance Requirements

### Core Web Vitals
- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

### API Performance
- **Response Time**: < 300ms (P95)
- **Availability**: 99.9% uptime
- **Error Rate**: < 0.1%

### Bundle Size
- **Initial Bundle**: < 500KB
- **Total Bundle**: < 2MB
- **JavaScript**: < 1MB

## 🎯 Success Criteria

### Staging Deployment ✅
- [ ] Application accessible at staging URL
- [ ] Database connected and seeded with verses
- [ ] Authentication system functional
- [ ] AI question generation working
- [ ] Scholar moderation interface accessible
- [ ] All API endpoints responding correctly
- [ ] E2E tests passing
- [ ] Performance metrics within targets

### Production Deployment ✅
- [ ] Zero-downtime deployment
- [ ] All staging criteria met
- [ ] Production monitoring active
- [ ] SSL certificates valid
- [ ] CDN configuration optimal
- [ ] Error tracking operational
- [ ] Performance monitoring enabled

## 🔗 Useful Links

- **Staging URL**: https://quran-verse-challenge-staging.vercel.app
- **Production URL**: https://quran-verse-challenge.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Actions**: https://github.com/your-repo/actions

## 📞 Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Consult this deployment guide
4. Check GitHub Actions workflow status

---

**Last Updated**: Sprint 2 - Complete Production Deployment Pipeline
**Status**: Ready for staging deployment