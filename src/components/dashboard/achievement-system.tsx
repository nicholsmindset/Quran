'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Award, 
  Crown, 
  Flame, 
  Target, 
  BookOpen, 
  Calendar,
  Users,
  Heart,
  Sparkles,
  Zap,
  Shield,
  Gem,
  ChevronRight,
  Share2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  arabicPhrase?: string;
  translation?: string;
  icon: any;
  color: string;
  bgColor: string;
  category: 'learning' | 'consistency' | 'social' | 'mastery' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  maxProgress?: number;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}

interface AchievementSystemProps {
  achievements?: any[];
  streakData: {
    current: number;
    longest: number;
  };
  expanded?: boolean;
}

export function AchievementSystem({ 
  achievements: serverAchievements, 
  streakData, 
  expanded = false 
}: AchievementSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // Generate comprehensive achievement system
  const achievements = generateAchievements(streakData, serverAchievements);
  
  const categories = [
    { key: 'all', name: 'All', icon: Star },
    { key: 'learning', name: 'Learning', icon: BookOpen },
    { key: 'consistency', name: 'Consistency', icon: Flame },
    { key: 'social', name: 'Social', icon: Users },
    { key: 'mastery', name: 'Mastery', icon: Crown },
    { key: 'special', name: 'Special', icon: Sparkles }
  ];

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false;
    if (showUnlockedOnly && !achievement.unlocked) return false;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);

  return (
    <Card className={`${expanded ? '' : 'h-fit'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span>Islamic Achievements</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {unlockedCount}/{achievements.length}
            </Badge>
            
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {totalXP} XP
            </Badge>
          </div>
        </div>
        
        {expanded && (
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(category => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.key}
                  variant={selectedCategory === category.key ? 'islamic' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.key)}
                >
                  <IconComponent className="h-3 w-3 mr-1" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {expanded && (
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
            >
              {showUnlockedOnly ? 'Show All' : 'Show Unlocked Only'}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-3 w-3 mr-1" />
                Share Progress
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                Download Certificate
              </Button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 ${expanded ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-4`}>
          {(expanded ? filteredAchievements : filteredAchievements.slice(0, 6)).map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>

        {!expanded && filteredAchievements.length > 6 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Achievements
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const [showDetails, setShowDetails] = useState(false);
  const IconComponent = achievement.icon;
  
  const rarityStyles = {
    common: 'border-gray-300 bg-gray-50',
    uncommon: 'border-green-300 bg-green-50',
    rare: 'border-blue-300 bg-blue-50',
    epic: 'border-purple-300 bg-purple-50',
    legendary: 'border-yellow-300 bg-yellow-50 shadow-lg'
  };

  const rarityColors = {
    common: 'text-gray-600',
    uncommon: 'text-green-600',
    rare: 'text-blue-600',
    epic: 'text-purple-600',
    legendary: 'text-yellow-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 ${
          rarityStyles[achievement.rarity]
        } ${
          achievement.unlocked 
            ? 'opacity-100 hover:shadow-md' 
            : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-80'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className={`p-2 rounded-lg ${achievement.bgColor} ${
              achievement.unlocked ? '' : 'opacity-50'
            }`}>
              <IconComponent className={`h-6 w-6 ${achievement.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {achievement.title}
                </h3>
                
                <Badge 
                  variant="outline" 
                  className={`text-xs ${rarityColors[achievement.rarity]}`}
                >
                  {achievement.rarity}
                </Badge>
              </div>
              
              {/* Description */}
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {achievement.description}
              </p>
              
              {/* Progress Bar */}
              {achievement.progress !== undefined && achievement.maxProgress && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.maxProgress) * 100} 
                    className="h-1"
                  />
                </div>
              )}
              
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {achievement.unlocked ? (
                    <>
                      <Badge variant="success" className="text-xs">
                        Unlocked
                      </Badge>
                      {achievement.unlockedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Locked
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-medium">{achievement.xpReward}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expandable Islamic Content */}
          <AnimatePresence>
            {showDetails && achievement.arabicPhrase && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-muted/50"
              >
                <div className="text-center">
                  <div className="arabic-text text-lg text-gray-800 mb-1">
                    {achievement.arabicPhrase}
                  </div>
                  <div className="text-xs text-muted-foreground italic">
                    {achievement.translation}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function generateAchievements(
  streakData: { current: number; longest: number }, 
  serverAchievements?: any[]
): Achievement[] {
  const baseAchievements: Achievement[] = [
    // Learning Category
    {
      id: 'first-question',
      title: 'First Steps',
      description: 'Answer your first Qur\'an question',
      arabicPhrase: 'بِسْمِ اللَّهِ نَبْدَأُ',
      translation: 'In the name of Allah we begin',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      category: 'learning',
      rarity: 'common',
      unlocked: true,
      xpReward: 10
    },
    {
      id: 'hundred-questions',
      title: 'Century Scholar',
      description: 'Answer 100 questions correctly',
      arabicPhrase: 'وَقُل رَّبِّ زِدْنِي عِلْماً',
      translation: 'And say: My Lord, increase me in knowledge',
      icon: Star,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      category: 'learning',
      rarity: 'uncommon',
      unlocked: serverAchievements?.longtimeUser || false,
      progress: 85,
      maxProgress: 100,
      xpReward: 50
    },

    // Consistency Category
    {
      id: 'week-streak',
      title: 'Committed Learner',
      description: 'Complete 7 days in a row',
      arabicPhrase: 'مَن جَدَّ وَجَدَ',
      translation: 'Whoever strives, finds',
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      category: 'consistency',
      rarity: 'uncommon',
      unlocked: streakData.current >= 7 || streakData.longest >= 7,
      xpReward: 30
    },
    {
      id: 'month-streak',
      title: 'Devoted Student',
      description: 'Complete 30 days in a row',
      arabicPhrase: 'الصَّبْرُ مِفْتَاحُ الفَرَجِ',
      translation: 'Patience is the key to relief',
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      category: 'consistency',
      rarity: 'rare',
      unlocked: streakData.current >= 30 || streakData.longest >= 30,
      progress: Math.min(streakData.current, 30),
      maxProgress: 30,
      xpReward: 100
    },
    {
      id: 'hundred-streak',
      title: 'Qur\'an Guardian',
      description: 'Complete 100 days in a row',
      arabicPhrase: 'حَافِظُوا عَلَى الصَّلَوَاتِ',
      translation: 'Guard your prayers',
      icon: Shield,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      category: 'consistency',
      rarity: 'legendary',
      unlocked: streakData.current >= 100 || streakData.longest >= 100,
      progress: Math.min(streakData.current, 100),
      maxProgress: 100,
      xpReward: 500
    },

    // Mastery Category
    {
      id: 'perfect-accuracy',
      title: 'Precision Master',
      description: 'Achieve 100% accuracy on 10+ questions',
      arabicPhrase: 'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ',
      translation: 'Indeed, Allah loves those who do good',
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      category: 'mastery',
      rarity: 'rare',
      unlocked: serverAchievements?.perfectAccuracy || false,
      xpReward: 75
    },
    {
      id: 'surah-master',
      title: 'Surah Specialist',
      description: 'Master all questions from one complete surah',
      arabicPhrase: 'تِلْكَ آيَاتُ اللَّهِ نَتْلُوهَا عَلَيْكَ',
      translation: 'These are the verses of Allah which We recite to you',
      icon: Gem,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      category: 'mastery',
      rarity: 'epic',
      unlocked: false,
      progress: 3,
      maxProgress: 5,
      xpReward: 200
    },

    // Social Category
    {
      id: 'group-member',
      title: 'Community Learner',
      description: 'Join your first learning group',
      arabicPhrase: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ',
      translation: 'Cooperate in righteousness and piety',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      category: 'social',
      rarity: 'common',
      unlocked: false,
      xpReward: 25
    },

    // Special Category
    {
      id: 'ramadan-dedication',
      title: 'Ramadan Devotee',
      description: 'Complete daily learning throughout Ramadan',
      arabicPhrase: 'شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ',
      translation: 'The month of Ramadan in which was revealed the Quran',
      icon: Heart,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      category: 'special',
      rarity: 'legendary',
      unlocked: false,
      xpReward: 1000
    },
    {
      id: 'laylat-al-qadr',
      title: 'Night of Power',
      description: 'Study on the blessed Night of Decree',
      arabicPhrase: 'لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ',
      translation: 'The Night of Decree is better than a thousand months',
      icon: Sparkles,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      category: 'special',
      rarity: 'legendary',
      unlocked: false,
      xpReward: 2000
    }
  ];

  return baseAchievements;
}