'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Loader2, BookOpen } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50'>
      <div className='text-center'>
        <div className='flex items-center justify-center mb-6'>
          <div className='p-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100'>
            <BookOpen className='h-12 w-12 text-emerald-600' />
          </div>
        </div>
        <h1 className='text-3xl font-bold text-emerald-800 mb-4'>
          Qur'an Verse Challenge
        </h1>
        <div className='flex items-center justify-center space-x-2 text-muted-foreground'>
          <Loader2 className='h-5 w-5 animate-spin' />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}