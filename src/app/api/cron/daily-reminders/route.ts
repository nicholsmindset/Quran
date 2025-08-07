import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/email/email-service';

// This endpoint should be called by a cron service (Vercel Cron, GitHub Actions, etc.)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting daily reminder job...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current date info
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getUTCHours();
    
    // Only send reminders during reasonable hours (adjust for different timezones)
    if (currentHour < 6 || currentHour > 22) {
      console.log('Outside of reminder hours, skipping...');
      return NextResponse.json({
        success: true,
        message: 'Outside of reminder hours',
        skipped: true
      });
    }

    // Get users who:
    // 1. Have daily reminders enabled
    // 2. Haven't completed today's quiz
    // 3. Haven't received a reminder today already
    const { data: usersNeedingReminders, error: queryError } = await supabase
      .rpc('get_users_needing_daily_reminders', {
        target_date: today
      });

    if (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    if (!usersNeedingReminders || usersNeedingReminders.length === 0) {
      console.log('No users need reminders today');
      return NextResponse.json({
        success: true,
        message: 'No users need reminders today',
        stats: { users: 0, sent: 0, errors: 0 }
      });
    }

    console.log(`Found ${usersNeedingReminders.length} users needing reminders`);

    let sent = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // Send reminders in batches to avoid overwhelming the email service
    const batchSize = 50;
    for (let i = 0; i < usersNeedingReminders.length; i += batchSize) {
      const batch = usersNeedingReminders.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (user: any) => {
        try {
          // Get user's current streak and progress
          const { data: progress } = await supabase
            .from('user_progress')
            .select('current_streak, longest_streak, updated_at')
            .eq('user_id', user.id)
            .single();

          // Calculate days since last activity
          const lastActivity = progress?.updated_at ? new Date(progress.updated_at) : new Date();
          const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

          // Customize reminder based on user situation
          let reminderType = 'standard';
          if (daysSinceActivity > 3) {
            reminderType = 'comeback';
          } else if (progress?.current_streak >= 7) {
            reminderType = 'streak_maintenance';
          } else if (daysSinceActivity === 1) {
            reminderType = 'streak_recovery';
          }

          // Send the reminder
          await emailService.sendEmail({
            to: user.email,
            subject: getReminderSubject(reminderType, progress?.current_streak || 0),
            templateId: 'daily_reminder',
            templateData: {
              userName: user.email.split('@')[0],
              currentStreak: progress?.current_streak || 0,
              longestStreak: progress?.longest_streak || 0,
              daysSinceActivity,
              reminderType,
              quizUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quiz`,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
              unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?user=${user.id}&token=${generateUnsubscribeToken(user.id)}`
            }
          });

          // Record that we sent a reminder
          await supabase
            .from('email_logs')
            .insert({
              recipient: user.email,
              subject: getReminderSubject(reminderType, progress?.current_streak || 0),
              template_id: 'daily_reminder',
              template_data: { reminderType, currentStreak: progress?.current_streak || 0 },
              status: 'sent',
              sent_at: now.toISOString()
            });

          sent++;
        } catch (error) {
          console.error(`Failed to send reminder to ${user.email}:`, error);
          errors++;
          errorDetails.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);
      
      // Small delay between batches to be respectful to email service
      if (i + batchSize < usersNeedingReminders.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log the job completion
    await supabase
      .from('cron_job_logs')
      .insert({
        job_name: 'daily_reminders',
        status: errors > 0 ? 'partial_success' : 'success',
        processed: usersNeedingReminders.length,
        successful: sent,
        failed: errors,
        error_details: errors > 0 ? errorDetails : null,
        executed_at: now.toISOString()
      });

    console.log(`Daily reminder job completed: ${sent} sent, ${errors} errors`);

    return NextResponse.json({
      success: true,
      message: 'Daily reminders processed',
      stats: {
        users: usersNeedingReminders.length,
        sent,
        errors,
        errorDetails: errors > 5 ? errorDetails.slice(0, 5) : errorDetails
      }
    });

  } catch (error) {
    console.error('Daily reminder job failed:', error);
    
    // Log the failure
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      await supabase
        .from('cron_job_logs')
        .insert({
          job_name: 'daily_reminders',
          status: 'failed',
          processed: 0,
          successful: 0,
          failed: 1,
          error_details: [error instanceof Error ? error.message : 'Unknown error'],
          executed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Daily reminder job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getReminderSubject(type: string, streak: number): string {
  switch (type) {
    case 'comeback':
      return '🌙 We miss you! Come back to your Qur\'anic journey';
    case 'streak_maintenance':
      return `🔥 Keep your ${streak}-day streak alive!`;
    case 'streak_recovery':
      return '💫 Don\'t let your streak break - one question awaits!';
    case 'standard':
    default:
      return '📚 Your daily Qur\'an question is ready!';
  }
}

function generateUnsubscribeToken(userId: string): string {
  // In a real implementation, this would be a secure JWT or signed token
  // For demonstration, we'll use a simple hash
  const secret = process.env.UNSUBSCRIBE_SECRET || 'default_secret';
  return Buffer.from(`${userId}:${secret}`).toString('base64');
}