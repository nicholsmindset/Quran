'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PrayerTime {
  name: string;
  time: string;
  arabic: string;
  icon: React.ComponentType<any>;
  isPassed: boolean;
  isNext: boolean;
}

export function PrayerTimeWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate prayer times calculation (in a real app, use a library like @adhan/adhan)
    const now = new Date();
    const today = now.toDateString();
    
    const times: PrayerTime[] = [
      {
        name: 'Fajr',
        arabic: 'الفجر',
        time: '05:30',
        icon: Sunrise,
        isPassed: now.getHours() > 5 || (now.getHours() === 5 && now.getMinutes() >= 30),
        isNext: false
      },
      {
        name: 'Dhuhr',
        arabic: 'الظهر',
        time: '12:45',
        icon: Sun,
        isPassed: now.getHours() > 12 || (now.getHours() === 12 && now.getMinutes() >= 45),
        isNext: false
      },
      {
        name: 'Asr',
        arabic: 'العصر',
        time: '15:30',
        icon: Sun,
        isPassed: now.getHours() > 15 || (now.getHours() === 15 && now.getMinutes() >= 30),
        isNext: false
      },
      {
        name: 'Maghrib',
        arabic: 'المغرب',
        time: '18:15',
        icon: Sunset,
        isPassed: now.getHours() > 18 || (now.getHours() === 18 && now.getMinutes() >= 15),
        isNext: false
      },
      {
        name: 'Isha',
        arabic: 'العشاء',
        time: '19:45',
        icon: Moon,
        isPassed: now.getHours() > 19 || (now.getHours() === 19 && now.getMinutes() >= 45),
        isNext: false
      }
    ];

    // Find next prayer
    const nextPrayerIndex = times.findIndex(prayer => !prayer.isPassed);
    if (nextPrayerIndex !== -1) {
      times[nextPrayerIndex].isNext = true;
      setNextPrayer(times[nextPrayerIndex]);
    } else {
      // Next prayer is Fajr of next day
      const nextFajr = { ...times[0], isNext: true };
      setNextPrayer(nextFajr);
    }

    setPrayerTimes(times);
  }, [currentTime]);

  const getTimeUntilNext = () => {
    if (!nextPrayer) return '';
    
    const now = new Date();
    const [hours, minutes] = nextPrayer.time.split(':').map(Number);
    let nextPrayerTime = new Date();
    nextPrayerTime.setHours(hours, minutes, 0, 0);
    
    // If prayer has passed today, set it for tomorrow
    if (nextPrayerTime <= now) {
      nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
    }
    
    const diff = nextPrayerTime.getTime() - now.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-800">
          <Clock className="h-4 w-4" />
          Prayer Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Time */}
        <div className="text-center mb-4">
          <div className="text-lg font-bold text-emerald-900">
            {currentTime.toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
          <div className="text-xs text-emerald-600">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Next Prayer Alert */}
        {nextPrayer && (
          <div className="p-2 bg-emerald-100 rounded-lg border border-emerald-200 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <nextPrayer.icon className="h-4 w-4 text-emerald-700" />
                <span className="text-sm font-medium text-emerald-800">
                  Next: {nextPrayer.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-800">
                  {nextPrayer.time}
                </div>
                <div className="text-xs text-emerald-600">
                  in {getTimeUntilNext()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prayer Times List */}
        <div className="space-y-2">
          {prayerTimes.map((prayer) => (
            <div 
              key={prayer.name} 
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg transition-all",
                prayer.isNext 
                  ? "bg-emerald-200 border border-emerald-300" 
                  : prayer.isPassed
                    ? "bg-gray-100 opacity-60"
                    : "bg-white border border-gray-200"
              )}
            >
              <div className="flex items-center gap-2">
                <prayer.icon className={cn(
                  "h-3 w-3",
                  prayer.isNext ? "text-emerald-700" : 
                  prayer.isPassed ? "text-gray-400" : "text-emerald-600"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  prayer.isNext ? "text-emerald-800" : 
                  prayer.isPassed ? "text-gray-500" : "text-gray-700"
                )}>
                  {prayer.name}
                </span>
                <span className={cn(
                  "text-xs",
                  prayer.isNext ? "text-emerald-600" : 
                  prayer.isPassed ? "text-gray-400" : "text-gray-500"
                )} dir="rtl">
                  {prayer.arabic}
                </span>
              </div>
              <div className={cn(
                "text-sm font-mono",
                prayer.isNext ? "text-emerald-800 font-bold" : 
                prayer.isPassed ? "text-gray-500" : "text-gray-700"
              )}>
                {prayer.time}
              </div>
            </div>
          ))}
        </div>

        {/* Location Info */}
        <div className="text-center pt-2 border-t border-emerald-200">
          <p className="text-xs text-emerald-600">
            📍 Current Location • Times may vary
          </p>
        </div>
      </CardContent>
    </Card>
  );
}