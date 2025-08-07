'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Crescent, Star, BookOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

interface IslamicDate {
  day: number;
  month: number;
  monthName: string;
  monthNameArabic: string;
  year: number;
  weekday: string;
  weekdayArabic: string;
}

interface IslamicEvent {
  name: string;
  nameArabic: string;
  description: string;
  type: 'holy' | 'significant' | 'reminder';
}

export function IslamicCalendarWidget() {
  const [islamicDate, setIslamicDate] = useState<IslamicDate | null>(null);
  const [todayEvents, setTodayEvents] = useState<IslamicEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<IslamicEvent[]>([]);

  useEffect(() => {
    // Simulate Islamic date calculation (in a real app, use a proper Islamic calendar library)
    const now = new Date();
    
    // Simple approximation - in production, use libraries like @date-fns/hijri or similar
    const gregorianYear = now.getFullYear();
    const islamicYear = gregorianYear - 579; // Rough approximation
    
    const islamicMonths = [
      { name: 'Muharram', arabic: 'مُحَرَّم' },
      { name: 'Safar', arabic: 'صَفَر' },
      { name: 'Rabi al-Awwal', arabic: 'رَبِيع الأَوَّل' },
      { name: 'Rabi al-Thani', arabic: 'رَبِيع الثَّانِي' },
      { name: 'Jumada al-Awwal', arabic: 'جُمَادَى الأَوَّل' },
      { name: 'Jumada al-Thani', arabic: 'جُمَادَى الثَّانِي' },
      { name: 'Rajab', arabic: 'رَجَب' },
      { name: 'Shaban', arabic: 'شَعْبَان' },
      { name: 'Ramadan', arabic: 'رَمَضَان' },
      { name: 'Shawwal', arabic: 'شَوَّال' },
      { name: 'Dhu al-Qidah', arabic: 'ذُو القِعْدَة' },
      { name: 'Dhu al-Hijjah', arabic: 'ذُو الحِجَّة' }
    ];\n    \n    const islamicWeekdays = [\n      { name: 'Sunday', arabic: 'الأحد' },\n      { name: 'Monday', arabic: 'الإثنين' },\n      { name: 'Tuesday', arabic: 'الثلاثاء' },\n      { name: 'Wednesday', arabic: 'الأربعاء' },\n      { name: 'Thursday', arabic: 'الخميس' },\n      { name: 'Friday', arabic: 'الجمعة' },\n      { name: 'Saturday', arabic: 'السبت' }\n    ];\n\n    // Rough calculation (in production, use proper Islamic calendar conversion)\n    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);\n    const islamicMonth = Math.floor(dayOfYear / 29.5) % 12;\n    const islamicDay = Math.floor(dayOfYear % 29.5) + 1;\n    \n    setIslamicDate({\n      day: islamicDay,\n      month: islamicMonth + 1,\n      monthName: islamicMonths[islamicMonth].name,\n      monthNameArabic: islamicMonths[islamicMonth].arabic,\n      year: islamicYear,\n      weekday: islamicWeekdays[now.getDay()].name,\n      weekdayArabic: islamicWeekdays[now.getDay()].arabic\n    });\n\n    // Simulate events based on current date\n    const currentEvents: IslamicEvent[] = [];\n    const upcoming: IslamicEvent[] = [];\n\n    // Add some sample events based on the date\n    if (now.getDay() === 5) { // Friday\n      currentEvents.push({\n        name: 'Jumu\\'ah Prayer',\n        nameArabic: 'صلاة الجمعة',\n        description: 'Congregational Friday prayer',\n        type: 'holy'\n      });\n    }\n\n    // Sample upcoming events\n    upcoming.push(\n      {\n        name: 'Last 10 Nights of Ramadan',\n        nameArabic: 'العشر الأواخر من رمضان',\n        description: 'Period of increased worship and seeking Laylat al-Qadr',\n        type: 'holy'\n      },\n      {\n        name: 'Day of Arafah',\n        nameArabic: 'يوم عرفة',\n        description: 'Day of fasting and supplication',\n        type: 'significant'\n      },\n      {\n        name: 'Islamic New Year',\n        nameArabic: 'رأس السنة الهجرية',\n        description: 'Beginning of new Islamic year',\n        type: 'significant'\n      }\n    );\n\n    setTodayEvents(currentEvents);\n    setUpcomingEvents(upcoming.slice(0, 3));\n  }, []);\n\n  const getEventIcon = (type: string) => {\n    switch (type) {\n      case 'holy': return Star;\n      case 'significant': return Crescent;\n      default: return BookOpen;\n    }\n  };\n\n  const getEventColor = (type: string) => {\n    switch (type) {\n      case 'holy': return 'text-yellow-600 bg-yellow-50 border-yellow-200';\n      case 'significant': return 'text-blue-600 bg-blue-50 border-blue-200';\n      default: return 'text-gray-600 bg-gray-50 border-gray-200';\n    }\n  };\n\n  if (!islamicDate) return null;\n\n  return (\n    <Card className=\"border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50\">\n      <CardHeader className=\"pb-3\">\n        <CardTitle className=\"text-sm font-medium flex items-center gap-2 text-blue-800\">\n          <Calendar className=\"h-4 w-4\" />\n          Islamic Calendar\n        </CardTitle>\n      </CardHeader>\n      <CardContent className=\"space-y-4\">\n        {/* Current Islamic Date */}\n        <div className=\"text-center\">\n          <div className=\"text-lg font-bold text-blue-900\">\n            {islamicDate.day} {islamicDate.monthName}\n          </div>\n          <div className=\"text-sm text-blue-700\" dir=\"rtl\">\n            {islamicDate.day} {islamicDate.monthNameArabic}\n          </div>\n          <div className=\"text-xs text-blue-600 mt-1\">\n            {islamicDate.year} AH • {islamicDate.weekday}\n          </div>\n          <div className=\"text-xs text-blue-600\" dir=\"rtl\">\n            {islamicDate.weekdayArabic}\n          </div>\n        </div>\n\n        {/* Today's Events */}\n        {todayEvents.length > 0 && (\n          <div className=\"space-y-2\">\n            <h4 className=\"text-sm font-medium text-blue-800 flex items-center gap-1\">\n              <Star className=\"h-3 w-3\" />\n              Today\n            </h4>\n            {todayEvents.map((event, index) => {\n              const EventIcon = getEventIcon(event.type);\n              return (\n                <div \n                  key={index}\n                  className={cn(\n                    \"p-2 rounded-lg border\",\n                    getEventColor(event.type)\n                  )}\n                >\n                  <div className=\"flex items-center gap-2\">\n                    <EventIcon className=\"h-3 w-3\" />\n                    <div>\n                      <div className=\"text-sm font-medium\">{event.name}</div>\n                      <div className=\"text-xs\" dir=\"rtl\">{event.nameArabic}</div>\n                    </div>\n                  </div>\n                  <p className=\"text-xs mt-1 opacity-80\">\n                    {event.description}\n                  </p>\n                </div>\n              );\n            })}\n          </div>\n        )}\n\n        {/* Upcoming Events */}\n        <div className=\"space-y-2\">\n          <h4 className=\"text-sm font-medium text-blue-800 flex items-center gap-1\">\n            <Crescent className=\"h-3 w-3\" />\n            Upcoming\n          </h4>\n          <div className=\"space-y-2\">\n            {upcomingEvents.map((event, index) => {\n              const EventIcon = getEventIcon(event.type);\n              return (\n                <div \n                  key={index}\n                  className=\"p-2 bg-white bg-opacity-50 rounded-lg border border-blue-100\"\n                >\n                  <div className=\"flex items-center justify-between\">\n                    <div className=\"flex items-center gap-2\">\n                      <EventIcon className=\"h-3 w-3 text-blue-600\" />\n                      <div>\n                        <div className=\"text-xs font-medium text-blue-800\">\n                          {event.name}\n                        </div>\n                        <div className=\"text-xs text-blue-600\" dir=\"rtl\">\n                          {event.nameArabic}\n                        </div>\n                      </div>\n                    </div>\n                    <Badge \n                      variant=\"outline\" \n                      className=\"text-xs px-2 py-0 bg-blue-50 text-blue-600 border-blue-200\"\n                    >\n                      {event.type}\n                    </Badge>\n                  </div>\n                </div>\n              );\n            })}\n          </div>\n        </div>\n\n        {/* Islamic Calendar Note */}\n        <div className=\"text-center pt-2 border-t border-blue-200\">\n          <p className=\"text-xs text-blue-600\">\n            🌙 Islamic dates may vary by location\n          </p>\n        </div>\n      </CardContent>\n    </Card>\n  );\n}