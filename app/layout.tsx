import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCurrentUserProfile } from '@/lib/db';

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SabiPredict AI | Algorithmic Football Intelligence & Predictions',
  description:
    'Sportsmonks v3 live telemetry, Poisson expected goals (xG), and positive Expected Value (+EV) sports predictions.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0B132B] text-slate-100 font-sans selection:bg-[#48CAE4] selection:text-[#0B132B]">
        <Header userProfile={profile} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}



