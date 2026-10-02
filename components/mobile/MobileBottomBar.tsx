'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Crown, User, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function MobileBottomBar({
  userProfile,
}: {
  userProfile?: UserProfile | null;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isAdmin = userProfile?.role === 'admin';
  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/predictions', label: t('nav.predictions', 'Predictions'), icon: TrendingUp },
    { href: '/vip', label: t('nav.vipLounge', 'VIP Lounge'), icon: Crown, isVip: true },
    ...(isAdmin
      ? [{ href: '/admin', label: t('nav.adminPanel', 'Admin'), icon: ShieldCheck }]
      : [{ href: userProfile ? '/account' : '/login', label: userProfile ? t('nav.dashboard', 'Dashboard') : t('nav.signIn', 'Sign In'), icon: User }]),
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[#1C2541] bg-[#0B132B]/95 backdrop-blur-lg px-2 py-1.5 safe-area-pb"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname === tab.href || pathname.startsWith(tab.href + '/');

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
                isActive
                  ? 'text-[#48CAE4]'
                  : tab.isVip
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : ''
                  }`}
                />
                {tab.isVip && (
                  <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-[#48CAE4]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-[#48CAE4]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}