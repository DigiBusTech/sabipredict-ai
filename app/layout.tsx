import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import { PwaProvider } from '@/components/pwa/PwaContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { getCurrentUserProfile, getSiteBranding } from '@/lib/db';

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#0B132B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'SabiPredict AI | Algorithmic Football Intelligence & Predictions',
  description:
    'Sportsmonks v3 live telemetry, Poisson expected goals (xG), and positive Expected Value (+EV) sports predictions.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SabiPredict',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, branding] = await Promise.all([
    getCurrentUserProfile(),
    getSiteBranding(),
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0B132B] text-slate-100 font-sans selection:bg-[#48CAE4] selection:text-[#0B132B]">
        <LanguageProvider>
          <PwaProvider>
            <Header userProfile={profile} branding={branding} />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomBar userProfile={profile} />
          </PwaProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}




