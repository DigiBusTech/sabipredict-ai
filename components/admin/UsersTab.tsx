'use client';

import React, { useMemo, useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { updateAccountModerationAction } from '@/app/actions/growth';
import { AccountModerationStatus, AdminManagedUser } from '@/lib/types';

export default function UsersTab({ initialUsers }: { initialUsers: AdminManagedUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState('');
  const [statuses, setStatuses] = useState<Record<string, AccountModerationStatus>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    return users.filter((user) => !value || `${user.email} ${user.full_name || ''} ${user.current_plan_id || ''}`.toLowerCase().includes(value));
  }, [query, users]);

  async function saveStatus(user: AdminManagedUser) {
    const status = statuses[user.id] || user.moderation.status;
    const reason = reasons[user.id] ?? user.moderation.reason ?? '';
    if ((status === 'suspended' || status === 'banned') && !window.confirm(`Set ${user.email} to ${status}? Active VIP access will be revoked.`)) return;
    setBusyId(user.id);
    const result = await updateAccountModerationAction({ userId: user.id, status, reason });
    setBusyId(null);
    if (!result.success) {
      setNotice(result.error || 'Account status could not be updated.');
      return;
    }
    setUsers((current) => current.map((item) => item.id === user.id ? {
      ...item,
      moderation: { ...item.moderation, status, reason, updated_at: new Date().toISOString() },
      ...(status === 'suspended' || status === 'banned' ? { role: 'free_user' as const, subscription_status: 'canceled' as const, current_plan_id: null } : {}),
    } : item));
    setNotice(`Account marked ${status}.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-black text-white">Account directory</h2><p className="mt-1 text-xs text-slate-400">Review memberships, referral totals, and account restrictions.</p></div>
        <label className="flex min-h-9 items-center gap-2 rounded-lg border border-[#34415E] bg-[#0B132B] px-3"><Search className="h-3.5 w-3.5 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, plan" className="w-52 bg-transparent text-xs text-white outline-none placeholder:text-slate-600" /></label>
      </div>
      {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
      <div className="overflow-x-auto rounded-xl border border-[#25314D]">
        <table className="w-full min-w-180 text-left text-xs">
          <thead className="bg-[#111C38] text-[10px] uppercase text-slate-400"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Membership</th><th className="px-4 py-3">Referrals</th><th className="px-4 py-3">Account status</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-[#25314D] bg-[#0D172F]">
            {filteredUsers.map((user) => {
              const status = statuses[user.id] || user.moderation.status;
              return <tr key={user.id}>
                <td className="px-4 py-3"><span className="block font-bold text-white">{user.full_name || 'Member'}</span><span className="text-[10px] text-slate-500">{user.email} · {user.role}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-300">{user.current_plan_id || user.subscription_status}</td>
                <td className="px-4 py-3 text-slate-300">{user.referral_count}</td>
                <td className="px-4 py-3">
                  <select value={status} onChange={(event) => setStatuses((current) => ({ ...current, [user.id]: event.target.value as AccountModerationStatus }))} className="rounded-md border border-[#34415E] bg-[#0B132B] px-2 py-1.5 text-[10px] capitalize text-white">
                    <option value="active">Active</option><option value="flagged">Flagged</option><option value="suspended">Suspended</option><option value="banned">Banned</option>
                  </select>
                  <input value={reasons[user.id] ?? user.moderation.reason ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [user.id]: event.target.value }))} maxLength={1000} placeholder="Reason" className="mt-1.5 block w-36 rounded-md border border-[#34415E] bg-[#0B132B] px-2 py-1.5 text-[10px] text-white" />
                </td>
                <td className="px-4 py-3"><button type="button" disabled={busyId === user.id} onClick={() => void saveStatus(user)} className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[#48CAE4] px-3 text-[10px] font-black text-[#0B132B] disabled:opacity-50"><ShieldAlert className="h-3 w-3" /> Save</button></td>
              </tr>;
            })}
            {filteredUsers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No matching accounts.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">This directory does not expose password or authentication credentials. User deletion is intentionally omitted; use the Supabase account lifecycle tools for data-retention-safe deletion.</p>
    </div>
  );
}