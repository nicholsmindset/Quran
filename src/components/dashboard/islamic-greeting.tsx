'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, Sunrise, Sunset, Star, Heart, Clock, Calendar, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface IslamicGreetingProps {
  user: {
    id: string;
    role: string;
    email: string;
  };
  streakData?: {
    current: number;
    longest: number;
  };
  completedToday?: boolean;
}

interface GreetingConfig {
  greeting: string;
  arabicGreeting: string;
  translation: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  islamicPhrase: string;
  arabicPhrase: string;
  phraseTranslation: string;
}

export function IslamicGreeting({ user, streakData, completedToday }: IslamicGreetingProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hijriDate, setHijriDate] = useState('');
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '' });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Calculate approximate Hijri date
    calculateHijriDate();

    // Get next prayer time (simplified - would use proper prayer time API)
    calculateNextPrayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getGreetingConfig = (): GreetingConfig => {
    const hour = currentTime.getHours();
    const day = currentTime.getDay(); // 0 = Sunday, 5 = Friday

    // Special Friday greeting
    if (day === 5) {
      return {
        greeting: "Jumu'ah Mubarak",
        arabicGreeting: 'جُمُعَة مُبَارَكَة',
        translation: 'Blessed Friday',
        icon: Star,
        color: 'text-yellow-600',
        bgGradient: 'from-yellow-50 to-orange-50',
        islamicPhrase: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّد',
        arabicPhrase: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّد',
        phraseTranslation: 'O Allah, send blessings upon Muhammad',
      };
    }

    // Time-based greetings
    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Sabah al-Khayr',
        arabicGreeting: 'صَبَاح الخَير',
        translation: 'Good morning',
        icon: Sunrise,
        color: 'text-orange-500',
        bgGradient: 'from-orange-50 to-yellow-50',
        islamicPhrase: 'الحَمْدُ لِلَّهِ رَبِّ العَالَمِين',
        arabicPhrase: 'الحَمْدُ لِلَّهِ رَبِّ العَالَمِين',
        phraseTranslation: 'All praise is due to Allah, Lord of all worlds',
      };
    } else if (hour >= 12 && hour < 15) {
      return {
        greeting: 'Dhuhr Mubarak',
        arabicGreeting: 'ظُهْر مُبَارَك',
        translation: 'Blessed noon',
        icon: Sun,
        color: 'text-yellow-600',
        bgGradient: 'from-yellow-50 to-orange-50',
        islamicPhrase: 'لَا إِلَهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ',
        arabicPhrase: 'لَا إِلَهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ',
        phraseTranslation: 'There is no god but Allah, Muhammad is the Messenger of Allah',
      };
    } else if (hour >= 15 && hour < 18) {
      return {
        greeting: 'Asr Mubarak',
        arabicGreeting: 'عَصْر مُبَارَك',
        translation: 'Blessed afternoon',
        icon: Sun,
        color: 'text-amber-600',
        bgGradient: 'from-amber-50 to-orange-50',
        islamicPhrase: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        arabicPhrase: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        phraseTranslation: 'Glory be to Allah and praise be to Him',
      };
    } else if (hour >= 18 && hour < 20) {
      return {
        greeting: "Masa' al-Khayr",
        arabicGreeting: 'مَسَاء الخَير',
        translation: 'Good evening',
        icon: Sunset,
        color: 'text-purple-600',
        bgGradient: 'from-purple-50 to-pink-50',
        islamicPhrase: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        arabicPhrase: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        phraseTranslation:
          'O Allah, help me to remember You, thank You, and worship You in the best way',
      };
    } else {
      return {
        greeting: "Laylah Sa'idah",
        arabicGreeting: 'لَيْلَة سَعِيدَة',
        translation: 'Good night',
        icon: Moon,
        color: 'text-indigo-600',
        bgGradient: 'from-indigo-50 to-purple-50',
        islamicPhrase: 'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا',
        arabicPhrase: 'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا',
        phraseTranslation: 'O Allah, in Your name I die and I live',
      };
    }
  };

  const calculateHijriDate = () => {
    // Simplified Hijri date calculation
    const gregorianDate = new Date();
    const hijriYear = Math.floor(((gregorianDate.getFullYear() - 622) * 365.25) / 354.37) + 1;
    const hijriMonths = [
      'Muharram',
      'Safar',
      "Rabi' al-Awwal",
      "Rabi' al-Thani",
      'Jumada al-Awwal',
      'Jumada al-Thani',
      'Rajab',
      "Sha'ban",
      'Ramadan',
      'Shawwal',
      "Dhu al-Qi'dah",
      'Dhu al-Hijjah',
    ];

    const monthIndex = gregorianDate.getMonth() % 12;
    const day = gregorianDate.getDate();

    setHijriDate(`${day} ${hijriMonths[monthIndex]} ${hijriYear} AH`);
  };

  const calculateNextPrayer = () => {
    const hour = currentTime.getHours();
    const prayers = [
      { name: 'Fajr', time: '05:30' },
      { name: 'Dhuhr', time: '12:30' },
      { name: 'Asr', time: '15:30' },
      { name: 'Maghrib', time: '18:30' },
      { name: 'Isha', time: '20:00' },
    ];

    for (const prayer of prayers) {
      const prayerHour = parseInt(prayer.time.split(':')[0]);
      if (hour < prayerHour) {
        setNextPrayer(prayer);
        return;
      }
    }

    // If past all prayers for today, next is Fajr tomorrow
    setNextPrayer({ name: 'Fajr (Tomorrow)', time: '05:30' });
  };

  const config = getGreetingConfig();
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className={`bg-gradient-to-r ${config.bgGradient} border-opacity-50 shadow-lg`}>
        <CardContent className='p-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            {/* Main Greeting Section */}
            <div className='flex items-center space-x-4'>
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`p-3 bg-white/30 rounded-full backdrop-blur-sm`}
              >
                <IconComponent className={`h-8 w-8 ${config.color}`} />
              </motion.div>

              <div>
                <h1 className='text-2xl lg:text-3xl font-bold text-gray-900 mb-1'>
                  {config.greeting}, {user?.email?.split('@')[0]}!
                </h1>

                <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0'>
                  <div className='arabic-text text-lg text-gray-700'>{config.arabicGreeting}</div>
                  <div className='text-sm text-muted-foreground italic'>{config.translation}</div>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className='flex flex-wrap items-center gap-2'>
              {/* Streak Badge */}
              {streakData.current > 0 && (
                <Badge variant='secondary' className='bg-white/40 backdrop-blur-sm'>
                  <Flame className='h-3 w-3 mr-1 text-orange-500' />
                  {streakData.current} day streak
                </Badge>
              )}

              {/* Today's Status */}
              {completedToday ? (
                <Badge variant='success' className='bg-green-100/70 text-green-800'>
                  <Heart className='h-3 w-3 mr-1' />
                  Today Complete
                </Badge>
              ) : (
                <Badge variant='outline' className='bg-white/40 backdrop-blur-sm'>
                  <Clock className='h-3 w-3 mr-1' />
                  Ready to Start
                </Badge>
              )}

              {/* Prayer Time */}
              {nextPrayer.name && (
                <Badge variant='outline' className='bg-white/40 backdrop-blur-sm text-purple-700'>
                  <Star className='h-3 w-3 mr-1' />
                  {nextPrayer.name} at {nextPrayer.time}
                </Badge>
              )}
            </div>
          </div>

          {/* Islamic Phrase of the Moment */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className='mt-6 p-4 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30'
          >
            <div className='text-center'>
              <div className='arabic-text text-xl text-gray-800 mb-2'>{config.arabicPhrase}</div>
              <div className='text-sm text-gray-600 italic'>{config.phraseTranslation}</div>
            </div>
          </motion.div>

          {/* Time & Date Information */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-white/30'>
            <div className='flex items-center space-x-4 text-sm text-gray-600'>
              <div className='flex items-center space-x-1'>
                <Calendar className='h-4 w-4' />
                <span>
                  {currentTime.toLocaleDateString('en', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className='hidden sm:block'>•</div>

              <div>
                <span className='font-medium'>{hijriDate}</span>
              </div>
            </div>

            <div className='text-sm text-gray-600 mt-2 sm:mt-0'>
              <span className='font-medium'>
                {currentTime.toLocaleTimeString('en', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
