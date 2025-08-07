'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  Settings,
  Bell,
  Globe
} from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  language: z.enum(['en', 'ar'], { required_error: 'Please select a language' }),
  timezone: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    dailyReminders: true,
    weeklyProgress: true,
    achievements: true,
    newFeatures: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.email?.split('@')[0] || '',
      bio: '',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been successfully updated.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'scholar': return 'destructive';
      case 'teacher': return 'secondary';
      case 'learner': return 'success';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'scholar': return Shield;
      case 'teacher': return User;
      case 'learner': return User;
      default: return User;
    }
  };

  if (!user) {
    return null;
  }

  const RoleIcon = getRoleIcon(user.role);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg">
                    {user.email.split('@')[0]}
                  </CardTitle>
                  <div className="flex justify-center mt-2">
                    <Badge 
                      variant={getRoleBadgeVariant(user.role)}
                      className="capitalize"
                    >
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {user.email}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Member since {user.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-emerald-600" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          {...register('displayName')}
                          className="focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors.displayName && (
                          <p className="text-sm text-destructive">
                            {errors.displayName.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="language">Preferred Language</Label>
                        <select 
                          id="language"
                          {...register('language')}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                        </select>
                        {errors.language && (
                          <p className="text-sm text-destructive">
                            {errors.language.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio (Optional)</Label>
                      <textarea
                        id="bio"
                        rows={3}
                        {...register('bio')}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        placeholder="Tell us a bit about yourself..."
                      />
                      {errors.bio && (
                        <p className="text-sm text-destructive">{errors.bio.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        {...register('timezone')}
                        className="focus:ring-emerald-500 focus:border-emerald-500"
                        readOnly
                      />
                    </div>

                    <Button 
                      type="submit" 
                      variant="islamic" 
                      disabled={isLoading}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-emerald-600" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, enabled]) => {
                      const labels = {
                        dailyReminders: 'Daily study reminders',
                        weeklyProgress: 'Weekly progress reports',
                        achievements: 'Achievement notifications',
                        newFeatures: 'New feature announcements',
                      };
                      
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {labels[key as keyof typeof labels]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {key === 'dailyReminders' && 'Get reminded to study daily'}
                              {key === 'weeklyProgress' && 'Receive your weekly learning summary'}
                              {key === 'achievements' && 'Get notified when you unlock new achievements'}
                              {key === 'newFeatures' && 'Stay updated on new app features'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                              enabled ? 'bg-emerald-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Account Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-emerald-600" />
                    <span>Account Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Export Data</p>
                        <p className="text-xs text-muted-foreground">
                          Download all your learning data
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                      <div>
                        <p className="text-sm font-medium text-red-800">Delete Account</p>
                        <p className="text-xs text-red-600">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}