import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NotificationPreferences } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's notification preferences or create default ones
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPreferences: Omit<NotificationPreferences, 'updatedAt'> = {
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

      const { data: newPreferences, error: insertError } = await supabase
        .from('notification_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({
        success: true,
        data: newPreferences
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const updates = await request.json();

    // Validate the updates
    const allowedFields = [
      'daily_reminder',
      'streak_notifications', 
      'weekly_progress',
      'moderation_updates',
      'group_activities',
      'system_announcements',
      'marketing_emails',
      'email_frequency',
      'preferred_language',
      'quiet_hours_start',
      'quiet_hours_end',
      'timezone'
    ];

    const validUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    validUpdates.updatedAt = new Date().toISOString();

    // Update preferences
    const { data: updatedPreferences, error } = await supabase
      .from('notification_preferences')
      .update(validUpdates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // If update fails, try insert (first time setting preferences)
      if (error.code === 'PGRST116') {
        const { data: newPreferences, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: userId, ...validUpdates })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return NextResponse.json({
          success: true,
          data: newPreferences
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: updatedPreferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Reset to default preferences
    const defaultPreferences = {
      daily_reminder: true,
      streak_notifications: true,
      weekly_progress: true,
      moderation_updates: true,
      group_activities: true,
      system_announcements: true,
      marketing_emails: false,
      email_frequency: 'immediate' as const,
      preferred_language: 'en' as const,
      quiet_hours_start: null,
      quiet_hours_end: null,
      timezone: null,
      updatedAt: new Date().toISOString()
    };

    const { data: resetPreferences, error } = await supabase
      .from('notification_preferences')
      .update(defaultPreferences)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: resetPreferences,
      message: 'Notification preferences reset to defaults'
    });

  } catch (error) {
    console.error('Reset preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset notification preferences' },
      { status: 500 }
    );
  }
}