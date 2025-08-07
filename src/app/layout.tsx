import type { Metadata } from 'next';
import { Inter, Markazi_Text } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const markaziText = Markazi_Text({
  variable: '--font-markazi',
  subsets: ['arabic', 'latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Qur\'an Verse Challenge',
  description: 'Interactive Qur\'an learning platform with AI-generated questions',
  keywords: 'Quran, Islamic learning, Arabic, verses, education',
  authors: [{ name: 'Qur\'an Verse Challenge Team' }],
  openGraph: {
    title: 'Qur\'an Verse Challenge',
    description: 'Interactive Qur\'an learning platform with AI-generated questions',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' dir='ltr' className='h-full'>
      <body 
        className={`${
          inter.variable
        } ${markaziText.variable} font-sans antialiased min-h-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950`}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
