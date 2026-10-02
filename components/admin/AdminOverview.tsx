'use client';

import React from 'react';
import { Activity, CircleDollarSign, FileCheck2, ShieldAlert, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AccountAppeal, AdminManagedUser, AffiliatePayoutRequest, BlogPost, PendingSubscription, Prediction, Testimonial, WinningTicket } from '@/lib/types';

const chartColors = ['#48CAE4', '#F4B942', '#65C890', '#EF6B73'];

export default function AdminOverview({
  users,
  predictions,
  payments,
  tickets,
  testimonials,
  appeals,
  payouts,
  posts,
  asOf,
}: {
  users: AdminManagedUser[];
  predictions: Prediction[];
  payments: PendingSubscription[];
  tickets: WinningTicket[];
  testimonials: Testimonial[];
  appeals: AccountAppeal[];
  payouts: AffiliatePayoutRequest[];
  posts: BlogPost[];
  asOf: string;
}) {
  const activeVip = users.filter((user) => user.role === 'vip_user' && user.subscription_status === 'active').length;
  const newMembers = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(asOf);
    date.setMonth(date.getMonth() - (5 - offset), 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
      month: date.toLocaleDateString('en', { month: 'short' }),
      count: users.filter((user) => {
        const created = new Date(user.created_at);
        return created.getFullYear() === year && created.getMonth() === month;
      }).length,
    };
  });
  const predictionOutcomes = ['Won', 'Lost', 'Pending', 'Void'].map((outcome, index) => ({
    name: outcome,
    value: predictions.filter((prediction) => prediction.prediction_outcome === outcome).length,
    fill: chartColors[index],
  }));
  const pendingQueue = payments.filter((item) => item.status === 'pending').length +
    tickets.filter((item) => item.status === 'pending').length +
    testimonials.filter((item) => item.status === 'pending').length +
    appeals.filter((item) => item.status === 'pending').length +
    payouts.filter((item) => item.status === 'pending').length;

  const metrics = [
    { label: 'Total members', value: users.length, icon: Users, tint: 'text-[#48CAE4]' },
    { label: 'Active VIP', value: activeVip, icon: CircleDollarSign, tint: 'text-amber-300' },
    { label: 'Approved predictions', value: predictions.filter((item) => item.status === 'approved').length, icon: Activity, tint: 'text-emerald-300' },
    { label: 'Items awaiting review', value: pendingQueue, icon: ShieldAlert, tint: 'text-rose-300' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#48CAE4]">System overview</p><h2 className="mt-1 text-xl font-black text-white">Operations dashboard</h2></div><p className="text-[11px] text-slate-500">Snapshot from current database records</p></header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => { const Icon = metric.icon; return <article key={metric.label} className="rounded-xl border border-[#25314D] bg-[#111C38] p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{metric.label}</p><Icon className={`h-4 w-4 ${metric.tint}`} /></div><p className="mt-3 text-2xl font-black text-white">{metric.value.toLocaleString()}</p></article>; })}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-xl border border-[#25314D] bg-[#111C38] p-4 sm:p-5"><div className="mb-4"><h3 className="text-sm font-black text-white">New members</h3><p className="mt-1 text-[10px] text-slate-500">Monthly profile creation counts</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={newMembers} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#25314D" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#0B132B', border: '1px solid #33415F', borderRadius: 8, color: '#F8FAFC' }} /><Bar dataKey="count" name="Members" fill="#48CAE4" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></article>
        <article className="rounded-xl border border-[#25314D] bg-[#111C38] p-4 sm:p-5"><div className="mb-2"><h3 className="text-sm font-black text-white">Prediction outcomes</h3><p className="mt-1 text-[10px] text-slate-500">Recorded results in predictions</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={predictionOutcomes} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84} paddingAngle={3} stroke="none" /> <Tooltip contentStyle={{ background: '#0B132B', border: '1px solid #33415F', borderRadius: 8, color: '#F8FAFC' }} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-2">{predictionOutcomes.map((item) => <span key={item.name} className="flex items-center gap-2 text-[10px] text-slate-400"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />{item.name}: {item.value}</span>)}</div></article>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Pending payments', payments.filter((item) => item.status === 'pending').length],
          ['Pending tickets', tickets.filter((item) => item.status === 'pending').length],
          ['Pending testimonials', testimonials.filter((item) => item.status === 'pending').length],
          ['Published articles', posts.filter((post) => post.published).length],
        ].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl border border-[#25314D] bg-[#111C38] px-4 py-3"><span className="text-xs text-slate-400">{label}</span><span className="text-sm font-black text-white">{value}</span><FileCheck2 className="h-4 w-4 text-slate-600" /></div>)}
      </section>
    </div>
  );
}