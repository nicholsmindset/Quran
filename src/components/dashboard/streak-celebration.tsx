'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  Star, 
  Trophy, 
  Sparkles, 
  Heart,
  Crown,
  X,
  Share2,
  Download
} from 'lucide-react';

interface StreakCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  streakType: string;
}

interface CelebrationConfig {
  title: string;
  subtitle: string;
  arabicDua: string;
  translationDua: string;
  icon: any;
  color: string;
  bgGradient: string;
  particles: string[];
}

const celebrationConfigs: Record<string, CelebrationConfig> = {
  beginner: {
    title: 'First Steps! 🌱',
    subtitle: 'You\'ve started your beautiful journey',
    arabicDua: 'بَارَكَ اللَّهُ فِيكَ',
    translationDua: 'May Allah bless you',
    icon: Star,
    color: 'text-green-600',
    bgGradient: 'from-green-100 to-emerald-100',
    particles: ['✨', '🌟', '⭐']
  },
  committed: {
    title: 'Week Strong! 💪',
    subtitle: 'A full week of dedication - SubhanAllah!',
    arabicDua: 'مَا شَاءَ اللَّهُ تَبَارَكَ اللَّهُ',
    translationDua: 'What Allah wills, blessed is Allah',
    icon: Flame,
    color: 'text-orange-600',
    bgGradient: 'from-orange-100 to-yellow-100',
    particles: ['🔥', '⚡', '🌟']
  },
  dedicated: {
    title: 'Two Weeks! 🎯',
    subtitle: 'Your consistency is inspiring',
    arabicDua: 'اللَّهُمَّ بَارِكْ لَنَا',
    translationDua: 'O Allah, bless us',
    icon: Trophy,
    color: 'text-blue-600',
    bgGradient: 'from-blue-100 to-indigo-100',
    particles: ['🏆', '🎯', '💎']
  },
  champion: {
    title: 'Month Champion! 👑',
    subtitle: 'A full month of Islamic learning',
    arabicDua: 'رَبِّ زِدْنِي عِلْماً',
    translationDua: 'My Lord, increase me in knowledge',
    icon: Crown,
    color: 'text-purple-600',
    bgGradient: 'from-purple-100 to-pink-100',
    particles: ['👑', '💜', '✨', '🌟']
  },
  master: {
    title: 'Quran Master! 📚',
    subtitle: '50 days of devoted study - Amazing!',
    arabicDua: 'اللَّهُمَّ عَلِّمْنِي مَا يَنْفَعُنِي',
    translationDua: 'O Allah, teach me what benefits me',
    icon: Sparkles,
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-100 to-purple-100',
    particles: ['📚', '🌟', '💫', '⭐', '✨']
  },
  legendary: {
    title: 'Legendary Scholar! 🏛️',
    subtitle: '100 days! You are an inspiration to us all',
    arabicDua: 'وَقُل رَّبِّ زِدْنِي عِلْماً',
    translationDua: 'And say: My Lord, increase me in knowledge',
    icon: Heart,
    color: 'text-rose-600',
    bgGradient: 'from-rose-100 to-pink-100',
    particles: ['🏛️', '📿', '🌙', '⭐', '✨', '💎']
  }
};

export function StreakCelebration({ 
  isOpen, 
  onClose, 
  streakCount, 
  streakType 
}: StreakCelebrationProps) {
  const [showParticles, setShowParticles] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);
  
  const config = celebrationConfigs[streakType] || celebrationConfigs.beginner;
  const IconComponent = config.icon;

  useEffect(() => {
    if (isOpen) {
      setShowParticles(true);
      
      // Create floating particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        emoji: config.particles[i % config.particles.length],
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setParticles(newParticles);

      // Auto-close after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, config.particles]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Qur\'an Learning Streak Achievement!',
        text: `Alhamdulillah! I've completed ${streakCount} days of Qur'an study! 🌟`,
        url: window.location.origin
      });
    }
  };

  const handleDownload = () => {
    // Create a simple certificate image (would integrate with canvas or image generation)
    const link = document.createElement('a');
    link.download = `quran-streak-${streakCount}-days.png`;
    link.href = '/api/certificates/generate'; // Would implement certificate generation
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative"
          >
            <Card className={`w-full max-w-md bg-gradient-to-br ${config.bgGradient} border-0 shadow-2xl overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              
              {/* Floating Particles */}
              {showParticles && particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute text-2xl pointer-events-none"
                  style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 180, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: particle.id * 0.2
                  }}
                >
                  {particle.emoji}
                </motion.div>
              ))}

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>

              <CardContent className="p-8 text-center relative z-10">
                {/* Main Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity
                  }}
                  className={`mx-auto mb-6 p-4 rounded-full bg-white/30 backdrop-blur-sm w-fit`}
                >
                  <IconComponent className={`h-12 w-12 ${config.color}`} />
                </motion.div>

                {/* Streak Count */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="mb-4"
                >
                  <Badge 
                    variant="secondary" 
                    className="px-6 py-2 text-2xl font-bold bg-white/40 backdrop-blur-sm"
                  >
                    <Flame className="h-6 w-6 mr-2 text-orange-500" />
                    {streakCount} Days
                  </Badge>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold text-gray-800 mb-2"
                >
                  {config.title}
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-gray-700 mb-6"
                >
                  {config.subtitle}
                </motion.p>

                {/* Islamic Dua */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6 p-4 bg-white/30 rounded-lg backdrop-blur-sm"
                >
                  <div className="arabic-text text-2xl text-gray-800 mb-2">
                    {config.arabicDua}
                  </div>
                  <div className="text-sm text-gray-600 italic">
                    {config.translationDua}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center justify-center space-x-3"
                >
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="sm"
                    className="bg-white/40 backdrop-blur-sm hover:bg-white/60"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="bg-white/40 backdrop-blur-sm hover:bg-white/60"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Certificate
                  </Button>
                  
                  <Button
                    onClick={onClose}
                    variant="islamic"
                    size="sm"
                    className="shadow-lg"
                  >
                    Continue Learning
                  </Button>
                </motion.div>

                {/* Motivational Text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-6 text-sm text-gray-600"
                >
                  <p className="mb-2">
                    "And whoever relies upon Allah - then He is sufficient for him."
                  </p>
                  <p className="text-xs italic">
                    - Quran 65:3
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}