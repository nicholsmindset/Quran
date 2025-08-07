'use client';

import { Navbar } from '@/components/layout/navbar';
import { EnhancedDashboard } from '@/components/dashboard/enhanced-dashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedDashboard />
      </main>
    </div>
  );
}