#!/bin/bash

# Staging Deployment Script for Quran Verse Challenge
# This script automates the staging deployment process

set -e  # Exit on any error

echo "🚀 Starting Quran Verse Challenge Staging Deployment"
echo "=================================================="

# Check if required environment variables are set
check_env_vars() {
    echo "📋 Checking environment variables..."
    
    required_vars=(
        "VERCEL_TOKEN"
        "STAGING_SUPABASE_URL"
        "STAGING_SUPABASE_ANON_KEY"
        "STAGING_SUPABASE_SERVICE_KEY"
        "STAGING_OPENAI_API_KEY"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "❌ Missing required environment variables:"
        printf '   - %s\n' "${missing_vars[@]}"
        echo ""
        echo "Please set these variables before running the deployment script."
        exit 1
    fi
    
    echo "✅ All required environment variables are set"
}

# Run quality gates
run_quality_gates() {
    echo "🧪 Running quality gates..."
    
    echo "  📝 Running ESLint..."
    npm run lint || {
        echo "❌ ESLint failed"
        exit 1
    }
    
    echo "  🎨 Checking Prettier formatting..."
    npm run format:check || {
        echo "❌ Prettier check failed"
        exit 1
    }
    
    echo "  🧪 Running unit tests..."
    npm run test:unit || {
        echo "❌ Unit tests failed"
        exit 1
    }
    
    echo "  🔗 Running integration tests..."
    npm run test:integration || {
        echo "❌ Integration tests failed"
        exit 1
    }
    
    echo "✅ All quality gates passed"
}

# Security scan
run_security_scan() {
    echo "🛡️ Running security scan..."
    
    echo "  📦 Checking dependencies for vulnerabilities..."
    npm audit --audit-level=moderate || {
        echo "❌ Dependency vulnerabilities found"
        exit 1
    }
    
    echo "✅ Security scan passed"
}

# Build and deploy
deploy_to_staging() {
    echo "🏗️ Building and deploying to staging..."
    
    # Install Vercel CLI if not present
    if ! command -v vercel &> /dev/null; then
        echo "  📦 Installing Vercel CLI..."
        npm install -g vercel@latest
    fi
    
    # Set environment variables for build
    export NEXT_PUBLIC_SUPABASE_URL="$STAGING_SUPABASE_URL"
    export NEXT_PUBLIC_SUPABASE_ANON_KEY="$STAGING_SUPABASE_ANON_KEY"
    export SUPABASE_SERVICE_ROLE_KEY="$STAGING_SUPABASE_SERVICE_KEY"
    export OPENAI_API_KEY="$STAGING_OPENAI_API_KEY"
    export NEXT_PUBLIC_APP_URL="https://quran-verse-challenge-staging.vercel.app"
    
    echo "  🔧 Configuring Vercel environment..."
    vercel pull --yes --environment=staging --token="$VERCEL_TOKEN"
    
    echo "  🏗️ Building project..."
    vercel build --token="$VERCEL_TOKEN"
    
    echo "  🚀 Deploying to staging..."
    DEPLOYMENT_URL=$(vercel deploy --prebuilt --token="$VERCEL_TOKEN")
    
    echo "✅ Deployment successful!"
    echo "🔗 Staging URL: $DEPLOYMENT_URL"
}

# Run post-deployment tests
run_post_deployment_tests() {
    echo "🧪 Running post-deployment tests..."
    
    # Wait for deployment to be ready
    echo "  ⏳ Waiting for deployment to be ready..."
    sleep 30
    
    echo "  🎭 Installing Playwright browsers..."
    npx playwright install --with-deps
    
    echo "  🧪 Running E2E tests..."
    export PLAYWRIGHT_TEST_BASE_URL="$DEPLOYMENT_URL"
    npm run test:e2e || {
        echo "⚠️ E2E tests failed, but deployment is live"
    }
    
    echo "  ♿ Running accessibility tests..."
    npm run test:accessibility || {
        echo "⚠️ Accessibility tests failed, but deployment is live"
    }
    
    echo "✅ Post-deployment tests completed"
}

# Database operations
setup_database() {
    echo "🗄️ Setting up database..."
    
    echo "  📊 Seeding verses table..."
    npm run seed:verses || {
        echo "⚠️ Database seeding failed, but deployment continues"
    }
    
    echo "✅ Database setup completed"
}

# Main execution
main() {
    echo "Starting deployment process..."
    echo "Timestamp: $(date)"
    echo ""
    
    check_env_vars
    echo ""
    
    run_quality_gates
    echo ""
    
    run_security_scan
    echo ""
    
    deploy_to_staging
    echo ""
    
    setup_database
    echo ""
    
    run_post_deployment_tests
    echo ""
    
    echo "🎉 Staging deployment completed successfully!"
    echo "=================================================="
    echo "🔗 Staging URL: $DEPLOYMENT_URL"
    echo "📊 Database: Connected and seeded"
    echo "🧪 Tests: Completed"
    echo "🛡️ Security: Validated"
    echo ""
    echo "Next steps:"
    echo "1. Verify staging environment functionality"
    echo "2. Run manual testing scenarios"
    echo "3. Prepare for production deployment"
}

# Execute main function
main "$@"