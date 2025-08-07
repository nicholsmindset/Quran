'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  BookOpen, 
  Award, 
  Target, 
  Users, 
  Trophy, 
  Flame,
  Star,
  CheckCircle,
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: string;
  type: 'quiz_completed' | 'streak_milestone' | 'achievement_unlocked' | 'group_joined' | 'assignment_completed' | 'daily_goal_completed';
  title: string;
  description: string;
  timestamp: Date;
  score?: number;
  metadata?: any;
}

interface RecentActivityFeedProps {
  activities: any[];
  maxItems?: number;
}

export function RecentActivityFeed({ activities: rawActivities, maxItems = 10 }: RecentActivityFeedProps) {
  // Convert and enhance activity data
  const activities = enhanceActivities(rawActivities || []).slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Start learning to see your activity here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-emerald-600" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <ActivityCard key={activity.id} activity={activity} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity, index }: { activity: ActivityItem; index: number }) {
  const { icon: IconComponent, color, bgColor } = getActivityStyle(activity.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="group"
    >
      <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
        {/* Activity Icon */}
        <div className={`p-2 rounded-full ${bgColor} group-hover:scale-110 transition-transform`}>
          <IconComponent className={`h-4 w-4 ${color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Activity Header */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
              {activity.title}
            </h3>
            
            {activity.score && (
              <Badge 
                variant={activity.score >= 80 ? 'success' : activity.score >= 60 ? 'secondary' : 'destructive'}
                className="text-xs ml-2"
              >
                {activity.score}%
              </Badge>
            )}
          </div>
          
          {/* Activity Description */}
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {activity.description}
          </p>
          
          {/* Activity Metadata */}
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <span>{formatRelativeTime(activity.timestamp)}</span>
            
            {activity.metadata?.surah && (
              <>
                <span>•</span>
                <span className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Surah {activity.metadata.surah}
                </span>
              </>
            )}
            
            {activity.metadata?.difficulty && (
              <>
                <span>•</span>
                <span className={`capitalize ${
                  activity.metadata.difficulty === 'hard' ? 'text-red-600' :
                  activity.metadata.difficulty === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {activity.metadata.difficulty}
                </span>
              </>
            )}
            
            {activity.metadata?.groupName && (
              <>
                <span>•</span>
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {activity.metadata.groupName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getActivityStyle(type: ActivityItem['type']) {
  const styles = {
    quiz_completed: {
      icon: BookOpen,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    streak_milestone: {
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    achievement_unlocked: {
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    group_joined: {
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    assignment_completed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    daily_goal_completed: {
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  };
  
  return styles[type] || styles.quiz_completed;
}

function enhanceActivities(rawActivities: any[]): ActivityItem[] {
  const activities: ActivityItem[] = [];
  
  // Generate sample activities if no real data
  if (rawActivities.length === 0) {
    const now = new Date();
    const sampleActivities = [
      {
        id: '1',
        type: 'quiz_completed' as const,
        title: 'Daily Quiz Completed',
        description: 'Answered 15/20 questions correctly from Surah Al-Baqarah',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        score: 75,
        metadata: { surah: 'Al-Baqarah', difficulty: 'medium' }
      },
      {
        id: '2',
        type: 'streak_milestone' as const,
        title: 'Week Streak Achieved!',
        description: '7 days of consistent learning - keep up the excellent work!',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        metadata: { streakDays: 7 }
      },
      {
        id: '3',
        type: 'achievement_unlocked' as const,
        title: 'Achievement Unlocked: Century Scholar',
        description: 'Successfully answered 100 Qur\'an questions',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        metadata: { achievementType: 'learning' }
      },
      {
        id: '4',
        type: 'daily_goal_completed' as const,
        title: 'Daily Goal Completed',
        description: 'Completed all 5 daily questions with 90% accuracy',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        score: 90,
        metadata: { questionsCompleted: 5 }
      },
      {
        id: '5',
        type: 'quiz_completed' as const,
        title: 'Perfect Score!',
        description: 'Achieved 100% on Surah Al-Fatihah questions',
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        score: 100,
        metadata: { surah: 'Al-Fatihah', difficulty: 'easy' }
      }
    ];
    
    activities.push(...sampleActivities);
  } else {
    // Transform real activity data
    rawActivities.forEach((raw, index) => {
      let activityType: ActivityItem['type'] = 'quiz_completed';
      let title = 'Quiz Activity';
      let description = 'Completed learning activity';
      
      if (raw.type === 'quiz_completed') {
        activityType = 'quiz_completed';
        title = `Quiz Completed: ${raw.title || 'Daily Quiz'}`;
        description = raw.description || `${raw.correct || 0} questions answered correctly`;
      } else if (raw.type === 'streak') {
        activityType = 'streak_milestone';
        title = raw.title || 'Streak Milestone';
        description = raw.description || 'Consistency milestone achieved';
      } else if (raw.type === 'achievement') {
        activityType = 'achievement_unlocked';
        title = raw.title || 'Achievement Unlocked';
        description = raw.description || 'New achievement earned';
      }
      
      activities.push({
        id: raw.id || `activity-${index}`,
        type: activityType,
        title,
        description,
        timestamp: new Date(raw.timestamp || raw.answered_at || raw.created_at || Date.now()),
        score: raw.score || raw.accuracy || undefined,
        metadata: raw.metadata || {}
      });
    });
  }
  
  // Sort by timestamp (newest first)
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
}