'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Eye,
  ChevronRight,
  Lightbulb,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PerformanceInsightsProps {
  data: {
    overview: {
      accuracy: number;
      totalAttempts: number;
      correctAnswers: number;
    };
    breakdown: {
      byDifficulty: {
        easy: { accuracy: number; total: number };
        medium: { accuracy: number; total: number };
        hard: { accuracy: number; total: number };
      };
      topSurahs: Array<{
        surah: number;
        accuracy: number;
        total: number;
      }>;
    };
    trends?: {
      accuracyTrend: number;
      recentAccuracy: number;
      isImproving: boolean;
    };
  };
  expanded?: boolean;
}

interface Insight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: string;
  arabicWisdom?: string;
  translation?: string;
}

export function PerformanceInsights({ data, expanded = false }: PerformanceInsightsProps) {
  const insights = generateInsights(data);
  
  const strengthsCount = insights.filter(i => i.type === 'strength').length;
  const weaknessesCount = insights.filter(i => i.type === 'weakness').length;
  const opportunitiesCount = insights.filter(i => i.type === 'opportunity').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Performance Insights</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge variant="success">{strengthsCount} Strengths</Badge>
            <Badge variant="destructive">{weaknessesCount} Areas to Improve</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Overview Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <OverallMetric
            title="Overall Performance"
            value={`${data.overview.accuracy}%`}
            trend={data.trends?.accuracyTrend}
            isGood={data.overview.accuracy >= 70}
          />
          
          <OverallMetric
            title="Learning Velocity"
            value={calculateLearningVelocity(data)}
            isGood={true}
          />
          
          <OverallMetric
            title="Consistency Score"
            value={calculateConsistencyScore(data)}
            isGood={true}
          />
        </div>

        {/* Insights */}
        <div className="space-y-4">
          {(expanded ? insights : insights.slice(0, 4)).map((insight, index) => (
            <InsightCard key={insight.id} insight={insight} index={index} />
          ))}
        </div>

        {!expanded && insights.length > 4 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3 mr-1" />
              View All Insights
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Action Items */}
        {expanded && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
              Recommended Actions
            </h3>
            
            <div className="space-y-2">
              {insights
                .filter(i => i.actionable && i.action)
                .slice(0, 3)
                .map((insight) => (
                  <div key={`action-${insight.id}`} className="flex items-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{insight.action}</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-2">
                      Try Now
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverallMetric({ 
  title, 
  value, 
  trend, 
  isGood 
}: { 
  title: string; 
  value: string; 
  trend?: number; 
  isGood: boolean;
}) {
  return (
    <div className="text-center p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-center space-x-2 mb-1">
        <span className={`text-xl font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
          {value}
        </span>
        
        {trend !== undefined && (
          <div className="flex items-center">
            {trend > 0 ? (
              <ArrowUp className="h-4 w-4 text-green-600" />
            ) : trend < 0 ? (
              <ArrowDown className="h-4 w-4 text-red-600" />
            ) : null}
            
            <span className={`text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">{title}</div>
    </div>
  );
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const getInsightStyle = () => {
    switch (insight.type) {
      case 'strength':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'weakness':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'opportunity':
        return {
          icon: TrendingUp,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'recommendation':
        return {
          icon: Lightbulb,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: Target,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const style = getInsightStyle();
  const IconComponent = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <div className={`p-4 rounded-lg border ${style.bgColor} ${style.borderColor}`}>
        <div className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${style.bgColor}`}>
            <IconComponent className={`h-4 w-4 ${style.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold">{insight.title}</h3>
              
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  insight.impact === 'high' ? 'border-red-300 text-red-700' :
                  insight.impact === 'medium' ? 'border-yellow-300 text-yellow-700' :
                  'border-green-300 text-green-700'
                }`}
              >
                {insight.impact} impact
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {insight.description}
            </p>
            
            {insight.arabicWisdom && insight.translation && (
              <div className="mt-3 p-2 bg-white/50 rounded border border-white/50">
                <div className="arabic-text text-sm text-gray-800 mb-1">
                  {insight.arabicWisdom}
                </div>
                <div className="text-xs text-muted-foreground italic">
                  {insight.translation}
                </div>
              </div>
            )}
            
            {insight.actionable && insight.action && (
              <div className="mt-2 pt-2 border-t border-white/50">
                <p className="text-xs text-gray-700">
                  <strong>Action:</strong> {insight.action}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function generateInsights(data: PerformanceInsightsProps['data']): Insight[] {
  const insights: Insight[] = [];
  
  // Overall Performance Analysis
  if (data.overview.accuracy >= 85) {
    insights.push({
      id: 'high-accuracy',
      type: 'strength',
      title: 'Excellent Accuracy',
      description: `Your ${data.overview.accuracy}% accuracy rate shows strong understanding of Qur'anic concepts.`,
      impact: 'high',
      actionable: false,
      arabicWisdom: 'وَمَن يُؤْتَ الْحِكْمَةَ فَقَدْ أُوتِيَ خَيْرًا كَثِيرًا',
      translation: 'And whoever is given wisdom has certainly been given much good'
    });
  } else if (data.overview.accuracy < 60) {
    insights.push({
      id: 'low-accuracy',
      type: 'weakness',
      title: 'Accuracy Needs Improvement',
      description: `Your ${data.overview.accuracy}% accuracy suggests reviewing fundamental concepts would be beneficial.`,
      impact: 'high',
      actionable: true,
      action: 'Focus on easier difficulty questions first to build confidence',
      arabicWisdom: 'وَاللَّهُ أَخْرَجَكُم مِّن بُطُونِ أُمَّهَاتِكُمْ لَا تَعْلَمُونَ شَيْئًا',
      translation: 'And Allah brought you out of your mothers\' wombs knowing nothing'
    });
  }

  // Difficulty Analysis
  const { easy, medium, hard } = data.breakdown.byDifficulty;
  
  if (easy.accuracy > 85 && medium.accuracy < 70) {
    insights.push({
      id: 'difficulty-gap',
      type: 'opportunity',
      title: 'Ready for Medium Questions',
      description: 'Strong performance on easy questions suggests you\'re ready to tackle more medium-level challenges.',
      impact: 'medium',
      actionable: true,
      action: 'Gradually increase medium difficulty questions in your daily practice'
    });
  }
  
  if (hard.total > 0 && hard.accuracy > 70) {
    insights.push({
      id: 'advanced-learner',
      type: 'strength',
      title: 'Advanced Scholar',
      description: `Impressive ${hard.accuracy}% accuracy on difficult questions demonstrates deep understanding.`,
      impact: 'high',
      actionable: false,
      arabicWisdom: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
      translation: 'And say: My Lord, increase me in knowledge'
    });
  }

  // Volume Analysis
  if (data.overview.totalAttempts < 50) {
    insights.push({
      id: 'low-volume',
      type: 'opportunity',
      title: 'Increase Practice Volume',
      description: 'More regular practice will help reinforce learning and improve retention.',
      impact: 'medium',
      actionable: true,
      action: 'Set a goal to answer at least 5 questions daily'
    });
  } else if (data.overview.totalAttempts > 500) {
    insights.push({
      id: 'dedicated-learner',
      type: 'strength',
      title: 'Dedicated Student',
      description: `${data.overview.totalAttempts} questions completed shows remarkable dedication to learning.`,
      impact: 'high',
      actionable: false,
      arabicWisdom: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
      translation: 'And those who strive for Us - We will surely guide them to Our ways'
    });
  }

  // Trend Analysis
  if (data.trends?.isImproving) {
    insights.push({
      id: 'improving-trend',
      type: 'strength',
      title: 'Positive Learning Trend',
      description: `${data.trends.accuracyTrend}% improvement shows your study methods are working well.`,
      impact: 'medium',
      actionable: false,
      arabicWisdom: 'وَاللَّهُ يُضَاعِفُ لِمَن يَشَاءُ',
      translation: 'And Allah multiplies [reward] for whom He wills'
    });
  } else if (data.trends?.accuracyTrend && data.trends.accuracyTrend < -5) {
    insights.push({
      id: 'declining-trend',
      type: 'weakness',
      title: 'Performance Decline',
      description: 'Recent performance suggests reviewing your study approach or taking a short break.',
      impact: 'medium',
      actionable: true,
      action: 'Review recent mistakes and focus on understanding rather than speed'
    });
  }

  // Surah Performance Analysis
  const topSurahs = data.breakdown.topSurahs || [];
  if (topSurahs.length > 0) {
    const bestSurah = topSurahs[0];
    if (bestSurah.accuracy > 90) {
      insights.push({
        id: 'surah-mastery',
        type: 'strength',
        title: `Surah ${bestSurah.surah} Mastery`,
        description: `Excellent ${bestSurah.accuracy}% accuracy shows deep understanding of this surah's teachings.`,
        impact: 'low',
        actionable: false
      });
    }
  }

  // General Recommendations
  if (insights.filter(i => i.type === 'recommendation').length === 0) {
    insights.push({
      id: 'consistent-practice',
      type: 'recommendation',
      title: 'Maintain Consistent Practice',
      description: 'Regular daily practice is key to long-term retention and spiritual growth.',
      impact: 'high',
      actionable: true,
      action: 'Set up daily reminders for Qur\'an study time',
      arabicWisdom: 'وَاعْبُدْ رَبَّكَ حَتَّىٰ يَأْتِيَكَ الْيَقِينُ',
      translation: 'And worship your Lord until there comes to you the certainty'
    });
  }

  return insights;
}

function calculateLearningVelocity(data: PerformanceInsightsProps['data']): string {
  // Simplified calculation - would use actual time data in production
  const questionsPerWeek = Math.round(data.overview.totalAttempts / 4); // Assuming 4 weeks of data
  return `${questionsPerWeek}/week`;
}

function calculateConsistencyScore(data: PerformanceInsightsProps['data']): string {
  // Simplified calculation - would use actual daily activity data
  const consistency = data.overview.accuracy > 70 ? 85 : 65;
  return `${consistency}%`;
}