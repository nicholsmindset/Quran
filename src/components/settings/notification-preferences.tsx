'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Switch,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/form-elements';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Mail,
  Clock,
  Users,
  BookOpen,
  Award,
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Globe
} from 'lucide-react';
import { NotificationPreferences } from '@/types';
import { cn } from '@/lib/cn';

// Form elements that we need to create since they're not in the existing UI components
const Switch = ({ checked, onCheckedChange, disabled, ...props }: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  [key: string]: any;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-primary" : "bg-input"
    )}
    {...props}
  >
    <span
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
);

const Label = ({ htmlFor, className, children, ...props }: {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => (
  <label
    htmlFor={htmlFor}
    className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  >
    {children}
  </label>
);

const Select = ({ value, onValueChange, disabled, children }: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    disabled={disabled}
    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
  </select>
);

const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectValue = ({ placeholder }: { placeholder?: string }) => <option value="" disabled>{placeholder}</option>;
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
);

interface NotificationPreferencesProps {
  userId?: string;
}

export function NotificationPreferencesComponent({ userId }: NotificationPreferencesProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch current preferences
  const { data: preferencesData, isLoading, error } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }
      
      return response.json();
    },
  });

  // Initialize preferences when data is loaded
  useEffect(() => {
    if (preferencesData?.data) {
      setPreferences(preferencesData.data);
    }
  }, [preferencesData]);

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setPreferences(data.data);
      setHasChanges(false);
    },
  });

  // Reset to defaults mutation
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/preferences', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset preferences');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setPreferences(data.data);
      setHasChanges(false);
    },
  });

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: value
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!preferences || !hasChanges) return;
    updatePreferencesMutation.mutate(preferences);
  };

  const handleReset = () => {
    resetPreferencesMutation.mutate();
  };

  const notificationTypes = [
    {
      key: 'daily_reminder' as keyof NotificationPreferences,
      icon: Clock,
      title: 'Daily Reminders',
      description: 'Get reminded to complete your daily Qur\'an quiz',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      key: 'streak_notifications' as keyof NotificationPreferences,
      icon: Award,
      title: 'Streak Notifications',
      description: 'Celebrate milestones and get notified when streaks are at risk',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      key: 'weekly_progress' as keyof NotificationPreferences,
      icon: BookOpen,
      title: 'Weekly Progress',
      description: 'Receive weekly summaries of your learning progress',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      key: 'moderation_updates' as keyof NotificationPreferences,
      icon: CheckCircle2,
      title: 'Moderation Updates',
      description: 'Get notified when your questions are reviewed by scholars',
      color: 'text-emerald-600 bg-emerald-100'
    },
    {
      key: 'group_activities' as keyof NotificationPreferences,
      icon: Users,
      title: 'Group Activities',
      description: 'Stay updated on group invitations and assignments',
      color: 'text-indigo-600 bg-indigo-100'
    },
    {
      key: 'system_announcements' as keyof NotificationPreferences,
      icon: Bell,
      title: 'System Announcements',
      description: 'Important updates and announcements about the platform',
      color: 'text-red-600 bg-red-100'
    },
    {
      key: 'marketing_emails' as keyof NotificationPreferences,
      icon: Mail,
      title: 'Marketing Communications',
      description: 'Tips, insights, and updates about new features',
      color: 'text-gray-600 bg-gray-100'
    }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const frequencies = [
    { value: 'immediate', label: 'Immediate', description: 'Get notifications right away' },
    { value: 'daily_digest', label: 'Daily Digest', description: 'Once per day summary' },
    { value: 'weekly_digest', label: 'Weekly Digest', description: 'Once per week summary' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading notification preferences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">Failed to load notification preferences</p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Bell className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-emerald-800">Notification Preferences</CardTitle>
                <p className="text-sm text-emerald-600 mt-1">
                  Customize how and when you receive notifications
                </p>
              </div>
            </div>
            
            {hasChanges && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Settings className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map(({ key, icon: Icon, title, description, color }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                    {title}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
              </div>
              <Switch
                id={key}
                checked={Boolean(preferences[key])}
                onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                disabled={updatePreferencesMutation.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email Frequency & Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Email Frequency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={preferences.email_frequency}
              onValueChange={(value) => handlePreferenceChange('email_frequency', value)}
              disabled={updatePreferencesMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="text-xs text-muted-foreground">
              {frequencies.find(f => f.value === preferences.email_frequency)?.description}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Preferred Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={preferences.preferred_language}
              onValueChange={(value) => handlePreferenceChange('preferred_language', value)}
              disabled={updatePreferencesMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4" />
            Quiet Hours (Optional)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set hours when you don't want to receive notifications
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="quiet-start" className="text-sm">Start Time</Label>
              <div className="flex items-center gap-2 mt-1">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.quiet_hours_start || ''}
                  onChange={(e) => handlePreferenceChange('quiet_hours_start', e.target.value || null)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="quiet-end" className="text-sm">End Time</Label>
              <div className="flex items-center gap-2 mt-1">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.quiet_hours_end || ''}
                  onChange={(e) => handlePreferenceChange('quiet_hours_end', e.target.value || null)}
                  disabled={updatePreferencesMutation.isPending}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="timezone" className="text-sm">Timezone</Label>
              <Input
                id="timezone"
                type="text"
                placeholder="e.g. America/New_York"
                value={preferences.timezone || ''}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value || null)}
                disabled={updatePreferencesMutation.isPending}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={resetPreferencesMutation.isPending || updatePreferencesMutation.isPending}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updatePreferencesMutation.isPending}
          className="flex items-center gap-2"
        >
          {updatePreferencesMutation.isPending ? (
            <Settings className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Success Message */}
      {updatePreferencesMutation.isSuccess && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Preferences updated successfully!</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}