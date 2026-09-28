import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/db';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Super-Dashboard | SabiPredict AI',
  description: 'Control panel for AI prediction moderation, Sportsmonks ingestion, LLM settings, and blogging.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login?redirect=/admin');
  }

  if (profile.role !== 'admin') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-[#111C38] p-8 text-center shadow-2xl space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">403 Forbidden</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your account ({profile.email}) has role <code className="text-amber-400 font-bold">{profile.role}</code>.
            Only accounts with <code className="text-rose-400 font-bold">admin</code> permissions are authorized to access the Super-Dashboard.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-[#1C2541] px-4 py-2 text-xs font-bold text-white hover:bg-[#223156]"
            >
              Return to Public Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 pb-16">
      <div className="border-b border-[#1C2541] bg-[#111C38]/90 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">Admin Super-Dashboard</h1>
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-300 border border-rose-500/30">
                  ROOT ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Manage predictions, LLM engine, Sportsmonks, and monetization</p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        {children}
      </main>
    </div>
  );
}
