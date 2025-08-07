-- Database Verification Script
-- Run this in Supabase SQL Editor to verify your setup

-- Check if all core tables exist
DO $$
DECLARE
    table_count INTEGER;
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    expected_tables TEXT[] := ARRAY['users', 'verses', 'questions', 'attempts', 'streaks', 'quiz_sessions', 'daily_challenges', 'user_progress', 'audit_logs'];
    current_table TEXT;
BEGIN
    RAISE NOTICE '🕌 Verifying Quran Verse Challenge Database Setup...';
    RAISE NOTICE '';
    
    -- Check each expected table
    FOREACH current_table IN ARRAY expected_tables
    LOOP
        SELECT COUNT(*) INTO table_count 
        FROM information_schema.tables 
        WHERE table_name = current_table AND table_schema = 'public';
        
        IF table_count = 0 THEN
            missing_tables := array_append(missing_tables, current_table);
            RAISE NOTICE '❌ Missing table: %', current_table;
        ELSE
            RAISE NOTICE '✅ Table exists: %', current_table;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '⚠️  Some tables are missing. Please run complete-setup.sql first.';
        RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '🎉 All core tables are present!';
    END IF;
END $$;

-- Check sample data
DO $$
DECLARE
    verse_count INTEGER;
    question_count INTEGER;
    user_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Checking sample data...';
    
    SELECT COUNT(*) INTO verse_count FROM verses;
    SELECT COUNT(*) INTO question_count FROM questions WHERE status = 'approved';
    SELECT COUNT(*) INTO user_count FROM users;
    
    RAISE NOTICE '📖 Verses: %', verse_count;
    RAISE NOTICE '❓ Approved Questions: %', question_count;
    RAISE NOTICE '👥 Users: %', user_count;
    
    IF verse_count >= 5 AND question_count >= 1 THEN
        RAISE NOTICE '✅ Sample data looks good!';
    ELSE
        RAISE NOTICE '⚠️  Limited sample data. Consider running complete-setup.sql again.';
    END IF;
END $$;

-- Check RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Checking Row Level Security...';
    
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE '🛡️  RLS Policies: %', policy_count;
    
    IF policy_count >= 10 THEN
        RAISE NOTICE '✅ RLS policies are configured!';
    ELSE
        RAISE NOTICE '⚠️  Few RLS policies found. Security may not be fully configured.';
    END IF;
END $$;

-- Check functions
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚙️  Checking custom functions...';
    
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    RAISE NOTICE '🔧 Custom Functions: %', function_count;
    
    IF function_count >= 5 THEN
        RAISE NOTICE '✅ Custom functions are available!';
    ELSE
        RAISE NOTICE '⚠️  Few functions found. Some features may not work properly.';
    END IF;
END $$;

-- Final status
DO $$
DECLARE
    all_good BOOLEAN := true;
    table_count INTEGER;
    verse_count INTEGER;
    question_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🏁 Final Status Check...';
    
    -- Check critical components
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_name IN ('users', 'verses', 'questions', 'attempts') AND table_schema = 'public';
    
    SELECT COUNT(*) INTO verse_count FROM verses;
    SELECT COUNT(*) INTO question_count FROM questions WHERE status = 'approved';
    
    IF table_count < 4 THEN
        all_good := false;
        RAISE NOTICE '❌ Critical tables missing';
    END IF;
    
    IF verse_count = 0 THEN
        all_good := false;
        RAISE NOTICE '❌ No sample verses found';
    END IF;
    
    IF question_count = 0 THEN
        all_good := false;
        RAISE NOTICE '❌ No approved questions found';
    END IF;
    
    RAISE NOTICE '';
    
    IF all_good THEN
        RAISE NOTICE '🎉✨ DATABASE SETUP COMPLETE! ✨🎉';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Your Quran Verse Challenge platform is ready!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Start your Next.js app: npm run dev';
        RAISE NOTICE '2. Visit http://localhost:3000';
        RAISE NOTICE '3. Create a user account and start taking quizzes!';
        RAISE NOTICE '';
        RAISE NOTICE 'May Allah bless your learning journey! 🤲';
    ELSE
        RAISE NOTICE '❌ SETUP INCOMPLETE';
        RAISE NOTICE '';
        RAISE NOTICE '⚡ Quick Fix:';
        RAISE NOTICE '1. Go to Supabase SQL Editor';
        RAISE NOTICE '2. Run the complete-setup.sql script';
        RAISE NOTICE '3. Run this verification script again';
    END IF;
END $$;