'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Compass, 
  BookOpen, 
  Target, 
  Clock, 
  Star,
  ArrowRight,
  Calendar,
  Zap,
  Brain,
  Heart,
  CheckCircle,
  Play,
  Eye,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LearningPathRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'study_plan' | 'topic_focus' | 'difficulty_adjustment' | 'review_schedule' | 'spiritual_growth';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  actionItems: string[];
  islamicWisdom?: string;
  translation?: string;
  progress?: number;
  maxProgress?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'memorization' | 'comprehension' | 'application' | 'reflection';
}

interface LearningPathRecommendationsProps {
  recommendations: any[];
  expanded?: boolean;
}

export function LearningPathRecommendations({ 
  recommendations: serverRecommendations, 
  expanded = false 
}: LearningPathRecommendationsProps) {
  // Generate enhanced recommendations
  const recommendations = generateRecommendations(serverRecommendations);
  
  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
  const totalEstimatedTime = recommendations.reduce((sum, r) => sum + r.estimatedTime, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Compass className="h-5 w-5 text-blue-600" />
            <span>Learning Path Recommendations</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="text-xs">
              {highPriorityCount} High Priority
            </Badge>
            
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {totalEstimatedTime}min total
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {recommendations.length === 0 ? (
          <EmptyRecommendations />
        ) : (
          <div className="space-y-4">
            {(expanded ? recommendations : recommendations.slice(0, 3)).map((recommendation, index) => (
              <RecommendationCard 
                key={recommendation.id} 
                recommendation={recommendation} 
                index={index} 
              />
            ))}
          </div>
        )}

        {!expanded && recommendations.length > 3 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3 mr-1" />
              View All Recommendations
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {expanded && (
          <div className="mt-6 pt-6 border-t">
            <LearningPathSummary recommendations={recommendations} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ 
  recommendation, 
  index 
}: { 
  recommendation: LearningPathRecommendation; 
  index: number;
}) {
  const getTypeStyle = () => {
    switch (recommendation.type) {
      case 'study_plan':
        return {
          icon: Calendar,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'topic_focus':
        return {
          icon: Target,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'difficulty_adjustment':
        return {
          icon: Brain,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'review_schedule':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'spiritual_growth':
        return {
          icon: Heart,
          color: 'text-rose-600',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200'
        };
      default:
        return {
          icon: BookOpen,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getPriorityStyle = () => {
    switch (recommendation.priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const style = getTypeStyle();
  const IconComponent = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <div className={`p-4 rounded-lg border ${style.bgColor} ${style.borderColor} hover:shadow-md transition-shadow cursor-pointer group`}>
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${style.bgColor} group-hover:scale-110 transition-transform`}>
            <IconComponent className={`h-5 w-5 ${style.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold group-hover:text-emerald-600 transition-colors">
                {recommendation.title}
              </h3>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={`text-xs ${getPriorityStyle()}`}>
                  {recommendation.priority}
                </Badge>
                
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {recommendation.estimatedTime}min
                </Badge>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {recommendation.description}
            </p>
            
            {/* Progress Bar (if applicable) */}
            {recommendation.progress !== undefined && recommendation.maxProgress && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {recommendation.progress}/{recommendation.maxProgress}
                  </span>
                </div>
                <Progress 
                  value={(recommendation.progress / recommendation.maxProgress) * 100} 
                  className="h-1"
                />
              </div>
            )}
            
            {/* Action Items */}
            <div className="mb-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Action Items:
              </div>
              <ul className="space-y-1">
                {recommendation.actionItems.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="text-xs flex items-start space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
                
                {recommendation.actionItems.length > 2 && (
                  <li className="text-xs text-muted-foreground">
                    +{recommendation.actionItems.length - 2} more actions
                  </li>
                )}
              </ul>
            </div>
            
            {/* Islamic Wisdom */}
            {recommendation.islamicWisdom && recommendation.translation && (
              <div className="mb-3 p-2 bg-white/50 rounded border border-white/50">
                <div className="arabic-text text-sm text-gray-800 mb-1">
                  {recommendation.islamicWisdom}
                </div>
                <div className="text-xs text-muted-foreground italic">
                  {recommendation.translation}
                </div>
              </div>
            )}
            
            {/* Action Button */}
            <div className="flex items-center justify-between pt-2 border-t border-white/50">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {recommendation.category}
                </Badge>
                
                <Badge variant="outline" className={`text-xs ${
                  recommendation.difficulty === 'hard' ? 'text-red-600 border-red-300' :
                  recommendation.difficulty === 'medium' ? 'text-yellow-600 border-yellow-300' :
                  'text-green-600 border-green-300'
                }`}>
                  {recommendation.difficulty}
                </Badge>
              </div>
              
              <Button size="sm" variant="islamic" className="group-hover:scale-105 transition-transform">
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LearningPathSummary({ recommendations }: { recommendations: LearningPathRecommendation[] }) {
  const categoryStats = recommendations.reduce((acc, rec) => {
    acc[rec.category] = (acc[rec.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityStats = recommendations.reduce((acc, rec) => {
    acc[rec.priority] = (acc[rec.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-4 flex items-center">
        <Star className="h-4 w-4 mr-2 text-yellow-500" />
        Learning Path Summary
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">By Category</h4>
          <div className="space-y-2">
            {Object.entries(categoryStats).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="capitalize">{category}</span>
                <Badge variant="secondary" className="text-xs">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
        
        {/* Priority Breakdown */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">By Priority</h4>
          <div className="space-y-2">
            {Object.entries(priorityStats).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between text-sm">
                <span className="capitalize">{priority}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    priority === 'high' ? 'text-red-600 border-red-300' :
                    priority === 'medium' ? 'text-yellow-600 border-yellow-300' :
                    'text-green-600 border-green-300'
                  }`}
                >
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2">
        <Button variant="islamic" size="sm">
          <Zap className="h-3 w-3 mr-1" />
          Start High Priority
        </Button>
        
        <Button variant="outline" size="sm">
          <Calendar className="h-3 w-3 mr-1" />
          Create Schedule
        </Button>
        
        <Button variant="outline" size="sm">
          <Target className="h-3 w-3 mr-1" />
          Set Goals
        </Button>
      </div>
    </div>
  );
}

function EmptyRecommendations() {
  return (
    <div className="text-center py-8">
      <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
        <Compass className="h-8 w-8 text-blue-600" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Personalized Recommendations Coming Soon</h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
        Continue your learning journey, and we'll provide personalized recommendations based on your progress.
      </p>
      
      <Button variant="islamic">
        <Play className="h-4 w-4 mr-2" />
        Start Learning
      </Button>
    </div>
  );
}

function generateRecommendations(serverRecommendations: any[]): LearningPathRecommendation[] {
  // If server recommendations exist, use them
  if (serverRecommendations && serverRecommendations.length > 0) {
    return serverRecommendations.map(rec => ({
      id: rec.id,
      title: rec.title,
      description: rec.description,
      type: rec.type,
      priority: rec.priority,
      estimatedTime: rec.estimatedTime,
      actionItems: rec.actionItems,
      islamicWisdom: rec.islamicWisdom,
      translation: rec.translation,
      progress: rec.progress,
      maxProgress: rec.maxProgress,
      difficulty: rec.difficulty || 'medium',
      category: rec.category || 'comprehension'
    }));
  }

  // Generate sample recommendations
  return [
    {
      id: 'morning-routine',
      title: 'Establish Morning Qur\'an Routine',
      description: 'Start your day with 15 minutes of Qur\'an study to build consistency and spiritual connection.',
      type: 'study_plan',
      priority: 'high',
      estimatedTime: 15,
      actionItems: [
        'Set a consistent wake-up time',
        'Create a dedicated study space',
        'Begin with 5 verses daily',
        'Track your daily progress'
      ],
      islamicWisdom: 'وَالْغَادِيَاتِ عَصْرًا',
      translation: 'By those who run in the morning',
      difficulty: 'easy',
      category: 'application'
    },
    
    {
      id: 'difficult-concepts',
      title: 'Master Challenging Concepts',
      description: 'Focus on verses and concepts where you\'ve shown difficulty to strengthen understanding.',
      type: 'topic_focus',
      priority: 'high',
      estimatedTime: 30,
      actionItems: [
        'Review previous incorrect answers',
        'Study tafsir for difficult verses',
        'Practice similar question types',
        'Seek guidance from scholars'
      ],
      progress: 3,
      maxProgress: 10,
      difficulty: 'hard',
      category: 'comprehension'
    },
    
    {
      id: 'memorization-plan',
      title: 'Structured Memorization Path',
      description: 'Follow a systematic approach to memorizing shorter surahs with proper tajweed.',
      type: 'study_plan',
      priority: 'medium',
      estimatedTime: 45,
      actionItems: [
        'Start with Surah Al-Fatihah perfection',
        'Learn 3 verses daily',
        'Practice proper pronunciation',
        'Regular revision schedule'
      ],
      islamicWisdom: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ',
      translation: 'And We have certainly made the Quran easy for remembrance',
      progress: 5,
      maxProgress: 20,
      difficulty: 'medium',
      category: 'memorization'
    },
    
    {
      id: 'reflection-practice',
      title: 'Daily Reflection and Contemplation',
      description: 'Develop deeper spiritual connection through thoughtful contemplation of verses.',
      type: 'spiritual_growth',
      priority: 'medium',
      estimatedTime: 20,
      actionItems: [
        'Choose one verse for daily reflection',
        'Journal about personal applications',
        'Connect verses to daily life',
        'Share insights with community'
      ],
      islamicWisdom: 'أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ',
      translation: 'Do they not contemplate the Quran?',
      difficulty: 'easy',
      category: 'reflection'
    },
    
    {
      id: 'spaced-repetition',
      title: 'Implement Spaced Repetition',
      description: 'Use scientifically-proven spaced repetition to improve long-term retention of Qur\'anic knowledge.',
      type: 'review_schedule',
      priority: 'low',
      estimatedTime: 25,
      actionItems: [
        'Review questions from 1 day ago',
        'Review questions from 1 week ago',
        'Review questions from 1 month ago',
        'Adjust intervals based on performance'
      ],
      difficulty: 'medium',
      category: 'application'
    }
  ];
}