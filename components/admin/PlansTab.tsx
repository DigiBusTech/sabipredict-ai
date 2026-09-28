'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types';
import { saveSubscriptionPlanAction, deleteSubscriptionPlanAction } from '@/app/actions/subscription';

export default function PlansTab({ plans }: { plans: SubscriptionPlan[] }) {
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const plan: SubscriptionPlan = {
      id: (fd.get('id') as string) || `plan_${Date.now()}`,
      name: fd.get('name') as string,
      price: parseFloat((fd.get('price') as string) || '0'),
      currency: 'USD',
      interval: (fd.get('interval') as any) || 'monthly',
      features: (fd.get('features') as string).split('\n').map((s) => s.trim()).filter(Boolean),
      is_active: fd.get('is_active') === 'true',
    };
    try {
      await saveSubscriptionPlanAction(plan);
      setMsg('Plan saved.');
      setEditingPlan(null);
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete plan?')) return;
    await deleteSubscriptionPlanAction(id);
    setMsg('Deleted.');
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-[#111C38] p-4 border border-[#1C2541]">
        <div>
          <h2 className="text-base font-black text-white">Subscription & Plan Management</h2>
          <p className="text-xs text-slate-400">Configure Free and VIP Lounge tier pricing and features.</p>
        </div>
        <button
          onClick={() => setEditingPlan({ id: `plan_${Date.now()}`, name: '', price: 29.99, interval: 'monthly', features: [], is_active: true })}
          className="rounded-xl bg-[#48CAE4] px-3.5 py-2 text-xs font-bold text-[#0B132B]"
        >
          + New Plan
        </button>
      </div>

      {msg && <p className="text-xs text-emerald-400">{msg}</p>}

      {editingPlan && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#223156] bg-[#111C38] p-5 space-y-3 text-xs">
          <div className="flex justify-between font-bold text-white">
            <span>Edit Plan</span>
            <button type="button" onClick={() => setEditingPlan(null)}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="id" defaultValue={editingPlan.id} placeholder="Plan ID" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="name" defaultValue={editingPlan.name} placeholder="Plan Name" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
            <input name="price" type="number" step="0.01" defaultValue={editingPlan.price} placeholder="Price" required className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white" />
          </div>
          <select name="interval" defaultValue={editingPlan.interval} className="rounded-xl bg-[#0B132B] border border-[#223156] px-3 py-2 text-white">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <textarea name="features" defaultValue={editingPlan.features?.join('\n')} rows={3} placeholder="Features (one per line)..." className="w-full rounded-xl bg-[#0B132B] border border-[#223156] p-2 text-white" />
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-1.5 text-slate-300">
              <input type="checkbox" name="is_active" value="true" defaultChecked={editingPlan.is_active !== false} />
              <span>Active</span>
            </label>
            <button type="submit" disabled={loading} className="rounded-xl bg-[#48CAE4] px-4 py-1.5 font-bold text-[#0B132B]">Save Plan</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="rounded-2xl border border-[#1C2541] bg-[#111C38] p-4 text-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-white">{p.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{p.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
              </div>
              <p className="text-xl font-black text-white">${Number(p.price).toFixed(2)} /{p.interval}</p>
            </div>
            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-[#1C2541]">
              <button onClick={() => setEditingPlan(p)} className="p-1 text-slate-300 hover:text-white"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => handleDelete(p.id)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
