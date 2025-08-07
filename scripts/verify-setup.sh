#!/bin/bash

# Verify Setup Script - Qur'an Verse Challenge Backend
# This script verifies that all Sprint 1 backend components are properly configured

echo "🚀 Verifying Qur'an Verse Challenge Backend Setup"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "✅ ${GREEN}$1 exists${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1 missing${NC}"
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        echo -e "✅ ${GREEN}$1 directory exists${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1 directory missing${NC}"
        return 1
    fi
}

check_env_var() {
    if grep -q "^$1=" .env.local 2>/dev/null; then
        echo -e "✅ ${GREEN}$1 configured in .env.local${NC}"
        return 0
    elif grep -q "^$1=" .env.example 2>/dev/null; then
        echo -e "⚠️ ${YELLOW}$1 found in .env.example but not .env.local${NC}"
        return 1
    else
        echo -e "❌ ${RED}$1 not found${NC}"
        return 1
    fi
}

check_npm_package() {
    if npm list "$1" >/dev/null 2>&1; then
        echo -e "✅ ${GREEN}$1 installed${NC}"
        return 0
    else
        echo -e "❌ ${RED}$1 not installed${NC}"
        return 1
    fi
}

# Start verification
total_checks=0
passed_checks=0

echo ""
echo "📋 Checking Core Files..."
echo "------------------------"

files_to_check=(
    "package.json"
    "next.config.ts"
    "tsconfig.json"
    ".env.example"
    "src/lib/supabase.ts"
    "src/lib/auth.ts"
    "src/types/index.ts"
    "supabase/schema.sql"
    "scripts/seed-verses.ts"
    "docs/backend-api.md"
)

for file in "${files_to_check[@]}"; do
    ((total_checks++))
    if check_file "$file"; then
        ((passed_checks++))
    fi
done

echo ""
echo "📁 Checking Directory Structure..."
echo "--------------------------------"

directories_to_check=(
    "src/app/api"
    "src/app/api/auth"
    "src/app/api/questions"
    "src/app/api/attempts"
    "src/lib"
    "scripts"
    "docs"
    "supabase"
)

for dir in "${directories_to_check[@]}"; do
    ((total_checks++))
    if check_directory "$dir"; then
        ((passed_checks++))
    fi
done

echo ""
echo "🔧 Checking API Routes..."
echo "------------------------"

api_routes=(
    "src/app/api/auth/register/route.ts"
    "src/app/api/auth/login/route.ts"
    "src/app/api/auth/logout/route.ts"
    "src/app/api/questions/pending/route.ts"
    "src/app/api/questions/[id]/approve/route.ts"
    "src/app/api/questions/[id]/reject/route.ts"
    "src/app/api/questions/approved/route.ts"
    "src/app/api/attempts/route.ts"
)

for route in "${api_routes[@]}"; do
    ((total_checks++))
    if check_file "$route"; then
        ((passed_checks++))
    fi
done

echo ""
echo "📦 Checking NPM Dependencies..."
echo "------------------------------"

dependencies=(
    "@supabase/supabase-js"
    "@supabase/ssr"
    "zod"
    "next"
    "react"
    "typescript"
)

for dep in "${dependencies[@]}"; do
    ((total_checks++))
    if check_npm_package "$dep"; then
        ((passed_checks++))
    fi
done

echo ""
echo "🔐 Checking Environment Configuration..."
echo "---------------------------------------"

env_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
)

for var in "${env_vars[@]}"; do
    ((total_checks++))
    if check_env_var "$var"; then
        ((passed_checks++))
    fi
done

echo ""
echo "🧪 Testing TypeScript Compilation..."
echo "-----------------------------------"

((total_checks++))
if npm run type-check >/dev/null 2>&1; then
    echo -e "✅ ${GREEN}TypeScript compilation successful${NC}"
    ((passed_checks++))
else
    echo -e "❌ ${RED}TypeScript compilation failed${NC}"
fi

echo ""
echo "🎯 Testing Build Process..."
echo "--------------------------"

((total_checks++))
if npm run build >/dev/null 2>&1; then
    echo -e "✅ ${GREEN}Build process successful${NC}"
    ((passed_checks++))
else
    echo -e "❌ ${RED}Build process failed${NC}"
fi

echo ""
echo "📊 Verification Summary"
echo "======================"

percentage=$((passed_checks * 100 / total_checks))

echo -e "Total checks: $total_checks"
echo -e "Passed: ${GREEN}$passed_checks${NC}"
echo -e "Failed: ${RED}$((total_checks - passed_checks))${NC}"
echo -e "Success rate: ${GREEN}$percentage%${NC}"

echo ""

if [ $percentage -eq 100 ]; then
    echo -e "🎉 ${GREEN}All checks passed! Backend setup is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure your Supabase project and update .env.local"
    echo "2. Run the database schema: Copy supabase/schema.sql to Supabase SQL Editor"
    echo "3. Seed sample data: npm run seed:verses"
    echo "4. Start development server: npm run dev"
elif [ $percentage -ge 80 ]; then
    echo -e "⚠️ ${YELLOW}Most checks passed, but some items need attention.${NC}"
    echo ""
    echo "Please address the failed checks above before proceeding."
elif [ $percentage -ge 60 ]; then
    echo -e "⚠️ ${YELLOW}Setup is partially complete.${NC}"
    echo ""
    echo "Several important items are missing. Please review and fix the failed checks."
else
    echo -e "❌ ${RED}Setup verification failed.${NC}"
    echo ""
    echo "Many critical components are missing. Please follow the setup instructions carefully."
fi

echo ""
echo "📚 Documentation:"
echo "- Backend API: docs/backend-api.md"
echo "- Setup Guide: docs/setup/README.md"
echo "- Task Queue: task-queue.yaml"

exit $((100 - percentage))  # Exit with error code if not 100%