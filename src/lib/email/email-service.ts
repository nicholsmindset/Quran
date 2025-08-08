import { createClient } from '@supabase/supabase-js';
import { EmailTemplate, NotificationPreferences, User } from '@/types';

// Email service configuration
interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export class EmailService {
  private _supabase: ReturnType<typeof createClient> | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      smtpHost: process.env.SMTP_HOST || 'smtp.resend.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER || 'resend',
      smtpPass: process.env.SMTP_PASS || process.env.RESEND_API_KEY || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@quranversechallenge.com',
      fromName: process.env.FROM_NAME || 'Qur\'an Verse Challenge'
    };
  }

  private get supabase() {
    if (!this._supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !serviceKey) {
        throw new Error('Supabase env vars are not configured');
      }
      this._supabase = createClient(url, serviceKey);
    }
    return this._supabase;
  }

  // Core email sending function
  async sendEmail({
    to,
    subject,
    html,
    text,
    templateId,
    templateData
  }: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    templateId?: string;
    templateData?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // In a real implementation, this would use a service like Resend, SendGrid, or Nodemailer
      // For demonstration, we'll log the email and simulate success
      
      console.log('📧 Email Notification:', {
        to,
        subject,
        templateId,
        templateData: templateData ? Object.keys(templateData) : undefined
      });

      // Record email in database for tracking
      const { error: dbError } = await this.supabase
        .from('email_logs')
        .insert({
          recipient: to,
          subject,
          template_id: templateId,
          template_data: templateData,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('Failed to log email:', dbError);
      }

      // Simulate successful email sending
      return {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user's notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        user_id: userId,
        daily_reminder: true,
        streak_notifications: true,
        weekly_progress: true,
        moderation_updates: true,
        group_activities: true,
        system_announcements: true,
        marketing_emails: false,
        email_frequency: 'immediate',
        preferred_language: 'en'
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  // Check if user should receive this type of notification
  async shouldSendNotification(userId: string, notificationType: string): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    if (!preferences) return false;

    const typeMap: Record<string, keyof NotificationPreferences> = {
      'daily_reminder': 'daily_reminder',
      'streak_lost': 'streak_notifications',
      'streak_milestone': 'streak_notifications',
      'weekly_progress': 'weekly_progress',
      'question_approved': 'moderation_updates',
      'question_rejected': 'moderation_updates',
      'group_invitation': 'group_activities',
      'assignment_created': 'group_activities',
      'system_announcement': 'system_announcements'
    };

    const preferenceKey = typeMap[notificationType];
    return preferenceKey ? preferences[preferenceKey] : false;
  }

  // Daily reminder emails
  async sendDailyReminder(user: User): Promise<void> {
    if (!(await this.shouldSendNotification(user.id, 'daily_reminder'))) {
      return;
    }

    // Get user's current streak and progress
    const { data: progress } = await this.supabase
      .from('user_progress')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .single();

    // Check if user completed today's quiz
    const today = new Date().toISOString().split('T')[0];
    const { data: completedToday } = await this.supabase
      .from('quiz_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('completed_at', today)
      .lt('completed_at', `${today}T23:59:59Z`)
      .single();

    if (completedToday) {
      return; // User already completed today's quiz
    }

    await this.sendEmail({
      to: user.email,
      subject: `🌟 Keep your ${progress?.current_streak || 0}-day streak alive!`,
      templateId: 'daily_reminder',
      templateData: {
        userName: user.email.split('@')[0],
        currentStreak: progress?.current_streak || 0,
        longestStreak: progress?.longest_streak || 0,
        quizUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quiz`,
        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?user=${user.id}`
      }
    });
  }

  // Streak milestone notifications
  async sendStreakMilestone(user: User, streak: number): Promise<void> {
    if (!(await this.shouldSendNotification(user.id, 'streak_milestone'))) {
      return;
    }

    const milestones = [7, 14, 30, 50, 100, 365];
    if (!milestones.includes(streak)) {
      return;
    }

    await this.sendEmail({
      to: user.email,
      subject: `🎉 Amazing! You've reached a ${streak}-day streak!`,
      templateId: 'streak_milestone',
      templateData: {
        userName: user.email.split('@')[0],
        streak,
        achievementBadge: this.getStreakBadge(streak),
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/streak/${streak}`,
        continueUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quiz`
      }
    });
  }

  // Streak lost notification
  async sendStreakLost(user: User, lostStreak: number): Promise<void> {
    if (!(await this.shouldSendNotification(user.id, 'streak_lost'))) {
      return;
    }

    if (lostStreak < 3) {
      return; // Don't notify for very short streaks
    }

    await this.sendEmail({
      to: user.email,
      subject: `💫 Don't give up! Start a new streak today`,
      templateId: 'streak_lost',
      templateData: {
        userName: user.email.split('@')[0],
        lostStreak,
        encouragementMessage: this.getEncouragementMessage(lostStreak),
        restartUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quiz`
      }
    });
  }

  // Weekly progress summary
  async sendWeeklyProgress(user: User): Promise<void> {
    if (!(await this.shouldSendNotification(user.id, 'weekly_progress'))) {
      return;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get weekly stats
    const { data: weeklyAttempts } = await this.supabase
      .from('attempts')
      .select('correct, answered_at')
      .eq('user_id', user.id)
      .gte('answered_at', oneWeekAgo.toISOString());

    const { data: currentProgress } = await this.supabase
      .from('user_progress')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .single();

    if (!weeklyAttempts?.length) {
      return; // No activity this week
    }

    const correctAnswers = weeklyAttempts.filter(a => a.correct).length;
    const accuracy = Math.round((correctAnswers / weeklyAttempts.length) * 100);

    await this.sendEmail({
      to: user.email,
      subject: `📊 Your Weekly Qur'an Learning Summary`,
      templateId: 'weekly_progress',
      templateData: {
        userName: user.email.split('@')[0],
        questionsAnswered: weeklyAttempts.length,
        accuracy,
        currentStreak: currentProgress?.current_streak || 0,
        progressMessage: this.getProgressMessage(accuracy),
        continueUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      }
    });
  }

  // Scholar moderation notifications
  async sendModerationUpdate(
    user: User, 
    questionId: string, 
    action: 'approved' | 'rejected' | 'edited',
    notes?: string
  ): Promise<void> {
    if (!(await this.shouldSendNotification(user.id, `question_${action}`))) {
      return;
    }

    const actionMessages = {
      approved: '✅ Your question has been approved!',
      rejected: '❌ Your question needs revision',
      edited: '✏️ Your question has been improved'
    };

    await this.sendEmail({
      to: user.email,
      subject: actionMessages[action],
      templateId: 'moderation_update',
      templateData: {
        userName: user.email.split('@')[0],
        action,
        questionId,
        notes,
        reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/questions/${questionId}`
      }
    });
  }

  // Group activity notifications
  async sendGroupInvitation(user: User, groupName: string, teacherName: string, inviteCode: string): Promise<void> {
    if (!(await this.shouldSendNotification(user.id, 'group_invitation'))) {
      return;
    }

    await this.sendEmail({
      to: user.email,
      subject: `📚 You're invited to join "${groupName}"`,
      templateId: 'group_invitation',
      templateData: {
        userName: user.email.split('@')[0],
        groupName,
        teacherName,
        inviteCode,
        joinUrl: `${process.env.NEXT_PUBLIC_APP_URL}/groups/join?code=${inviteCode}`
      }
    });
  }

  // Assignment notifications
  async sendAssignmentCreated(
    user: User, 
    assignmentTitle: string, 
    groupName: string, 
    dueDate?: Date
  ): Promise<void> {
    if (!(await this.shouldSendNotification(user.id, 'assignment_created'))) {
      return;
    }

    await this.sendEmail({
      to: user.email,
      subject: `📝 New Assignment: "${assignmentTitle}"`,
      templateId: 'assignment_created',
      templateData: {
        userName: user.email.split('@')[0],
        assignmentTitle,
        groupName,
        dueDate: dueDate?.toLocaleDateString(),
        assignmentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/groups/assignments`
      }
    });
  }

  // System announcements
  async sendSystemAnnouncement(
    users: User[], 
    title: string, 
    content: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    const priorityEmojis = { low: '📢', medium: '🔔', high: '🚨' };
    
    for (const user of users) {
      if (await this.shouldSendNotification(user.id, 'system_announcement')) {
        await this.sendEmail({
          to: user.email,
          subject: `${priorityEmojis[priority]} ${title}`,
          templateId: 'system_announcement',
          templateData: {
            userName: user.email.split('@')[0],
            title,
            content,
            priority,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          }
        });
      }
    }
  }

  // Bulk notification sender for daily operations
  async sendBulkDailyReminders(): Promise<{ sent: number; errors: number }> {
    try {
      // Get users who haven't completed today's quiz and have reminders enabled
      const today = new Date().toISOString().split('T')[0];
      
      const { data: users } = await this.supabase
        .from('users')
        .select(`
          id, email, role,
          notification_preferences(daily_reminder)
        `)
        .eq('notification_preferences.daily_reminder', true);

      if (!users?.length) {
        return { sent: 0, errors: 0 };
      }

      let sent = 0;
      let errors = 0;

      for (const user of users) {
        try {
          await this.sendDailyReminder(user);
          sent++;
        } catch (error) {
          console.error(`Failed to send reminder to ${user.email}:`, error);
          errors++;
        }
      }

      return { sent, errors };
    } catch (error) {
      console.error('Bulk reminder sending failed:', error);
      return { sent: 0, errors: 1 };
    }
  }

  // Helper functions
  private getStreakBadge(streak: number): string {
    if (streak >= 365) return '🏆 Yearly Champion';
    if (streak >= 100) return '💎 Century Master';
    if (streak >= 50) return '⭐ Golden Streak';
    if (streak >= 30) return '🌟 Monthly Star';
    if (streak >= 14) return '🔥 Two-Week Fire';
    if (streak >= 7) return '📚 Weekly Scholar';
    return '🎯 Daily Learner';
  }

  private getEncouragementMessage(lostStreak: number): string {
    const messages = [
      "Every expert was once a beginner. Start fresh!",
      "The best time to plant a tree was 20 years ago. The second best time is now.",
      "Your journey in learning the Qur'an continues. Don't let one missed day define you.",
      "Even the Prophet ﷺ said the deeds most beloved to Allah are those done consistently, even if small.",
      "Remember: 'And whoever relies upon Allah - then He is sufficient for him.' (Quran 65:3)"
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  private getProgressMessage(accuracy: number): string {
    if (accuracy >= 90) return "Excellent work! Your understanding is truly impressive.";
    if (accuracy >= 80) return "Great progress! You're building solid knowledge.";
    if (accuracy >= 70) return "Good effort! Keep practicing to improve further.";
    if (accuracy >= 60) return "You're learning! Focus on understanding the verses deeply.";
    return "Every step counts in your Qur'anic journey. Keep going!";
  }
}

// Export singleton instance
export const emailService = new EmailService();