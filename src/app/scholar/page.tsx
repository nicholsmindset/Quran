'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModerationDashboard } from '@/components/scholar/moderation-dashboard';
import { useAuthStore } from '@/store/auth';

export default function ScholarPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        router.push('/auth');
        return;
      }

      if (user.role !== 'scholar') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, mounted, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'scholar') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Scholar Moderation Dashboard
          </h1>
          <p className="text-gray-600">
            Review and moderate AI-generated questions for Islamic authenticity and accuracy
          </p>
        </div>

        <ModerationDashboard scholarId={user.id} />
      </div>
    </div>
  );
}