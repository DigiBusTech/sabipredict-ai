import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { 
  User, Crown, Shield, Calendar, CreditCard, 
  Sparkles, CheckCircle2, ArrowRight, Smartphone, LogOut,
  LayoutDashboard, TrendingUp, MessageSquareQuote, Users, Settings
} from 'lucide-react';
import { getCurrentUserProfile } from '@/lib/db';
import { signOutAction } from '@/app/actions/auth';
import InstallAppButton from '@/components/pwa/InstallAppButton';
import { getRequestLocale } from '@/lib/i18n/server';
import { getPageMetadata } from '@/lib/site-content';

export async function generateMetadata() {
  return getPageMetadata('/account', await getRequestLocale(), {
    title: 'Dashboard | SabiPredict AI',
    description: 'Manage your SabiPredict AI membership and account settings.',
  });
}

export default async function AccountPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login?next=/account');
  }

  const isAdmin = profile.role === 'admin';
  const isVip = profile.role === 'vip_user' || isAdmin;
  const isVipActive = isVip && profile.subscription_status === 'active';

  // Expiration calculation
  const vipUntilDate = profile.vip_until ? new Date(profile.vip_until) : null;
  const now = new Date();
  const daysRemaining = vipUntilDate 
    ? Math.max(0, Math.ceil((vipUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-[#25314D] bg-[#111C38] p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#48CAE4]">Member workspace</p>
          <p className="mt-1 truncate text-sm font-black text-white">{profile.full_name || profile.email}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{isAdmin ? 'Administrator' : isVipActive ? 'Active VIP' : 'Free member'}</p>
        </div>
        <nav aria-label="Dashboard navigation" className="grid grid-cols-2 gap-1 rounded-xl border border-[#25314D] bg-[#111C38] p-2 lg:grid-cols-1">
          {[
            { href: '/account', label: 'Overview', icon: LayoutDashboard },
            { href: '/predictions', label: 'Predictions', icon: TrendingUp },
            { href: '/vip', label: 'VIP Lounge', icon: Crown },
            { href: '/testimonials', label: 'Reviews', icon: MessageSquareQuote },
            ...(isVipActive ? [{ href: '/vip/affiliate', label: 'Affiliate', icon: Users }] : []),
            { href: '/pricing', label: 'Membership plans', icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} aria-current={item.href === '/account' ? 'page' : undefined} className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-[11px] font-bold transition ${item.href === '/account' ? 'bg-[#48CAE4]/12 text-[#48CAE4]' : 'text-slate-300 hover:bg-[#1C2541] hover:text-white'}`}><Icon className="h-4 w-4 shrink-0" />{item.label}</Link>;
          })}
          {isAdmin && <Link href="/admin" className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-[11px] font-bold text-rose-300 hover:bg-rose-500/10"><Settings className="h-4 w-4" />Admin</Link>}
        </nav>
      </aside>
      <main className="min-w-0 space-y-8">
      <header className="flex items-center justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-wider text-[#48CAE4]">SabiPredict workspace</p><h1 className="mt-1 text-2xl font-black text-white">Dashboard</h1></div>
        <span className="hidden rounded-full border border-[#34415E] bg-[#111C38] px-3 py-1 text-[10px] font-bold uppercase text-slate-300 sm:inline-flex">{profile.subscription_status}</span>
      </header>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#1C2541] bg-linear-to-r from-[#111C38] via-[#0B132B] to-[#111C38] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-tr from-[#3A506B] to-[#48CAE4] text-[#0B132B]">
            {profile.avatar_url ? <Image unoptimized src={profile.avatar_url} alt="Profile" width={56} height={56} className="h-full w-full object-cover" /> : isAdmin ? <Shield className="h-7 w-7" /> : isVipActive ? <Crown className="h-7 w-7 text-amber-300" /> : <User className="h-7 w-7 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {profile.full_name || profile.email}
              </h1>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isAdmin 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : isVipActive 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isAdmin ? 'ADMINISTRATOR' : isVipActive ? 'VIP LOUNGE' : 'FREE TIER'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{profile.email}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Account summary">
        <div className="rounded-xl border border-[#25314D] bg-[#111C38] p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Account role</p><p className="mt-1 text-sm font-black text-white">{isAdmin ? 'Admin' : isVipActive ? 'VIP member' : 'Free member'}</p></div>
        <div className="rounded-xl border border-[#25314D] bg-[#111C38] p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Subscription</p><p className="mt-1 text-sm font-black capitalize text-white">{profile.subscription_status}</p></div>
        <div className="rounded-xl border border-[#25314D] bg-[#111C38] p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Plan</p><p className="mt-1 truncate text-sm font-black text-white">{profile.current_plan_id || 'Free Starter'}</p></div>
        <div className="rounded-xl border border-[#25314D] bg-[#111C38] p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Access expiry</p><p className="mt-1 text-sm font-black text-white">{vipUntilDate ? vipUntilDate.toLocaleDateString() : isVipActive ? 'No expiry' : '—'}</p></div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Subscription Status Card */}
        <div className="xl:col-span-2 rounded-xl border border-[#1C2541] bg-[#111C38] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1C2541] pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#48CAE4]" />
              <h2 className="text-base font-bold text-white">Membership & Subscription</h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
              profile.subscription_status === 'active'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {profile.subscription_status}
            </span>
          </div>

          <div className="rounded-2xl border border-[#223156] bg-[#0B132B] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Tier
                </span>
                <span className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                  {isVipActive ? (
                    <>
                      <Crown className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-300">VIP Lounge Member</span>
                    </>
                  ) : (
                    <span>Free Starter Account</span>
                  )}
                </span>
              </div>

              {daysRemaining !== null && isVipActive && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Access Remaining
                  </span>
                  <span className="text-sm font-extrabold text-[#48CAE4]">
                    {daysRemaining} Day{daysRemaining === 1 ? '' : 's'} Left
                  </span>
                </div>
              )}
            </div>

            {vipUntilDate && (
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#111C38] p-3 rounded-xl border border-[#1C2541]">
                <Calendar className="h-4 w-4 text-[#48CAE4]" />
                <span>
                  Valid until:{' '}
                  <strong className="text-white">
                    {vipUntilDate.toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            )}

            {isVipActive ? (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-white block">Active VIP Benefits:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Daily Banker of the Day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>80%+ High-Confidence Value Bets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Pro Telemetry, Form & H2H Charts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Exclusive Injury & Roster Feeds</span>
                  </li>
                </ul>

                <div className="pt-3 flex flex-wrap gap-2">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-4 py-2 text-xs font-black text-[#0B132B] shadow-md hover:brightness-110 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Extend / Renew VIP Plan</span>
                  </Link>
                  <Link
                    href="/vip"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A506B] bg-[#1C2541] px-4 py-2 text-xs font-bold text-slate-200 hover:text-white transition"
                  >
                    <span>Enter VIP Lounge</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upgrade your membership to unlock daily quantitative banker picks, interactive H2H charts, team form breakdowns, and squad injury lists.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-xs font-black text-[#0B132B] shadow-md hover:brightness-110 transition"
                >
                  <Crown className="h-4 w-4" />
                  <span>Upgrade to VIP Lounge</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* PWA Mobile App Card */}
          <div className="rounded-xl border border-[#1C2541] bg-[#111C38] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[#48CAE4]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Mobile Web App</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Install SabiPredict AI on your home screen for instant push notifications and fast access to live betting odds.
            </p>
            <InstallAppButton variant="secondary" />
          </div>

        </div>
      </div>
      </main>
    </div>
  );
}