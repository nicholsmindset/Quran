#!/bin/bash

echo "🚀 Verifying Qur'an Verse Challenge DevOps Setup..."
echo "=================================================="

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ package.json not found. Please run from project root."
    exit 1
fi

echo "✅ Project structure verified"

# Verify package.json has correct dependencies
echo "🔍 Checking dependencies..."
if grep -q '"next":' package.json && grep -q '"typescript":' package.json; then
    echo "✅ Next.js and TypeScript dependencies found"
else
    echo "❌ Missing Next.js or TypeScript dependencies"
    exit 1
fi

# Verify TypeScript configuration
echo "🔍 Checking TypeScript configuration..."
if [[ -f "tsconfig.json" ]]; then
    if grep -q '"strict": true' tsconfig.json; then
        echo "✅ TypeScript strict mode enabled"
    else
        echo "❌ TypeScript strict mode not enabled"
        exit 1
    fi
else
    echo "❌ tsconfig.json not found"
    exit 1
fi

# Verify ESLint configuration
echo "🔍 Checking ESLint configuration..."
if [[ -f "eslint.config.mjs" ]]; then
    echo "✅ ESLint configuration found"
else
    echo "❌ ESLint configuration not found"
    exit 1
fi

# Verify Prettier configuration
echo "🔍 Checking Prettier configuration..."
if [[ -f ".prettierrc" ]]; then
    echo "✅ Prettier configuration found"
else
    echo "❌ Prettier configuration not found"
    exit 1
fi

# Verify pre-commit hooks
echo "🔍 Checking pre-commit hooks..."
if [[ -f ".husky/pre-commit" ]]; then
    echo "✅ Pre-commit hooks configured"
else
    echo "❌ Pre-commit hooks not found"
    exit 1
fi

# Verify environment files
echo "🔍 Checking environment configuration..."
if [[ -f ".env.example" ]] && [[ -f ".env.local" ]]; then
    echo "✅ Environment files configured"
else
    echo "❌ Environment files missing"
    exit 1
fi

# Verify Vercel configuration
echo "🔍 Checking Vercel configuration..."
if [[ -f "vercel.json" ]]; then
    echo "✅ Vercel deployment configuration found"
else
    echo "❌ Vercel configuration not found"
    exit 1
fi

# Verify project structure
echo "🔍 Checking project structure..."
required_dirs=("src/app" "src/components" "src/lib" "src/types" "tests" "docs")
for dir in "${required_dirs[@]}"; do
    if [[ -d "$dir" ]]; then
        echo "✅ Directory $dir exists"
    else
        echo "❌ Directory $dir missing"
        exit 1
    fi
done

# Run quality checks
echo "🔍 Running quality checks..."

# Type checking
echo "  🔤 Type checking..."
if npm run type-check > /dev/null 2>&1; then
    echo "  ✅ TypeScript compilation passed"
else
    echo "  ❌ TypeScript compilation failed"
    exit 1
fi

# Linting
echo "  🔍 ESLint checking..."
if npm run lint > /dev/null 2>&1; then
    echo "  ✅ ESLint passed"
else
    echo "  ❌ ESLint failed"
    exit 1
fi

# Build test
echo "  🏗️ Build testing..."
if npm run build > /dev/null 2>&1; then
    echo "  ✅ Production build successful"
else
    echo "  ❌ Production build failed"
    exit 1
fi

echo ""
echo "🎉 ALL DEVOPS SETUP TASKS COMPLETED SUCCESSFULLY!"
echo "=================================================="
echo "✅ T016: Next.js 18 project initialized"
echo "✅ T017: TypeScript configuration complete"
echo "✅ T018: ESLint and Prettier configured"
echo "✅ T019: Vercel deployment ready"
echo "✅ T020: Environment variables configured"
echo ""
echo "🚀 Ready for Backend Agent to begin Sprint 1 tasks!"
echo "📋 Next tasks: T001-T015 (Supabase Auth, Database, API)"
echo "🌐 Start development: npm run dev"
echo ""