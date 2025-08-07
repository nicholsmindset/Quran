# Database Setup Guide

## Quick Fix for "relation 'questions' does not exist" Error

The error occurs because the database tables haven't been created in your Supabase project yet. Here's the **correct order** to fix this:

## Method 1: Manual SQL Setup (Recommended)

### **Step 1: Core Database Setup (REQUIRED FIRST)**
1. **Go to your Supabase Dashboard**
   - Open [supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to "SQL Editor" in the sidebar

2. **Execute the Complete Setup Script**
   - Copy the entire contents of `supabase/complete-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" button

3. **Verify Setup Worked**
   - Copy contents of `scripts/verify-database.sql`
   - Paste and run in SQL Editor  
   - Should show ✅ for all checks and "DATABASE SETUP COMPLETE!"

### **Step 2: Optional AI Features (Run AFTER Step 1)**
If you want advanced AI features:
1. Copy the entire contents of `supabase/ai-schema-updates.sql`
2. Paste it into the SQL Editor
3. Click "Run" button
4. This adds AI topics, semantic search, and performance monitoring

**⚠️ IMPORTANT:** You MUST run `complete-setup.sql` before `ai-schema-updates.sql`!

## Method 2: Automated Script Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Set up environment variables** in `.env.local`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run the setup script**:
   ```bash
   node scripts/setup-database.js
   ```

## Method 3: Individual Schema Files

If you prefer to run schemas individually:

1. **Core Schema** (`supabase/complete-setup.sql`):
   - Creates users, verses, questions, attempts tables
   - Sets up RLS policies and sample data

2. **Group Management** (`supabase/group-management-schema.sql`):
   - Teacher groups and student management
   - Assignment system

3. **Notifications** (`supabase/notifications-schema.sql`):
   - Email notification preferences
   - GDPR compliance features

4. **Performance Monitoring** (`supabase/performance-schema.sql`):
   - Performance metrics and monitoring
   - System health tracking

## Tables Created

After running the setup, you'll have these main tables:

### Core Application
- `users` - User accounts with roles (learner/teacher/scholar)
- `verses` - Quranic verses with Arabic text and translations  
- `questions` - Quiz questions linked to verses
- `attempts` - User answers and scoring
- `quiz_sessions` - Active quiz tracking
- `daily_challenges` - Daily quiz challenges
- `user_progress` - Comprehensive progress tracking
- `streaks` - Learning streak management

### Group Management
- `teacher_groups` - Classroom groups created by teachers
- `group_memberships` - Student enrollment in groups
- `group_assignments` - Assignments given to groups

### System Features
- `performance_metrics` - App performance tracking
- `error_reports` - Error logging and monitoring
- `email_notifications` - Notification preferences
- `audit_logs` - Action logging for accountability

## Sample Data Included

The setup includes sample data:
- **5 verses** from Al-Fatiha and Ayat al-Kursi
- **1 sample question** (approved and ready for quizzes)
- **Default performance budgets** for monitoring
- **Email notification templates**

## Verification Steps

1. **Check Tables**: Go to Supabase Table Editor and verify all tables exist
2. **Test Sample Data**: 
   ```sql
   SELECT * FROM verses LIMIT 5;
   SELECT * FROM questions WHERE status = 'approved';
   ```
3. **Test Application**: Start your Next.js app and try accessing the quiz page

## Troubleshooting

### "Permission denied" errors
- Make sure you're using the SERVICE_ROLE_KEY (not ANON_KEY)
- Check that RLS policies are properly configured

### "Function does not exist" errors  
- Make sure all schema files were executed
- Some functions depend on tables from other schemas

### "Relation does not exist" errors
- Re-run the complete-setup.sql file
- Check that there were no syntax errors during execution

### Performance Issues
- The setup includes proper indexes for common queries
- Monitor the performance_metrics table for insights

## Next Steps

Once the database is set up:

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Create Test Account**:
   - Visit http://localhost:3000
   - Sign up with a test email
   - The app will automatically create user progress tracking

3. **Test Features**:
   - Take a quiz to test question/answer flow
   - Check admin/scholar interfaces if you have those roles
   - Verify email notifications work (if configured)

## Database Schema Documentation

- **RLS (Row Level Security)**: Enabled on all tables with appropriate policies
- **Triggers**: Automatic streak updates, progress tracking, and audit logging
- **Functions**: Helper functions for daily challenges and user management
- **Indexes**: Optimized for common query patterns

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify all environment variables are correctly set
3. Ensure your Supabase project is on a supported plan
4. Check that the SQL executed without syntax errors

The database is designed to be GDPR compliant and includes Islamic design principles throughout.