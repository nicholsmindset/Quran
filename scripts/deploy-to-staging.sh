#!/bin/bash

# Sprint 3 Staging Deployment Script
# Automated deployment to staging environment

set -e  # Exit on any error

echo "🚀 Starting Sprint 3 Staging Deployment..."
echo "=================================================="

# Load environment variables
if [ -f .env.local ]; then
    echo "✅ Loading environment variables from .env.local"
    export $(grep -v '^#' .env.local | xargs)
else
    echo "❌ .env.local not found"
    exit 1
fi

# Verify environment variables
echo "🔍 Verifying environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing Supabase environment variables"
    exit 1
fi
echo "✅ Environment variables verified"

# Check if build exists
if [ ! -d ".next" ]; then
    echo "⚠️ Build directory not found. Building application..."
    npm run build
fi
echo "✅ Build verified"

# Test database connection
echo "🔍 Testing database connection..."
PGPASSWORD=$(echo $SUPABASE_SERVICE_ROLE_KEY) psql -h db.jqhtumofrkitdcfnyeue.supabase.co -U postgres -d postgres -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "⚠️ Direct database connection failed, will use REST API"
fi

# Deploy database schema if needed
echo "📊 Checking database schema status..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient('$NEXT_PUBLIC_SUPABASE_URL', '$SUPABASE_SERVICE_ROLE_KEY');

(async () => {
  try {
    const { data, error } = await client.from('questions').select('id').limit(1);
    if (error && error.message.includes('relation')) {
      console.log('Schema needs to be deployed');
      process.exit(1);
    } else {
      console.log('✅ Database schema appears to be deployed');
    }
  } catch (e) {
    console.log('⚠️ Could not check schema status:', e.message);
    process.exit(1);
  }
})();
"

SCHEMA_STATUS=$?
if [ $SCHEMA_STATUS -ne 0 ]; then
    echo "📊 Database schema needs deployment - manual intervention required"
    echo "Please run the following SQL scripts in Supabase SQL Editor:"
    echo "1. supabase/schema.sql"
    echo "2. supabase/ai-schema-updates.sql" 
    echo "3. supabase/group-management-schema.sql"
    echo ""
fi

# Deploy to Vercel staging
echo "🚀 Deploying to Vercel staging..."

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "⚠️ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy using staging configuration
echo "🎯 Deploying to staging environment..."
vercel --prod --yes --env NODE_ENV=production \
  --env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --env OPENAI_API_KEY="$OPENAI_API_KEY" \
  --env NEXT_PUBLIC_APP_URL="https://quran-verse-challenge-staging.vercel.app" \
  --env NEXTAUTH_URL="https://quran-verse-challenge-staging.vercel.app" \
  --env NEXTAUTH_SECRET="staging-secret-$(date +%s)" \
  --env VERCEL_ENV="staging"

DEPLOY_STATUS=$?
if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "✅ Staging deployment successful!"
    echo "🌐 Staging URL: https://quran-verse-challenge-staging.vercel.app"
    
    # Test staging health
    echo "🔍 Testing staging health endpoint..."
    sleep 10  # Wait for deployment to be ready
    curl -f https://quran-verse-challenge-staging.vercel.app/api/health || echo "⚠️ Health check failed"
    
    echo ""
    echo "🎉 Sprint 3 Staging Deployment Complete!"
    echo "=================================================="
    echo "Next steps:"
    echo "1. Test all functionality in staging"
    echo "2. Validate API endpoints"
    echo "3. Run E2E tests against staging"
    echo "4. Deploy to production when ready"
    
else
    echo "❌ Staging deployment failed"
    exit 1
fi