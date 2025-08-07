'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { EnhancedDashboard } from '@/components/dashboard/enhanced-dashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export default function DashboardPage() {

  return (
    <ProtectedRoute fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <Link href="/auth">
            <Button variant="islamic">Sign In</Button>
          </Link>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedDashboard />
        </main>
      </div>
    </ProtectedRoute>
  );
}