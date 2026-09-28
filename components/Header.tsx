'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  TrendingUp, Crown, BookOpen, ShieldCheck, Menu, X, 
  CreditCard, LogOut, UserCheck, Activity 
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { signOutAction } from '@/app/actions/auth';

export default function Header({ userProfile }: { userProfile?: UserProfile | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isAdmin = userProfile?.role === 'admin';
  const isVip = userProfile?.role === 'vip_user' || isAdmin;

  const links = [
    { href: '/predictions', label: 'Predictions', icon: TrendingUp },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
    { href: '/vip', label: 'VIP Lounge', icon: Crown },
    { href: '/blog', label: 'Blog', icon: BookOpen },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel', icon: ShieldCheck, admin: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#1C2541] bg-[#0B132B]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-tr from-[#3A506B] to-[#48CAE4] text-[#0B132B]">
            <Activity className="h-4 w-4 stroke-[2.5]" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            SabiPredict <span className="text-[#48CAE4]">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#1C2541] text-[#48CAE4] border border-[#3A506B]'
                    : link.admin
                    ? 'text-rose-400 hover:bg-rose-950/30'
                    : 'text-slate-300 hover:bg-[#1C2541] hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-[#1C2541] px-3 py-1.5 border border-[#3A506B]">
                <UserCheck className="h-3.5 w-3.5 text-[#48CAE4]" />
                <span className="text-xs text-slate-200">{userProfile.full_name || userProfile.email}</span>
                <span className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded ${
                  isAdmin ? 'bg-rose-500/20 text-rose-300' : isVip ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isAdmin ? 'ADMIN' : isVip ? 'VIP' : 'FREE'}
                </span>
              </div>
              <form action={signOutAction}>
                <button type="submit" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2541]">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white">
                Sign In
              </Link>
              <Link href="/signup" className="rounded-xl bg-[#48CAE4] px-3.5 py-1.5 text-xs font-bold text-[#0B132B] hover:bg-[#00B4D8]">
                Get Started
              </Link>
            </div>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="p-1.5 text-slate-400 md:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-b border-[#1C2541] bg-[#0B132B] px-4 py-3 md:hidden space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-[#1C2541] rounded-lg"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
