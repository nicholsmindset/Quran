'use client';

import { NotificationPreferencesComponent } from '@/components/settings/notification-preferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Settings, 
  ArrowLeft,
  Mail,
  Shield,
  Info
} from 'lucide-react';

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Bell className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-gray-600">Manage your email notifications and preferences</p>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            <Shield className="h-3 w-3 mr-1" />
            Privacy Controlled
          </Badge>
        </div>

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">About Email Notifications</h3>
                <p className="text-sm text-blue-700 mt-1">
                  We respect your privacy and inbox. You can customize exactly which notifications you receive 
                  and how frequently. All emails include an easy unsubscribe link, and you can change these 
                  settings at any time.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-blue-600">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>Powered by secure email service</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>GDPR compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Component */}
        <NotificationPreferencesComponent />

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Tips for Managing Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2" />
                <p><strong>Daily Reminders</strong> help maintain your learning streak and are sent at optimal times based on your timezone.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                <p><strong>Quiet Hours</strong> ensure you don't receive notifications during your specified rest periods.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2" />
                <p><strong>Weekly Summaries</strong> provide insights into your progress and suggest areas for improvement.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2" />
                <p><strong>Group Notifications</strong> keep you updated on classroom activities and assignments.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Transactional</span>
                  <Badge variant="outline" className="text-xs">Always Sent</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Account security, password resets, important account changes
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Educational</span>
                  <Badge variant="secondary" className="text-xs">Customizable</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Daily reminders, progress updates, learning insights
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Social</span>
                  <Badge variant="secondary" className="text-xs">Customizable</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Group activities, assignments, collaboration updates
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Marketing</span>
                  <Badge variant="outline" className="text-xs bg-gray-50">Opt-in Only</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Feature announcements, tips, platform updates
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Islamic Footer */}
        <div className="text-center py-6 border-t border-emerald-200">
          <div className="flex items-center justify-center gap-2 text-emerald-700 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">
              Notifications are designed to support your spiritual journey
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            "And remind, for indeed, the reminder benefits the believers" - Quran 51:55
          </p>
        </div>
      </div>
    </div>
  );
}