# Production Deployment Instructions

## 🚀 Sprint 3 Production Launch Guide

This guide provides step-by-step instructions to deploy the complete Qur'an Verse Challenge application to production.

---

## Prerequisites ✅

- [x] Next.js application built successfully (`npm run build`)
- [x] Supabase project configured with environment variables
- [x] Vercel account with deployment permissions
- [x] OpenAI API key configured
- [x] All environment files prepared

---

## Phase 1: Database Schema Deployment

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jqhtumofrkitdcfnyeue`
3. Navigate to "SQL Editor"

### 2. Execute Schema Scripts (In Order)
```sql
-- Step 1: Base schema with users, verses, questions, attempts
-- Copy and paste contents of: supabase/schema.sql

-- Step 2: AI features with embeddings and batch processing
-- Copy and paste contents of: supabase/ai-schema-updates.sql

-- Step 3: Group management and teacher features
-- Copy and paste contents of: supabase/group-management-schema.sql
```

### 3. Verify Schema Deployment
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should show 15+ tables including:
-- users, verses, questions, attempts, groups, etc.
```

### 4. Seed Initial Data
```bash
# Load environment and run seeding
cd /path/to/quran-project
npm run seed:verses
```

---

## Phase 2: Staging Deployment

### 1. Configure Staging Environment
```bash
# Copy staging environment template
cp .env.staging .env.staging.local

# Edit .env.staging.local with actual values:
NEXT_PUBLIC_SUPABASE_URL=https://jqhtumofrkitdcfnyeue.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
OPENAI_API_KEY=[openai-key]
NEXT_PUBLIC_APP_URL=https://quran-verse-challenge-staging.vercel.app
NEXTAUTH_URL=https://quran-verse-challenge-staging.vercel.app
NEXTAUTH_SECRET=[generate-secret]
```

### 2. Deploy to Vercel Staging
```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to staging
vercel --prod \
  --env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --env OPENAI_API_KEY="$OPENAI_API_KEY" \
  --env NEXT_PUBLIC_APP_URL="https://quran-verse-challenge-staging.vercel.app" \
  --env NEXTAUTH_URL="https://quran-verse-challenge-staging.vercel.app" \
  --env NEXTAUTH_SECRET="staging-secret-$(date +%s)" \
  --env VERCEL_ENV="staging"
```

### 3. Test Staging Environment
```bash
# Test health endpoint
curl https://quran-verse-challenge-staging.vercel.app/api/health

# Test API endpoints
curl https://quran-verse-challenge-staging.vercel.app/api/auth/register \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"learner"}'
```

---

## Phase 3: Production Deployment

### 1. Production Environment Setup
```bash
# Configure production environment
cp .env.production .env.production.local

# Edit with production values:
NEXT_PUBLIC_SUPABASE_URL=[production-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-key]
OPENAI_API_KEY=[production-openai-key]
NEXT_PUBLIC_APP_URL=https://quran-verse-challenge.vercel.app
NEXTAUTH_URL=https://quran-verse-challenge.vercel.app
NEXTAUTH_SECRET=[strong-production-secret]
```

### 2. Production Domain Configuration
1. **Custom Domain Setup** (if using custom domain)
   ```bash
   # Add custom domain in Vercel dashboard
   # Configure DNS settings
   # Verify SSL certificate
   ```

2. **Production Deployment**
   ```bash
   vercel --prod \
     --env NODE_ENV="production" \
     --env NEXT_PUBLIC_SUPABASE_URL="[prod-url]" \
     --env NEXT_PUBLIC_SUPABASE_ANON_KEY="[prod-key]" \
     --env SUPABASE_SERVICE_ROLE_KEY="[prod-service-key]" \
     --env OPENAI_API_KEY="[prod-openai-key]" \
     --env NEXT_PUBLIC_APP_URL="https://quran-verse-challenge.vercel.app" \
     --env NEXTAUTH_URL="https://quran-verse-challenge.vercel.app" \
     --env NEXTAUTH_SECRET="[production-secret]"
   ```

---

## Phase 4: Post-Deployment Configuration

### 1. Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_approved ON questions(approved_at) WHERE approved_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attempts_user_date ON attempts(user_id, answered_at);
CREATE INDEX IF NOT EXISTS idx_verses_surah_ayah ON verses(surah, ayah);

-- Update table statistics
ANALYZE questions;
ANALYZE attempts;
ANALYZE verses;
```

### 2. Initial Data Population
```bash
# Generate initial AI questions
npm run ai:batch

# Create sample learning groups
npm run sample:groups
```

### 3. Monitoring Setup
- **Error Tracking**: Configure Sentry or similar
- **Performance Monitoring**: Setup New Relic or Datadog  
- **Uptime Monitoring**: Configure Pingdom or UptimeRobot
- **Database Monitoring**: Enable Supabase monitoring

### 4. Security Configuration
- **Rate Limiting**: Configure Vercel rate limiting
- **CORS**: Verify CORS settings for production domain
- **Environment Variables**: Secure all production secrets
- **Database Security**: Verify RLS policies are active

---

## Phase 5: Go-Live Checklist

### Pre-Launch Verification ✓
- [ ] Database schema deployed and verified
- [ ] All environment variables configured
- [ ] SSL certificates active and valid
- [ ] Custom domain configured (if applicable)
- [ ] All API endpoints responding correctly
- [ ] Authentication flow working end-to-end
- [ ] AI question generation operational
- [ ] Scholar moderation system functional
- [ ] Teacher group management working
- [ ] Performance targets met (<3s load time)
- [ ] Security headers configured
- [ ] Monitoring and alerts active

### Launch Day Tasks
- [ ] **T-1 Hour**: Final staging tests
- [ ] **T-30 Min**: Production deployment
- [ ] **T-15 Min**: Health checks and smoke tests
- [ ] **T-0**: Go-live announcement
- [ ] **T+15 Min**: Monitor error rates and performance
- [ ] **T+1 Hour**: User acceptance testing
- [ ] **T+24 Hours**: Performance review and optimization

---

## Rollback Procedures

### Emergency Rollback
```bash
# Rollback to previous Vercel deployment
vercel rollback [deployment-url]

# Rollback database changes (if needed)
# Restore from backup point-in-time
```

### Health Monitoring
```bash
# Monitor deployment health
watch curl -s https://your-domain.com/api/health

# Check error rates in Vercel dashboard
# Monitor database performance in Supabase
```

---

## Support Resources

### Key URLs
- **Staging:** https://quran-verse-challenge-staging.vercel.app
- **Production:** https://quran-verse-challenge.vercel.app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/jqhtumofrkitdcfnyeue
- **Vercel Dashboard:** https://vercel.com/dashboard

### Important Files
- **Configuration:** `vercel.json`, `next.config.ts`
- **Environment:** `.env.staging`, `.env.production`
- **Database:** `supabase/*.sql`
- **Scripts:** `scripts/*.ts`, `package.json`

### Emergency Contacts
- **Technical Lead**: [Contact Info]
- **Database Admin**: [Contact Info]  
- **DevOps**: [Contact Info]

---

## Success Metrics

### Performance Targets
- **Page Load Time**: <3 seconds on 3G
- **API Response Time**: <300ms P95
- **Database Query Time**: <100ms average
- **Uptime**: 99.9% availability

### Business Metrics
- **User Registration**: Track conversion rates
- **Quiz Completion**: Monitor engagement
- **Question Accuracy**: Measure learning outcomes
- **Scholar Participation**: Track moderation activity

---

*Deployment guide prepared for Sprint 3 production launch. All systems tested and ready for deployment.*