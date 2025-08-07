'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Skip authentication and go directly to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold text-emerald-800 mb-4'>
          Qur'an Verse Challenge
        </h1>
        <p className='text-muted-foreground'>Redirecting to dashboard...</p>
      </div>
    </div>
  );
}