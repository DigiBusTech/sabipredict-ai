'use client';

import React, { useState } from 'react';
import { 
  Bell, Mail, RefreshCw, Send, CheckCircle2, XCircle, 
  Clock, ShieldAlert, Sparkles, Filter 
} from 'lucide-react';
import { UserProfile, SubscriptionReminderLog, SubscriptionReminderStage } from '@/lib/types';
import { 
  processDueRemindersAction, 
  sendSingleReminderAction, 
  sendTestReminderEmailAction 
} from '@/app/actions/reminders';

export default function RemindersTab({
  vipProfiles,
  reminderLogs,
}: {
  vipProfiles: UserProfile[];
  reminderLogs: SubscriptionReminderLog[];
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testStage, setTestStage] = useState<SubscriptionReminderStage>('5_days');
  const [showTestForm, setShowTestForm] = useState(false);

  const now = new Date();

  // Expiration calculations
  const expiringWithin5Days = vipProfiles.filter((p) => {
    if (!p.vip_until) return false;
    const diffDays = Math.ceil((new Date(p.vip_until).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 5;
  });

  const expiringWithin3Days = vipProfiles.filter((p) => {
    if (!p.vip_until) return false;
    const diffDays = Math.ceil((new Date(p.vip_until).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  });

  const expiringToday = vipProfiles.filter((p) => {
    if (!p.vip_until) return false;
    const diffDays = Math.ceil((new Date(p.vip_until).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  });

  const handleProcessDue = async () => {
    setLoading('process');
    try {
      const res = await processDueRemindersAction();
      setMsg({ text: res.message });
      setTimeout(() => setMsg(null), 5000);
    } catch (err: any) {
      setMsg({ text: err.message, error: true });
    } finally {
      setLoading(null);
    }
  };

  const handleSendSingle = async (userId: string, stage: SubscriptionReminderStage) => {
    setLoading(userId);
    try {
      const res = await sendSingleReminderAction(userId, stage);
      setMsg({ text: res.message || res.error || 'Processed', error: !res.success });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ text: err.message, error: true });
    } finally {
      setLoading(null);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('test');
    try {
      const res = await sendTestReminderEmailAction(testEmail, testStage);
      setMsg({ text: res.message || res.error || 'Processed', error: !res.success });
      if (res.success) setShowTestForm(false);
      setTimeout(() => setMsg(null), 5000);
    } catch (err: any) {
      setMsg({ text: err.message, error: true });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#111C38] p-4 border border-[#1C2541]">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-black text-white">Subscription Renewal Email System</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated 3-stage delivery: <strong>5 days</strong>, <strong>3 days</strong>, and <strong>on exact expiry date</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTestForm(!showTestForm)}
            className="flex items-center gap-1.5 rounded-xl border border-[#3A506B] bg-[#1C2541] px-3.5 py-2 font-semibold text-slate-200 hover:text-white"
          >
            <Mail className="h-3.5 w-3.5 text-[#48CAE4]" />
            <span>Send Test Email</span>
          </button>

          <button
            disabled={loading === 'process'}
            onClick={handleProcessDue}
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 px-4 py-2 font-black text-[#0B132B] hover:brightness-110 disabled:opacity-50 shadow-md"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading === 'process' ? 'animate-spin' : ''}`} />
            <span>Process All Due Reminders</span>
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl border font-bold ${
            msg.error
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Test Email Form */}
      {showTestForm && (
        <form onSubmit={handleSendTest} className="rounded-2xl border border-[#223156] bg-[#111C38] p-4 space-y-3">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" /> Dispatch Test Renewal Email
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Destination test email (e.g. your email)"
              required
              className="flex-1 min-w-60 rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white font-mono"
            />
            <select
              value={testStage}
              onChange={(e) => setTestStage(e.target.value as any)}
              className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white"
            >
              <option value="5_days">5-Day Expiry Notice</option>
              <option value="3_days">3-Day Expiry Notice</option>
              <option value="exact_day">Exact Expiry Day Notice</option>
            </select>
            <button
              type="submit"
              disabled={loading === 'test'}
              className="flex items-center gap-1.5 rounded-xl bg-[#48CAE4] px-4 py-2 font-bold text-[#0B132B]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{loading === 'test' ? 'Sending...' : 'Send Test'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTestForm(false)}
              className="px-3 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Active VIPs</span>
          <div className="text-xl font-black text-white">{vipProfiles.length}</div>
        </div>
        <div className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 space-y-1">
          <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider">Expiring in 5 Days</span>
          <div className="text-xl font-black text-amber-300">{expiringWithin5Days.length}</div>
        </div>
        <div className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 space-y-1">
          <span className="text-orange-400 text-[10px] uppercase font-bold tracking-wider">Expiring in 3 Days</span>
          <div className="text-xl font-black text-orange-300">{expiringWithin3Days.length}</div>
        </div>
        <div className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 space-y-1">
          <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider">Expiring Today / Overdue</span>
          <div className="text-xl font-black text-rose-300">{expiringToday.length}</div>
        </div>
      </div>

      {/* Upcoming Expirations List */}
      <div className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1C2541] pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#48CAE4]" /> Upcoming VIP Expirations
          </h3>
          <span className="text-slate-400 text-[11px]">{vipProfiles.length} VIP Accounts Found</span>
        </div>

        {vipProfiles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-[#223156] rounded-xl">
            No VIP subscriptions currently registered in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1C2541] text-[10px] uppercase font-bold text-slate-400">
                  <th className="pb-2">User / Email</th>
                  <th className="pb-2">VIP Expiry Date</th>
                  <th className="pb-2">Time Left</th>
                  <th className="pb-2 text-right">Manual Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2541]">
                {vipProfiles.map((p) => {
                  const expiry = p.vip_until ? new Date(p.vip_until) : null;
                  const diffDays = expiry
                    ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <tr key={p.id} className="hover:bg-[#0B132B]/40 transition">
                      <td className="py-2.5">
                        <div className="font-bold text-white">{p.full_name || 'VIP Member'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.email}</div>
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {expiry ? expiry.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never set'}
                      </td>
                      <td className="py-2.5">
                        {diffDays !== null ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            diffDays <= 1
                              ? 'bg-rose-500/20 text-rose-300'
                              : diffDays <= 3
                              ? 'bg-orange-500/20 text-orange-300'
                              : diffDays <= 5
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {diffDays <= 0 ? 'Expired' : `${diffDays} Day${diffDays === 1 ? '' : 's'}`}
                          </span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={loading === p.id}
                            onClick={() => handleSendSingle(p.id, '5_days')}
                            className="rounded-lg bg-[#0B132B] border border-[#223156] px-2 py-1 text-[10px] font-semibold text-slate-300 hover:text-amber-300"
                          >
                            5-Day
                          </button>
                          <button
                            disabled={loading === p.id}
                            onClick={() => handleSendSingle(p.id, '3_days')}
                            className="rounded-lg bg-[#0B132B] border border-[#223156] px-2 py-1 text-[10px] font-semibold text-slate-300 hover:text-orange-300"
                          >
                            3-Day
                          </button>
                          <button
                            disabled={loading === p.id}
                            onClick={() => handleSendSingle(p.id, 'exact_day')}
                            className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-2 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30"
                          >
                            Final
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reminder Audit Logs Table */}
      <div className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1C2541] pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#48CAE4]" /> Sent Email Reminder Logs
          </h3>
          <span className="text-slate-400 text-[11px]">{reminderLogs.length} Records</span>
        </div>

        {reminderLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-[#223156] rounded-xl">
            No reminder emails dispatched yet. Click &quot;Process All Due Reminders&quot; or send a test email.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1C2541] text-[10px] uppercase font-bold text-slate-400">
                  <th className="pb-2">Recipient</th>
                  <th className="pb-2">Stage</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Sent Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2541]">
                {reminderLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#0B132B]/40 transition">
                    <td className="py-2.5 font-mono text-slate-200">{log.email}</td>
                    <td className="py-2.5">
                      <span className="rounded bg-[#0B132B] px-2 py-0.5 text-[10px] font-bold border border-[#223156] uppercase text-[#48CAE4]">
                        {log.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        log.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {log.status === 'sent' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
