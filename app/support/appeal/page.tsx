import { redirect } from 'next/navigation';
import AppealForm from '@/components/AppealForm';
import { getCurrentUserProfile } from '@/lib/db';
import { getUserAppeals, getUserModeration } from '@/lib/growth';

export const metadata = { title: 'Account Appeal | SabiPredict AI' };

export default async function AppealPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect('/login');
  if (profile.role === 'admin') redirect('/admin');

  const [moderation, appeals] = await Promise.all([
    getUserModeration(profile.id),
    getUserAppeals(profile.id),
  ]);
  if (!moderation || moderation.status === 'active') redirect('/account');

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-2"><p className="text-[10px] font-black uppercase tracking-wider text-rose-300">Support center</p><h1 className="text-2xl font-black text-white">Request an account review</h1><p className="text-sm leading-relaxed text-slate-400">Submit an appeal for the moderation team. Your account remains restricted while the appeal is reviewed.</p></header>
      <AppealForm moderation={moderation} appeals={appeals} />
    </div>
  );
}